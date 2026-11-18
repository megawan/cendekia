const { test, expect } = require('../support/fixtures');

test.use({ keepWhatsNew: true });

test('the popup opens on its own for a release not seen yet, and stays closed after a reload', async ({ page }) => {
  await page.goto('/');
  const sheet = page.getByRole('dialog', { name: /What’s new/ });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Got it' }).click();
  await expect(sheet).toBeHidden();
  await page.reload();
  await expect(sheet).toBeHidden();
});

test('the footer link opens it again', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.getByRole('button', { name: /What’s new/ }).click();
  await expect(page.getByRole('dialog', { name: /What’s new/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
