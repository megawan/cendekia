const { test, expect } = require('../support/fixtures');

const KEY = 'cendekia.a11y.v1';
const html = (page, attr) => page.evaluate((a) => document.documentElement.getAttribute(a), attr);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Accessibility settings' }).click();
});

test('the panel changes text size, colours and letters, and the choice survives a reload', async ({ page }) => {
  await page.getByRole('group', { name: 'Text size' }).getByRole('button', { name: 'Large', exact: true }).click();
  await page.getByRole('group', { name: 'Colours' }).getByRole('button', { name: 'High contrast' }).click();
  await page.getByRole('group', { name: 'Letters' }).getByRole('button', { name: 'Easy to read' }).click();
  expect(await html(page, 'data-a11y-size')).toBe('large');
  expect(await html(page, 'data-a11y-contrast')).toBe('high');
  expect(await html(page, 'data-a11y-font')).toBe('clear');

  await page.reload();
  expect(await html(page, 'data-a11y-size')).toBe('large');
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY)).toEqual({ size: 'large', contrast: 'high', font: 'clear' });
});

test('choosing Normal again clears a setting', async ({ page }) => {
  const size = page.getByRole('group', { name: 'Text size' });
  await size.getByRole('button', { name: 'Extra large' }).click();
  await size.getByRole('button', { name: 'Normal' }).click();
  expect(await html(page, 'data-a11y-size')).toBeNull();
});

test('Calm turns animation off for the shared motion code', async ({ page }) => {
  expect(await page.evaluate(() => window.Cendekia.calm())).toBe(false);
  await page.getByRole('group', { name: 'Animations' }).getByRole('button', { name: /Calm/ }).click();
  expect(await page.evaluate(() => window.Cendekia.calm())).toBe(true);
});

test('every app home has the button', async ({ page }) => {
  for (const app of ['aksara', 'hijaiyah', 'lexica']) {
    await page.goto(`/${app}/`);
    await expect(page.getByRole('button', { name: 'Accessibility settings' })).toBeVisible();
  }
});

test('the parent page has the button too', async ({ page }) => {
  await page.goto('/parents/');
  const q = (await page.locator('#q').textContent()).match(/(\d+)\s*[+×x-]\s*(\d+)/);
  const [a, b] = [+q[1], +q[2]];
  const op = (await page.locator('#q').textContent()).match(/[+×x-]/)[0];
  await page.locator('#a').fill(String(op === '+' ? a + b : op === '-' ? a - b : a * b));
  await page.getByRole('button', { name: 'Open' }).click();
  await page.getByRole('button', { name: 'Accessibility settings' }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility' })).toBeVisible();
});
