const { test, expect } = require('../support/fixtures');

test('the language button switches the landing page to Indonesian and back, and remembers it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sub')).toHaveText('Learn through play');
  await page.getByRole('button', { name: /Language: English/ }).click();
  await expect(page.locator('.sub')).toHaveText('Belajar sambil bermain');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await page.reload();
  await expect(page.locator('.sub')).toHaveText('Belajar sambil bermain');
  await page.getByRole('button', { name: /Bahasa: Indonesia/ }).click();
  await expect(page.locator('.sub')).toHaveText('Learn through play');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the shared panels and the parent page follow the language', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('cendekia.lang.v1', 'id'));
  await page.reload();
  await page.getByRole('button', { name: 'Pengaturan aksesibilitas' }).click();
  await expect(page.getByRole('heading', { name: 'Aksesibilitas' })).toBeVisible();
  await page.goto('/parents/');
  await expect(page.getByRole('heading', { name: 'Untuk orang tua' })).toBeVisible();
});

test('an app home screen keeps the language button and shows the mascot story in Indonesian', async ({ page }) => {
  await page.goto('/numeria/');
  await page.evaluate(() => localStorage.setItem('cendekia.lang.v1', 'id'));
  await page.reload();
  await expect(page.getByRole('button', { name: /Bahasa: Indonesia/ })).toBeVisible();
  await page.locator('.mascot-line').click();
  await expect(page.getByRole('dialog')).toContainText('Aku tupai kecil');
});

test('Numeria plays a whole round in Indonesian', async ({ page }) => {
  await page.goto('/numeria/');
  await page.evaluate(() => localStorage.setItem('cendekia.lang.v1', 'id'));
  await page.reload();
  await expect(page.getByText('Matematika sehari-hari, bersama Myria si tupai')).toBeVisible();
  await page.getByRole('button', { name: /Berhitung di Dapur/ }).click();
  // The suggested next level bounces, so Playwright never sees it as stable: click it in the page.
  await page.getByRole('button', { name: /^Level 1/ }).dispatchEvent('click');
  await expect(page.locator('#say')).toContainText('Ada berapa');
  await page.locator('#answers .opt').first().click();
  await page.locator('#answers .opt:not([disabled])').first().click().catch(() => {});
  await expect(page.locator('#prog')).toHaveAttribute('aria-label', /Soal \d+ dari 6/);
});

for (const [app, text] of [['aksara', 'Petualangan'], ['lexica', 'Petualangan'], ['iqra', 'Belajar huruf']]) {
  test(`${app} home and a round open in Indonesian without errors`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/${app}/`);
    await page.evaluate(() => localStorage.setItem('cendekia.lang.v1', 'id'));
    await page.reload();
    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Bahasa: Indonesia/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('Logica home, a robot level and a quiz level follow the language', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/logica/');
  await page.evaluate(() => localStorage.setItem('cendekia.lang.v1', 'id'));
  await page.reload();
  await expect(page.getByText('Berpikir cerdas bersama Poka')).toBeVisible();
  await expect(page.getByRole('button', { name: /Bahasa: Indonesia/ })).toBeVisible();
  await expect(page.locator('#diffBadge')).toContainText('Sedang');
  await page.getByRole('button', { name: /Jalan Robot/ }).click();
  await expect(page.locator('.lv small').first()).toHaveText('Maju');
  // A guide opens on the first visit: close it.
  await page.keyboard.press('Escape');
  await page.locator('.lv button').first().dispatchEvent('click');
  await expect(page.locator('#rSay')).toContainText('Susun perintahnya');
  await expect(page.locator('#rRun')).toHaveText('▶ Jalankan');
  await page.locator('#rBack').click();
  await page.locator('#world .bar button').first().click();
  await page.getByRole('button', { name: /Pola/ }).click();
  await page.keyboard.press('Escape');
  await page.locator('.lv button').first().dispatchEvent('click');
  await expect(page.locator('#qSay')).toContainText(/Apa yang (berikutnya|hilang)\?/);
  expect(errors).toEqual([]);
});
