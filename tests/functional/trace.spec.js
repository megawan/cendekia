const { test, expect } = require('../support/fixtures');

// Draws over the faint letter the way a child would: the points come from the guide canvas itself, in short
// horizontal strokes, so the test works with whatever font the browser falls back to.
async function traceLetter(page) {
  const box = await page.locator('.tr-ink').boundingBox();
  const runs = await page.evaluate(() => {
    const c = document.querySelector('.tr-box canvas'), w = c.width;
    const d = c.getContext('2d').getImageData(0, 0, w, c.height).data, out = [];
    const step = Math.round(w / 28);
    for (let y = step; y < c.height; y += step) {
      let start = -1;
      for (let x = 0; x <= w; x++) {
        const on = x < w && d[(y * w + x) * 4 + 3] > 200 && d[(y * w + x) * 4] < 235;
        if (on && start < 0) start = x;
        if (!on && start >= 0) { out.push([start / w, y / c.height, (x - 1) / w]); start = -1; }
      }
    }
    return out;
  });
  expect(runs.length).toBeGreaterThan(3);
  for (const [x0, y, x1] of runs) {
    await page.mouse.move(box.x + x0 * box.width, box.y + y * box.height);
    await page.mouse.down();
    await page.mouse.move(box.x + x1 * box.width, box.y + y * box.height, { steps: 4 });
    await page.mouse.up();
  }
}

const app = (page, dir) => page.goto(`/${dir}/`);

test.describe('Aksara: trace letters', () => {
  test('tracing a letter marks it, adds stars and is saved for the child', async ({ page }) => {
    await app(page, 'aksara');
    await page.getByRole('button', { name: /Trace letters/ }).click();
    await expect(page.locator('#trace')).toBeVisible();
    await traceLetter(page);
    await expect(page.locator('.tr-box.done')).toBeVisible();
    await expect(page.locator('#trNext')).toBeVisible();
    const saved = await page.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('baca.v1.'));
      return JSON.parse(localStorage.getItem(k));
    });
    expect(saved.traced.A).toBeGreaterThan(0);
    expect(saved.stars).toBe(saved.traced.A);
    await expect(page.locator('#trGrid .tile').first()).toContainText('✓');
  });

  test('scribbling off the letter does not finish it, and Start again clears it', async ({ page }) => {
    await app(page, 'aksara');
    await page.getByRole('button', { name: /Trace letters/ }).click();
    const box = await page.locator('.tr-ink').boundingBox();
    await page.mouse.move(box.x + 6, box.y + 6);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 6, box.y + 6, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('.tr-box.done')).toHaveCount(0);
    await expect(page.locator('.tr-msg')).toHaveText('Stay on the letter.');
    await page.getByRole('button', { name: 'Start again' }).click();
    await expect(page.locator('.tr-msg')).toHaveText('');
  });

  test('a better result only adds the difference in stars', async ({ page }) => {
    await app(page, 'aksara');
    await page.getByRole('button', { name: /Trace letters/ }).click();
    await traceLetter(page);
    await expect(page.locator('.tr-box.done')).toBeVisible();
    const stars = () => page.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('baca.v1.'));
      return JSON.parse(localStorage.getItem(k)).stars;
    });
    const first = await stars();
    await page.getByRole('button', { name: 'Start again' }).click();
    await traceLetter(page);
    await expect(page.locator('.tr-box.done')).toBeVisible();
    expect(await stars()).toBeLessThanOrEqual(3);
    expect(await stars()).toBeGreaterThanOrEqual(first);
  });
});

test.describe('Hijaiyah: trace letters', () => {
  test('tracing a letter marks it and is saved for the child', async ({ page }) => {
    await app(page, 'hijaiyah');
    await page.getByRole('button', { name: /Trace letters/ }).click();
    await expect(page.locator('#trace')).toBeVisible();
    await traceLetter(page);
    await expect(page.locator('.tr-box.done')).toBeVisible();
    const saved = await page.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('hijaiyah.trace.v1.'));
      return JSON.parse(localStorage.getItem(k));
    });
    expect(saved['0']).toBeGreaterThan(0);
    await page.locator('#trNext').click();
    await expect(page.locator('#trName')).toHaveText('Ba');
  });
});
