const { test, expect } = require('../support/fixtures');

test('a first visit does not show the popup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('cendekia.whatsnew.v1'))).not.toBeNull();
});

test('a returning visitor sees a new release once, and it stays closed after a reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('cendekia.whatsnew.v1', 'older'));
  await page.reload();
  const sheet = page.getByRole('dialog', { name: /What’s new/ });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Got it' }).click();
  await expect(sheet).toBeHidden();
  await page.reload();
  await expect(sheet).toBeHidden();
});

test('the footer button opens it again', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: /What’s new/ }).click();
  await expect(page.getByRole('dialog', { name: /What’s new/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
