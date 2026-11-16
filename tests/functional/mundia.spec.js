const { test, expect } = require('../support/fixtures');

// Opens one topic of Mundia ("Cities of Indonesia" or "Capitals of the World").
async function openTopic(page, name) {
  await page.goto('/mundia/');
  await page.locator('#topics .card', { hasText: name }).click();
  await expect(page.locator('#topic')).toBeVisible();
}

// Whether the dot of a place lies on the land of a country shape (ISO number), in the map's own coordinates.
const onLand = (page, place, shape) => page.evaluate(([place, shape]) => {
  const svg = document.getElementById('map');
  const dot = [...svg.querySelectorAll('circle')].find((c) => c.getAttribute('aria-label') === place);
  const pt = svg.createSVGPoint();
  pt.x = +dot.getAttribute('cx'); pt.y = +dot.getAttribute('cy');
  return [...svg.querySelectorAll('path')].some((p) => p.dataset.id === shape && p.isPointInFill(pt));
}, [place, shape]);

test.describe('Mundia', () => {
  test('lists both topics and their levels', async ({ page }) => {
    await openTopic(page, 'Cities of Indonesia');
    await expect(page.locator('#levels .card')).toHaveCount(8); // Explore and seven levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Capitals of the World' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(11);
  });

  test('cities and capitals are placed on the right country', async ({ page }) => {
    await openTopic(page, 'Cities of Indonesia');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const city of ['Jakarta', 'Bandung', 'Palangka Raya', 'Wamena']) expect(await onLand(page, city, '360'), city).toBe(true);
    await page.getByRole('button', { name: '← Back' }).click();
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Capitals of the World' }).click();
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const [country, shape] of [['France', '250'], ['Brazil', '076'], ['Japan', '392'], ['Kenya', '404'], ['Australia', '036']]) {
      expect(await onLand(page, country, shape), country).toBe(true);
    }
  });

  test('exploring shows a country and its capital', async ({ page }) => {
    await openTopic(page, 'Capitals of the World');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    await page.locator('#map circle[aria-label="Japan"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('Tokyo');
    await expect(page.locator('#map text')).toHaveText('Japan');
  });

  test('a round can be played to the end and its stars are saved', async ({ page }) => {
    await openTopic(page, 'Cities of Indonesia');
    await page.locator('#levels .card', { hasText: 'Java' }).click();
    await expect(page.locator('#play')).toBeVisible();
    // Answers with the first choice or the first dots; a second miss shows the answer and a Next button.
    for (let step = 0; step < 40 && !(await page.locator('#result').isVisible()); step++) {
      if (await page.locator('#whyNext').isVisible()) { await page.locator('#whyNext').click(); continue; }
      const opt = page.locator('.opt:not([disabled])').first();
      if (await opt.count()) await opt.click();
      else await page.locator('#map circle').nth(step % 2).press('Enter');
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('#result')).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(window.Cendekia.key('mundia.v1'))));
    expect(saved.best['id.java']).toBeGreaterThanOrEqual(1);
    const log = await page.evaluate(() => window.Cendekia.log(window.Cendekia.profile().id));
    expect(log.at(-1)).toMatchObject({ app: 'mundia', stage: 'Java' });
  });
});
