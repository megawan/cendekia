const { test, expect } = require('../support/fixtures');

const PROFILES = 'cendekia.profiles.v1';
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), PROFILES);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('a first visit creates one child and shows it in the chip', async ({ page }) => {
  await expect(page.locator('.cd-chip')).toContainText('Child 1');
  const data = await stored(page);
  expect(data.list).toHaveLength(1);
  expect(data.cur).toBe(data.list[0].id);
});

test('adding a child makes it the current one and survives a reload', async ({ page }) => {
  await page.locator('.cd-chip').click();
  await page.getByRole('button', { name: '＋ Add a child' }).click();
  await page.getByLabel("Child's name").fill('Sari');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.locator('.cd-chip')).toContainText('Sari');
  await page.reload();
  await expect(page.locator('.cd-chip')).toContainText('Sari');
  expect((await stored(page)).list).toHaveLength(2);
});

test('saving without a name does nothing', async ({ page }) => {
  await page.locator('.cd-chip').click();
  await page.getByRole('button', { name: '＋ Add a child' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByLabel("Child's name")).toBeFocused();
  expect((await stored(page)).list).toHaveLength(1);
});

test('names are cut to 16 characters', async ({ page }) => {
  const name = await page.evaluate(() => window.Cendekia.add('A'.repeat(40)).name);
  expect(name).toHaveLength(16);
});

test('switching child changes the storage key of every app', async ({ page }) => {
  const first = await page.evaluate(() => window.Cendekia.key('numeria.v1'));
  await page.locator('.cd-chip').click();
  await page.getByRole('button', { name: '＋ Add a child' }).click();
  await page.getByLabel("Child's name").fill('Budi');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.cd-chip')).toContainText('Budi');

  const second = await page.evaluate(() => window.Cendekia.key('numeria.v1'));
  expect(second).not.toBe(first);

  await page.locator('.cd-chip').click();
  await page.getByRole('button', { name: /Child 1/ }).click();
  await expect(page.locator('.cd-chip')).toContainText('Child 1');
  expect(await page.evaluate(() => window.Cendekia.key('numeria.v1'))).toBe(first);
});

test('Escape closes the picker', async ({ page }) => {
  await page.locator('.cd-chip').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('deleting the only child leaves a fresh one', async ({ page }) => {
  await page.evaluate(() => window.Cendekia.remove(window.Cendekia.profile().id));
  const data = await stored(page);
  expect(data.list).toHaveLength(1);
  expect(data.list[0].name).toBe('Child 1');
});
