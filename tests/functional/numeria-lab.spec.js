const { test, expect } = require('../support/fixtures');

// Opens Numeria with the first levels of the Number Lab unlocked, and starts one level.
async function openLevel(page, level) {
  await page.goto('/numeria/');
  await page.evaluate(() => {
    const C = window.Cendekia;
    localStorage.setItem(C.key('numeria.v1'), JSON.stringify({ best: { 'lab.0': 1, 'lab.1': 1, 'lab.2': 1, 'lab.3': 1, 'lab.4': 1 }, traced: {}, stars: 0, day: '', streak: 0 }));
  });
  await page.reload();
  await page.getByRole('button', { name: /Number Lab/ }).click();
  // The suggested next level bounces, so Playwright never sees it as stable: click it in the page.
  await page.locator('#levels > * > button').nth(level).dispatchEvent('click');
  await expect(page.locator('#play')).toBeVisible();
}

// Solves every question of a round with `solve(sayText)`, then waits for the result.
async function playRound(page, solve) {
  for (let q = 0; q < 6; q++) {
    if (await page.locator('#result').isVisible()) break;
    const say = await page.locator('#say').textContent();
    await solve(say);
    await page.locator('.tool + .btn.go, #answers > .btn.go').first().click();
    await page.waitForTimeout(1000);
  }
  await expect(page.locator('#result')).toBeVisible();
}

const stored = (page) => page.evaluate(() => {
  const k = Object.keys(localStorage).find((x) => x.startsWith('numeria.v1.'));
  return JSON.parse(localStorage.getItem(k));
});

test.describe('Numeria: Number Lab', () => {
  test('the place is on the home screen and has six levels', async ({ page }) => {
    await page.goto('/numeria/');
    await page.getByRole('button', { name: /Number Lab/ }).click();
    await expect(page.locator('#levels > *')).toHaveCount(6);
  });

  test('ten-frame: show a number, then make ten', async ({ page }) => {
    test.setTimeout(60000);
    await openLevel(page, 0);
    await playRound(page, async (say) => {
      const n = +say.match(/Show (\d+)/)[1];
      for (let i = 0; i < n; i++) await page.locator('.cell').nth(i).click();
    });
    expect((await stored(page)).best['lab.0']).toBe(3);

    await openLevel(page, 1);
    await playRound(page, async () => {
      const free = page.locator('.cell:not(.fixed)');
      for (let i = 0; i < (await free.count()); i++) await free.nth(i).click();
    });
    expect((await stored(page)).best['lab.1']).toBe(3);
  });

  test('number line: tap a number or where the frog lands', async ({ page }) => {
    await openLevel(page, 3);
    await playRound(page, async (say) => {
      let n;
      const tap = say.match(/Tap the number (\d+)/);
      if (tap) n = +tap[1];
      else { const h = say.match(/starts at (\d+) and hops (\d+) forward/); n = +h[1] + +h[2]; }
      await page.locator('.tick').nth(n).click();
    });
    expect((await stored(page)).best['lab.3']).toBe(3);
  });

  test('blocks: build a number with tens and ones', async ({ page }) => {
    test.setTimeout(60000);
    await openLevel(page, 5);
    await playRound(page, async (say) => {
      let n;
      const b = say.match(/Build the number (\d+)/);
      if (b) n = +b[1]; else { const a = say.match(/has (\d+) blocks and gets (\d+) more/); n = +a[1] + +a[2]; }
      // Many taps: done in the page, since each tap only changes a counter.
      await page.evaluate(([tens, ones]) => {
        const plus = [...document.querySelectorAll('.tstep button[aria-label^="One more"]')];
        for (let i = 0; i < tens; i++) plus[0].click();
        for (let i = 0; i < ones; i++) plus[1].click();
      }, [Math.floor(n / 10), n % 10]);
    });
    expect((await stored(page)).best['lab.5']).toBe(3);
  });

  test('a wrong answer gets a second try, then the answer is shown', async ({ page }) => {
    await openLevel(page, 0);
    // Check with nothing filled: always wrong (the answer is at least 1).
    await page.locator('#answers > .btn.go').click();
    await expect(page.locator('#say')).toHaveText('Not quite. Have another go!');
    await page.locator('#answers > .btn.go').click();
    await expect(page.locator('#why')).toBeVisible();
    await expect(page.locator('.tool.ok')).toBeVisible();
    expect(await page.locator('.cell.on').count()).toBeGreaterThan(0);
  });
});
