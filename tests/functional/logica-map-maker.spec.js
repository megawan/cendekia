const { test, expect } = require('../support/fixtures');

// Opens Logica on medium with the guides seen, and Map Maker open. Sharing goes straight to the clipboard
// fallback, since a test browser has no share sheet.
async function openMaker(page) {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined }); });
  await page.goto('/logica/');
  await page.evaluate(() => {
    const id = window.Cendekia.profile().id;
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: 'medium', best: { easy: {}, medium: {}, hard: {} }, day: '', streak: 0, seen: { robot: true }, log: {}, days: {} }));
  });
  await page.reload();
  await page.locator('#worlds .card', { hasText: 'Map Maker' }).click();
  await expect(page.locator('#maker')).toBeVisible();
}

const tool = (page, name) => page.locator('#mkTools button', { hasText: name }).click();
const square = (page, x, y) => page.locator(`#mkBoard .cell[data-x="${x}"][data-y="${y}"]`).click();

test('a map needs Gbot, a flag and a way through before it can be played', async ({ page }) => {
  await openMaker(page);
  await expect(page.locator('#mkPlay')).toBeDisabled();
  await tool(page, 'Gbot'); await square(page, 0, 0);
  await expect(page.locator('#mkSay')).toContainText('flag');
  await tool(page, 'Flag'); await square(page, 2, 0);
  await expect(page.locator('#mkSay')).toContainText('2 moves');
  await expect(page.locator('#mkPlay')).toBeEnabled();
  // A wall of water from top to bottom blocks the way.
  await tool(page, 'Water');
  for (let y = 0; y < 4; y++) await square(page, 1, y);
  await expect(page.locator('#mkSay')).toContainText('cannot reach');
  for (const id of ['#mkPlay', '#mkSave', '#mkShare']) await expect(page.locator(id)).toBeDisabled();
});

test('only three gems fit on a map', async ({ page }) => {
  await openMaker(page);
  await tool(page, 'Gem');
  for (let x = 0; x < 4; x++) await square(page, x, 1);
  await expect(page.locator('#mkSay')).toContainText('Three gems at most');
  await expect(page.locator('#mkBoard .gem')).toHaveCount(3);
});

test('playing your own map and winning leads back to Map Maker', async ({ page }) => {
  await openMaker(page);
  await tool(page, 'Gbot'); await square(page, 0, 0);
  await tool(page, 'Flag'); await square(page, 2, 0);
  await page.locator('#mkPlay').click();
  await expect(page.locator('#robot')).toBeVisible();
  await expect(page.locator('#rLevel')).toHaveText('🛠️');
  await page.getByRole('button', { name: 'Add: Right' }).click();
  await page.getByRole('button', { name: 'Add: Right' }).click();
  await page.locator('#rRun').click();
  await expect(page.locator('#result')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#resNext')).toHaveText('✎ Change the map');
  await page.locator('#resNext').click();
  await expect(page.locator('#maker')).toBeVisible();
  await expect(page.locator('#mkBoard .flag')).toHaveCount(1);
});

test('a saved map stays after a reload and can be deleted', async ({ page }) => {
  await openMaker(page);
  await tool(page, 'Gbot'); await square(page, 0, 0);
  await tool(page, 'Flag'); await square(page, 3, 2);
  await page.locator('#mkSave').click();
  await expect(page.locator('#mkList .mkItem')).toHaveCount(1);
  await page.reload();
  await page.locator('#worlds .card', { hasText: 'Map Maker' }).click();
  await expect(page.locator('#mkList .mkItem')).toHaveCount(1);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete map 1' }).click();
  await expect(page.locator('#mkList .mkItem')).toHaveCount(0);
});

test('a shared link opens the same map', async ({ page }) => {
  await openMaker(page);
  await tool(page, 'Gbot'); await square(page, 1, 1);
  await tool(page, 'Rock'); await square(page, 2, 1);
  await tool(page, 'Gem'); await square(page, 2, 0);
  await tool(page, 'Flag'); await square(page, 3, 1);
  await page.locator('#mkShare').click();
  const link = (await page.locator('#mkLink').textContent()).trim();
  expect(link).toMatch(/#map=00300-04150-00000-00000$/);
  await page.goto('/');
  await page.goto(link);
  await expect(page.locator('#maker')).toBeVisible();
  await expect(page.locator('#mkSay')).toContainText('A friend made this map');
  await expect(page).not.toHaveURL(/#map=/);
  await expect(page.locator('#mkBoard .cell').nth(6).locator('.gbot')).toHaveCount(1);
  await expect(page.locator('#mkBoard .gem')).toHaveCount(1);
});

for (const bad of ['#map=999', '#map=4000-0000-0000', '#map=4500-0000-0005', '#map=4200-2200-0005']) {
  test(`a broken or impossible link is ignored: ${bad}`, async ({ page }) => {
    await page.goto('/logica/' + bad);
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#maker')).toBeHidden();
    await expect(page).not.toHaveURL(/#map=/);
  });
}
