const { test, expect } = require('../support/fixtures');

// App folder, the title its page must have.
const APPS = [
  ['hijaiyah', /Hijaiyah/],
  ['aksara', /Aksara/],
  ['lexica', /Lexica/],
  ['logica', /Logica/],
  ['numeria', /Numeria/],
];

test('landing page links to every app and to the parent page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Cendekia');
  const hrefs = await page.locator('a.app').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(APPS.map(([dir]) => `${dir}/`));
  await expect(page.getByRole('link', { name: /For parents/ })).toHaveAttribute('href', 'parents/');
});

for (const [dir, title] of APPS) {
  test.describe(dir, () => {
    test('opens from the landing page', async ({ page }) => {
      await page.goto('/');
      await page.locator(`a.app[href="${dir}/"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${dir}/$`));
      await expect(page).toHaveTitle(title);
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('has a valid manifest whose icons exist', async ({ request }) => {
      const res = await request.get(`/${dir}/manifest.webmanifest`);
      expect(res.status()).toBe(200);
      const manifest = await res.json();
      expect(manifest.name).toBeTruthy();
      expect(manifest.start_url).toBeTruthy();
      expect(manifest.icons.length).toBeGreaterThan(0);
      for (const icon of manifest.icons) {
        const r = await request.get(`/${dir}/${icon.src}`);
        expect(r.status(), icon.src).toBe(200);
      }
    });

    test('ships a service worker', async ({ request }) => {
      const res = await request.get(`/${dir}/sw.js`);
      expect(res.status()).toBe(200);
      expect(await res.text()).toContain('addEventListener');
    });
  });
}

test('parent page opens', async ({ page }) => {
  await page.goto('/parents/');
  await expect(page).toHaveTitle('For parents');
});
