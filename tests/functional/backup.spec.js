const { test, expect } = require('../support/fixtures');

const PROFILES = 'cendekia.profiles.v1';

// A device that already has two children with some progress, and the parent page open.
async function seed(page, setup) {
  await page.addInitScript(() => sessionStorage.setItem('cendekia.parent', '1'));
  await page.goto('/parents/');
  await page.evaluate(setup);
  await page.reload();
}

const twoChildren = () => {
  localStorage.setItem('cendekia.profiles.v1', JSON.stringify({ cur: 'pa', list: [
    { id: 'pa', name: 'Sari', avatar: '🦁', limit: 30 },
    { id: 'pb', name: 'Budi', avatar: '🐯', limit: 0 }
  ] }));
  localStorage.setItem('baca.v1.pa', JSON.stringify({ stars: 10, best: { a: 3, b: 2 }, day: '2026-11-01', streak: 2 }));
  localStorage.setItem('logika.v3.pa', JSON.stringify({ best: { easy: { w1: [3, 1, 0] } } }));
  localStorage.setItem('cendekia.log.v1.pa', JSON.stringify([{ t: 1000, app: 'baca', stage: 'a', stars: 3, right: 5, total: 5, ms: 1 }]));
  localStorage.setItem('numeria.v1.pb', JSON.stringify({ stars: 4, best: { 'k.1': 2 } }));
  localStorage.setItem('cendekia.lang.v1', 'en');
};

async function download(page) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save a backup file' }).click()]);
  return { name: dl.suggestedFilename(), body: JSON.parse(await require('fs').promises.readFile(await dl.path(), 'utf8')) };
}

const pick = (page, content, name = 'backup.json') =>
  page.locator('#backupFile').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)) });

test('saving a backup downloads every child and only their keys', async ({ page }) => {
  await seed(page, twoChildren);
  const { name, body } = await download(page);
  expect(name).toMatch(/^cendekia-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(body.app).toBe('cendekia-backup');
  expect(body.version).toBe(1);
  expect(body.children.map((c) => c.name)).toEqual(['Sari', 'Budi']);
  expect(Object.keys(body.data).sort()).toEqual(['baca.v1.pa', 'cendekia.log.v1.pa', 'logika.v3.pa', 'numeria.v1.pb']);
});

test('a new device restores a backup, and the blank first child is not kept', async ({ page, browser }) => {
  await seed(page, twoChildren);
  const { body } = await download(page);

  const fresh = await (await browser.newContext()).newPage();
  await fresh.addInitScript(() => sessionStorage.setItem('cendekia.parent', '1'));
  await fresh.goto('/parents/');
  await pick(fresh, body);
  await expect(fresh.locator('#backupKids li')).toHaveText(['🦁 Sari · 1 round', '🐯 Budi · 0 rounds']);
  await fresh.getByRole('button', { name: 'Merge with this device' }).click();

  await expect(fresh.locator('#backupNote')).toContainText('Restored');
  await expect(fresh.locator('#tabs .tab')).toHaveText(['🦁Sari', '🐯Budi']);
  const baca = await fresh.evaluate(() => JSON.parse(localStorage.getItem('baca.v1.pa')));
  expect(baca.stars).toBe(10);
  expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('cendekia.profiles.v1')).list.map((p) => p.limit))).toEqual([30, 0]);
});

test('merging keeps the higher stars, level by level, and both logs', async ({ page }) => {
  await seed(page, twoChildren);
  await pick(page, {
    app: 'cendekia-backup', version: 1,
    children: [{ id: 'pa', name: 'Other name', avatar: '🐼', limit: 0 }],
    data: {
      'baca.v1.pa': { stars: 4, best: { a: 1, c: 3 }, day: '2026-11-20', streak: 5 },
      'logika.v3.pa': { best: { easy: { w1: [1, 3, 2] } } },
      'cendekia.log.v1.pa': [{ t: 500, app: 'baca', stage: 'z', stars: 1, right: 1, total: 5, ms: 1 }, { t: 1000, app: 'baca', stage: 'a', stars: 3, right: 5, total: 5, ms: 1 }]
    }
  });
  await page.getByRole('button', { name: 'Merge with this device' }).click();
  await expect(page.locator('#backupNote')).toContainText('Restored');

  const got = await page.evaluate(() => ({
    baca: JSON.parse(localStorage.getItem('baca.v1.pa')),
    logika: JSON.parse(localStorage.getItem('logika.v3.pa')),
    log: JSON.parse(localStorage.getItem('cendekia.log.v1.pa')),
    profiles: JSON.parse(localStorage.getItem('cendekia.profiles.v1'))
  }));
  expect(got.baca).toEqual({ stars: 10, best: { a: 3, b: 2, c: 3 }, day: '2026-11-20', streak: 5 });
  expect(got.logika.best.easy.w1).toEqual([3, 3, 2]);
  expect(got.log.map((e) => e.t)).toEqual([500, 1000]);
  expect(got.profiles.list.map((p) => p.name)).toEqual(['Sari', 'Budi']); // this device keeps its own names
});

test('replacing everything swaps this device for the file', async ({ page }) => {
  await seed(page, twoChildren);
  await pick(page, {
    app: 'cendekia-backup', version: 1,
    children: [{ id: 'pz', name: 'Zara', avatar: '🐼', limit: 0 }],
    data: { 'omnia.v1.pz': { stars: 7 } }
  });
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Replace everything' }).click();
  await expect(page.locator('#backupNote')).toContainText('Restored');

  await expect(page.locator('#tabs .tab')).toHaveText(['🐼Zara']);
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys).toContain('omnia.v1.pz');
  expect(keys).not.toContain('baca.v1.pa');
  expect(keys).not.toContain('numeria.v1.pb');
});

test('cancelling the replace question leaves the device as it was', async ({ page }) => {
  await seed(page, twoChildren);
  await pick(page, { app: 'cendekia-backup', version: 1, children: [{ id: 'pz', name: 'Zara' }], data: {} });
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: 'Replace everything' }).click();
  await expect(page.locator('#tabs .tab')).toHaveText(['🦁Sari', '🐯Budi']);
});

test('a file cannot write settings or keys of other children', async ({ page }) => {
  await seed(page, twoChildren);
  await pick(page, {
    app: 'cendekia-backup', version: 1,
    children: [{ id: 'pa', name: 'Sari' }],
    data: { 'cendekia.lang.v1': 'id', 'cendekia.a11y.v1': { calm: 'on' }, 'baca.v1.pb': { stars: 999 }, 'evil.v1.pa': 1, 'baca.v1.pa': { stars: 11 } }
  });
  await page.getByRole('button', { name: 'Merge with this device' }).click();
  await expect(page.locator('#backupNote')).toContainText('Restored');
  const got = await page.evaluate(() => ({ lang: localStorage.getItem('cendekia.lang.v1'), a11y: localStorage.getItem('cendekia.a11y.v1'), evil: localStorage.getItem('evil.v1.pa'), pb: localStorage.getItem('baca.v1.pb'), pa: JSON.parse(localStorage.getItem('baca.v1.pa')).stars }));
  expect(got).toEqual({ lang: 'en', a11y: null, evil: null, pb: null, pa: 11 });
});

test.describe('files that are not a usable backup', () => {
  const cases = {
    'text that is not JSON': 'hello',
    'JSON from something else': { app: 'other', version: 1, children: [], data: {} },
    'a backup without children': { app: 'cendekia-backup', version: 1, children: [], data: {} },
  };
  for (const [name, content] of Object.entries(cases)) {
    test(`${name} is refused and nothing changes`, async ({ page }) => {
      await seed(page, twoChildren);
      const before = await page.evaluate(() => JSON.stringify(localStorage));
      await pick(page, content);
      await expect(page.locator('#backupNote')).toHaveText('This is not a Cendekia backup file.');
      await expect(page.locator('#backupPreview')).toBeHidden();
      expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
    });
  }

  test('a backup from a newer version asks to update', async ({ page }) => {
    await seed(page, twoChildren);
    await pick(page, { app: 'cendekia-backup', version: 2, children: [{ id: 'pa', name: 'Sari' }], data: {} });
    await expect(page.locator('#backupNote')).toContainText('newer version');
  });

  test('a huge file is refused', async ({ page }) => {
    await seed(page, twoChildren);
    await pick(page, 'x'.repeat(5 * 1024 * 1024 + 1));
    await expect(page.locator('#backupNote')).toContainText('too big');
  });

  test('cancel closes the preview', async ({ page }) => {
    await seed(page, twoChildren);
    await pick(page, { app: 'cendekia-backup', version: 1, children: [{ id: 'pz', name: 'Zara' }], data: {} });
    await expect(page.locator('#backupPreview')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#backupPreview')).toBeHidden();
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).list.length, PROFILES)).toBe(2);
  });
});
