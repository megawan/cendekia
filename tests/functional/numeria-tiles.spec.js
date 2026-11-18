const { test, expect } = require('../support/fixtures');

async function openTiles(page) {
  await page.goto('/numeria/');
  await page.getByRole('button', { name: /Fraction tiles/ }).click();
  await expect(page.locator('#tiles')).toBeVisible();
}

test.describe('Numeria: Fraction tiles', () => {
  test('the tiles grow to their share of the whole', async ({ page }) => {
    await openTiles(page);
    await expect(page.locator('.ftRow')).toHaveCount(8);
    const width = async (i) => (await page.locator('.ftTile').nth(i).boundingBox()).width;
    const lane = (await page.locator('.ftRow').first().boundingBox()).width;
    // wait until the last tile has finished growing: a tenth of the lane
    await expect.poll(async () => Math.abs((await width(7)) - lane / 10)).toBeLessThan(1);
    expect(Math.abs((await width(1)) - lane / 2)).toBeLessThan(1);
    expect(Math.abs((await width(2)) - lane / 3)).toBeLessThan(1);
  });

  test('tapping a tile compares it and moves the guide line to its end', async ({ page }) => {
    await openTiles(page);
    await page.locator('.ftRow').nth(2).click();
    await expect(page.locator('#ftSay')).toHaveText('1/3 is smaller than 1/2 and bigger than 1/4.');
    const lane = await page.locator('#ftRows').boundingBox();
    await expect.poll(async () => {
      const g = await page.locator('.ftGuide').boundingBox();
      return Math.abs(g.x - lane.x - lane.width / 3);
    }).toBeLessThan(3);
    await page.locator('.ftRow').nth(0).click();
    await expect(page.locator('#ftSay')).toContainText('1 whole is the biggest');
    await page.locator('.ftRow').nth(7).click();
    await expect(page.locator('#ftSay')).toContainText('smallest');
    await expect(page.locator('.ftRow[aria-pressed="true"]')).toHaveCount(1);
  });
});
