const { test, expect } = require('../support/fixtures');

const APPS = ['hijaiyah', 'aksara', 'lexica', 'logica', 'numeria'];

// The confetti used to be copied into every app. They now share shared/motion.js, which draws it with anime.js.
for (const dir of APPS) {
  test(`${dir}: confetti falls and is cleaned up`, async ({ page }) => {
    await page.goto(`/${dir}/`);
    await page.evaluate(() => window.Cendekia.fx.confetti(20));
    const layer = page.locator('body > div[aria-hidden="true"][style*="z-index: 50"]');
    await expect(layer.locator('> *')).toHaveCount(20);
    await expect(layer.locator('> *')).toHaveCount(0, { timeout: 6000 });
  });

  test(`${dir}: the service worker precaches the motion files`, async ({ request }) => {
    const sw = await (await request.get(`/${dir}/sw.js`)).text();
    expect(sw).toContain('../shared/motion.js');
    expect(sw).toContain('../shared/anime.esm.min.js');
  });
}

test('nothing is drawn when the device asks for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lexica/');
  await page.evaluate(() => window.Cendekia.fx.confetti(20));
  await page.waitForTimeout(300);
  await expect(page.locator('body > div[style*="z-index: 50"]')).toHaveCount(0);
});

test('lexica: Pochi idles, reacts and keeps his drawing', async ({ page }) => {
  await page.goto('/lexica/');
  const hero = page.locator('#home .mascot');
  // The drawing is copied out of its <symbol>, so the parts can move on their own.
  await expect(hero.locator('use')).toHaveCount(0);
  await expect(hero.locator('.crest, .wing-l, .wing-r, .eyes')).toHaveCount(4);
  await expect.poll(() => hero.locator('.crest').evaluate((e) => e.style.transform)).toContain('rotate');
  await page.evaluate(() => window.Cendekia.fx.react(document.getElementById('coachMascot'), 'cheer'));
  await expect.poll(() => page.locator('#coachMascot').evaluate((e) => e.style.transform)).toContain('translateY');
});

test('lexica: Pochi stays still when the device asks for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lexica/');
  await page.waitForTimeout(300);
  await expect(page.locator('#home .mascot use')).toHaveCount(1);
});
