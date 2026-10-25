const { test, expect } = require('../support/fixtures');

async function answer(page) {
  const [a, b] = (await page.locator('#q').innerText()).match(/\d+/g).map(Number);
  return String(a * b);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/parents/');
});

test('the page starts behind a multiplication gate', async ({ page }) => {
  await expect(page.locator('#gate')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
});

test('a wrong answer shows an error and asks a new sum', async ({ page }) => {
  await page.getByLabel('Jawaban').fill('0');
  await page.getByRole('button', { name: 'Buka' }).click();
  await expect(page.locator('#err')).toHaveText('Belum tepat, coba lagi.');
  await expect(page.locator('#app')).toBeHidden();
  await expect(page.getByLabel('Jawaban')).toHaveValue('');
});

test('the right answer opens the page and the choice is remembered for the session', async ({ page }) => {
  await page.getByLabel('Jawaban').fill(await answer(page));
  await page.getByRole('button', { name: 'Buka' }).click();
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#gate')).toBeHidden();

  await page.reload();
  await expect(page.locator('#app')).toBeVisible();
});
