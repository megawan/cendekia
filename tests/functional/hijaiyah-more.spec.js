const { test, expect } = require('../support/fixtures');

const M = require('../../hijaiyah/more.js');

test.describe('Hijaiyah: more harakat', () => {
  test('every form has a recording', async ({ request }) => {
    for (const kind of M.KINDS) {
      for (let i = 0; i < M.LETTER_COUNT; i++) {
        if (kind.skipAlif && i === 0) continue;
        for (let v = 0; v < 3; v++) {
          const f = M.form(kind.key, i, v);
          const res = await request.get(`/hijaiyah/audio/${f.file}`);
          expect(res.status(), f.file).toBe(200);
          expect((await res.body()).length, f.file).toBeGreaterThan(500);
        }
      }
    }
  });

  test('forms read as written', async () => {
    const read = (k, i, v) => M.form(k, i, v).name;
    expect([0, 1, 2].map((v) => read('tanwin', 1, v))).toEqual(['ban', 'bin', 'bun']);
    expect([0, 1, 2].map((v) => read('mad', 1, v))).toEqual(['baa', 'bii', 'buu']);
    expect([0, 1, 2].map((v) => read('sukun', 1, v))).toEqual(['ab', 'ib', 'ub']);
    expect([0, 1, 2].map((v) => read('tasydid', 1, v))).toEqual(['abba', 'ibbi', 'ubbu']);
    expect(read('tanwin', 0, 0)).toBe('an');
    expect(read('mad', 0, 2)).toBe('uu');
  });

  test('the lesson shows three forms, and sukun and tasydid leave out alif', async ({ page }) => {
    await page.goto('/hijaiyah/');
    await page.getByRole('button', { name: /More harakat/ }).click();
    await expect(page.locator('#mRow .mbtn')).toHaveCount(3);
    await expect(page.locator('#mRow .mbtn b')).toHaveText(['ban', 'bin', 'bun']);
    await expect(page.locator('#mGrid .tile').first()).toBeEnabled();
    await page.locator('#mTabs .tab').nth(2).click();
    await expect(page.locator('#mRow .mbtn b')).toHaveText(['ab', 'ib', 'ub']);
    await expect(page.locator('#mGrid .tile').first()).toBeDisabled();
    await page.locator('#mGrid .tile').nth(5).click();
    await expect(page.locator('#mRow .mbtn b')).toHaveText(['ah', 'ih', 'uh']);
  });

  test('a practice round can be finished and is logged under the kind', async ({ page }) => {
    await page.goto('/hijaiyah/');
    await page.getByRole('button', { name: /More harakat/ }).click();
    await page.locator('#mTabs .tab').nth(3).click();
    await page.getByRole('button', { name: 'Practise' }).click();
    await expect(page.locator('#quiz')).toBeVisible();
    for (let q = 0; q < 10; q++) {
      // "see": the Arabic is shown and the options are names; "hear": the options are Arabic and the sound is played.
      // The test cannot hear, so it clicks the first option, and accepts a second click after a miss.
      const opts = page.locator('#opts .opt');
      for (let k = 0; k < 3; k++) {
        if (await page.locator('#opts .opt.ok').count()) break;
        await opts.nth(k).click();
      }
      await page.waitForTimeout(1250);
    }
    await expect(page.locator('#result')).toBeVisible();
    const log = await page.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => /^cendekia\.log\./.test(x));
      return JSON.parse(localStorage.getItem(k));
    });
    expect(log.at(-1).stage).toBe('Tasydid');
  });
});
