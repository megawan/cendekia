const { test, expect } = require('../support/fixtures');

async function openStudio(page) {
  await page.goto('/numeria/');
  await page.getByRole('button', { name: /Shape studio/ }).click();
  await expect(page.locator('#shapes')).toBeVisible();
}

test.describe('Numeria: Shape studio', () => {
  test('picking a number of sides morphs the shape and names it', async ({ page }) => {
    await openStudio(page);
    await expect(page.locator('#shName')).toHaveText('A triangle');
    await page.getByRole('button', { name: /^6 sides/ }).click();
    await expect(page.locator('#shName')).toHaveText('A hexagon');
    await expect(page.locator('#shInfo')).toContainText('6 straight sides and 6 corners');
    await expect(page.locator('.shDot:not(.off)')).toHaveCount(6);
    await expect(page.locator('.shChip[aria-pressed="true"]')).toHaveCount(1);
  });

  test('lines of symmetry: one for each side', async ({ page }) => {
    await openStudio(page);
    await page.getByRole('button', { name: /^8 sides/ }).click();
    await page.getByRole('button', { name: 'Lines of symmetry' }).click();
    await expect(page.locator('.shAxis.on')).toHaveCount(8);
    await expect(page.locator('#shInfo')).toContainText('8 lines of symmetry');
  });

  test('angles: the buttons set the angle and name it, and the handle can be moved with the keyboard', async ({ page }) => {
    await openStudio(page);
    await page.getByRole('tab', { name: 'Angles' }).click();
    await page.locator('[data-angle="90"]').click();
    await expect(page.locator('#anDeg')).toHaveText('90°');
    await expect(page.locator('#anInfo')).toContainText('right angle');
    await page.locator('#anHandle').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#anDeg')).toHaveText('95°');
    await expect(page.locator('#anInfo')).toContainText('obtuse');
    await page.locator('[data-angle="180"]').click();
    await expect(page.locator('#anInfo')).toContainText('straight angle');
  });

  test('angles: dragging the dot opens the angle', async ({ page }) => {
    await openStudio(page);
    await page.getByRole('tab', { name: 'Angles' }).click();
    const box = await page.locator('#anSvg').boundingBox();
    const k = box.width / 200;
    // straight up from the corner is 90°
    await page.mouse.move(box.x + (60 + 80 * Math.cos(1)) * k, box.y + (120 - 80 * Math.sin(1)) * k);
    await page.mouse.down();
    await page.mouse.move(box.x + 60 * k, box.y + 20 * k, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('#anDeg')).toHaveText('90°');
  });
});
