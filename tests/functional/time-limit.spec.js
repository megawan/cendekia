const { test, expect } = require('../support/fixtures');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('gate lets the child play when no limit is set', async ({ page }) => {
  expect(await page.evaluate(() => window.Cendekia.gate())).toBe(true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('gate stops play once the daily limit is used up', async ({ page }) => {
  const allowed = await page.evaluate(() => {
    const C = window.Cendekia;
    C.update(C.profile().id, { limit: 15 });
    C.round({ app: 'numeria', stage: 'test', stars: 3, right: 5, total: 5, ms: 16 * 60000 });
    return C.gate();
  });
  expect(allowed).toBe(false);
  await expect(page.getByRole('dialog')).toContainText('That is all the play time for today');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('gate still allows play while under the limit', async ({ page }) => {
  const allowed = await page.evaluate(() => {
    const C = window.Cendekia;
    C.update(C.profile().id, { limit: 30 });
    C.round({ app: 'numeria', stage: 'test', stars: 3, right: 5, total: 5, ms: 5 * 60000 });
    return C.gate();
  });
  expect(allowed).toBe(true);
});

test('one round counts at most 20 minutes', async ({ page }) => {
  const ms = await page.evaluate(() => {
    const C = window.Cendekia;
    C.round({ app: 'numeria', stage: 'test', ms: 10 * 60 * 60000 });
    return C.log(C.profile().id)[0].ms;
  });
  expect(ms).toBe(20 * 60000);
});
