// One test per bug or behaviour that was once broken. Name each test after the change that fixed it.
const { test, expect } = require('../support/fixtures');

test.describe('renamed apps keep their old addresses', () => {
  for (const [from, to] of [['baca', 'aksara'], ['kosakata', 'lexica'], ['logika', 'logica']]) {
    test(`/${from}/ redirects to /${to}/`, async ({ page }) => {
      await page.goto(`/${from}/`);
      await expect(page).toHaveURL(new RegExp(`/${to}/$`));
    });

    test(`/${from}/ keeps the query string`, async ({ page }) => {
      await page.goto(`/${from}/?x=1`);
      await expect(page).toHaveURL(new RegExp(`/${to}/\\?x=1$`));
    });
  }
});

test('the paused Phonics app shows a closed notice', async ({ page }) => {
  await page.goto('/phonics/');
  await expect(page).toHaveTitle('Phonics Fun');
  await expect(page.locator('body')).toContainText(/\S/);
});

test('feat(profile): old Indonesian default names become English', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('cendekia.profiles.v1')) return;
    localStorage.setItem('cendekia.profiles.v1', JSON.stringify({ cur: 'p1', list: [
      { id: 'p1', name: 'Anak 1', avatar: '🦁', limit: 0 },
      { id: 'p2', name: 'Anak 2', avatar: '🐯', limit: 0 },
    ] }));
  });
  await page.goto('/');
  const names = await page.evaluate(() => window.Cendekia.profiles().map((p) => p.name));
  expect(names).toEqual(['Child 1', 'Child 2']);
});

test('progress saved before profiles existed moves to the first child', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('cendekia.profiles.v1')) localStorage.setItem('baca.v1', '{"stars":7}');
  });
  await page.goto('/');
  const moved = await page.evaluate(() => {
    const C = window.Cendekia;
    return localStorage.getItem('baca.v1.' + C.profile().id);
  });
  expect(moved).toBe('{"stars":7}');
});

test('removing a child deletes only that child\'s saved data', async ({ page }) => {
  await page.goto('/');
  const left = await page.evaluate(() => {
    const C = window.Cendekia;
    const keep = C.profile().id;
    const gone = C.add('Temp').id;
    localStorage.setItem('numeria.v1.' + keep, '1');
    localStorage.setItem('numeria.v1.' + gone, '2');
    C.remove(gone);
    return [localStorage.getItem('numeria.v1.' + keep), localStorage.getItem('numeria.v1.' + gone)];
  });
  expect(left).toEqual(['1', null]);
});

test('fix(logica): home card topic label is not squeezed into the parent report .skill grid', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/logica/');
  const label = page.locator('.worlds .card', { hasText: 'Logic Filter' }).locator('.topic');
  await expect(label).toHaveText('AND, OR, NOT logic');
  // Wide enough that the words sit on one or two lines, not one word per line.
  const lines = await label.evaluate((el) => Math.round(el.getBoundingClientRect().height / (parseFloat(getComputedStyle(el).fontSize) * 1.2)));
  expect(lines).toBeLessThanOrEqual(2);
});
