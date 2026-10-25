const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Secret Code and Mini Sudoku level open and their guides already seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { code: Array(7).fill(1), sudoku: Array(7).fill(1) };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { robot: true, code: true, sudoku: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
}

async function openLevel(page, world, n) {
  await page.locator('#worlds .card', { hasText: world }).click();
  await page.locator('#wLevels .lv button').nth(n - 1).click();
  await expect(page.locator('#quiz')).toBeVisible();
}

// Reads the grid from the squares' labels and solves it the slow, sure way.
function solveSudoku() {
  const cells = [...document.querySelectorAll('#sdk button')], n = Math.round(Math.sqrt(cells.length));
  const names = [...document.querySelectorAll('.sdkPal button')].slice(0, n).map((b) => b.getAttribute('aria-label').replace('Put a ', ''));
  const g = cells.map((c) => names.indexOf(c.getAttribute('aria-label').split(': ')[1]));
  const box = n === 4 ? [2, 2] : n === 6 ? [2, 3] : null;
  const fits = (k, v) => {
    const r = Math.floor(k / n), c = k % n;
    for (let j = 0; j < n; j++) if (g[r * n + j] === v || g[j * n + c] === v) return false;
    if (box) {
      const r0 = r - r % box[0], c0 = c - c % box[1];
      for (let i = 0; i < box[0]; i++) for (let j = 0; j < box[1]; j++) if (g[(r0 + i) * n + c0 + j] === v) return false;
    }
    return true;
  };
  const gaps = g.map((v, k) => (v < 0 ? k : -1)).filter((k) => k >= 0);
  const go = () => {
    const k = g.indexOf(-1);
    if (k < 0) return true;
    for (let v = 0; v < n; v++) if (fits(k, v)) { g[k] = v; if (go()) return true; g[k] = -1; }
    return false;
  };
  go();
  return gaps.map((k) => [k, g[k]]);
}

test.describe('Mini Sudoku', () => {
  for (const diff of ['easy', 'medium', 'hard']) {
    test(`the hardest level can be solved on ${diff}`, async ({ page }) => {
      await openLogica(page, diff);
      await openLevel(page, 'Mini Sudoku', 7);
      const moves = await page.evaluate(solveSudoku);
      expect(moves.length).toBeGreaterThan(0);
      for (const [k, v] of moves) {
        await page.locator('#sdk button').nth(k).click();
        await page.locator('.sdkPal button').nth(v).click();
      }
      await page.getByRole('button', { name: '✓ Check' }).click();
      await expect(page.locator('#prog i.done')).toHaveCount(1);
    });
  }

  test('asks for every gap before checking, then marks a wrong shape', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 'Mini Sudoku', 1);
    await page.getByRole('button', { name: '✓ Check' }).click();
    await expect(page.locator('#qSay')).toHaveText('Fill every gap first, then press ✓ Check.');
    const moves = await page.evaluate(solveSudoku);
    const n = await page.locator('.sdkPal button').count() - 1;
    for (const [i, [k, v]] of moves.entries()) {
      await page.locator('#sdk button').nth(k).click();
      await page.locator('.sdkPal button').nth(i === 0 ? (v + 1) % n : v).click();
    }
    await page.getByRole('button', { name: '✓ Check' }).click();
    await expect(page.locator('#sdk button.no')).toHaveCount(1);
    await expect(page.locator('#prog i.done')).toHaveCount(0);
  });
});

test('the robot blocks keep their own look next to the sudoku palette', async ({ page }) => {
  await openLogica(page, 'medium');
  await page.locator('#worlds .card', { hasText: 'Robot Path' }).click();
  // The first level bounces until it has a star, so it never counts as stable for a normal click.
  await page.locator('#wLevels .lv button').first().dispatchEvent('click');
  const bg = await page.locator('#palette .blk.R').evaluate((b) => getComputedStyle(b).backgroundColor);
  expect(bg).not.toBe('rgb(255, 255, 255)');
});

test.describe('Secret Code', () => {
  test('bulbs make the number', async ({ page }) => {
    await openLogica(page, 'hard');
    await openLevel(page, 'Secret Code', 5);
    const target = Number((await page.locator('#qSay').textContent()).match(/\d+/)[0]);
    for (const b of await page.locator('#bulbs .bulb').all()) {
      if (target & Number(await b.getAttribute('data-v'))) await b.click();
    }
    await page.getByRole('button', { name: '✓ Check' }).click();
    await expect(page.locator('#prog i.done')).toHaveCount(1);
  });

  test('a secret message can be read', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 'Secret Code', 6);
    const coded = (await page.locator('.secret').textContent()).trim();
    const k = Number((await page.locator('.shift').textContent()).match(/\d+/)[0]);
    const word = coded.replace(/[A-Z]/g, (ch) => String.fromCharCode((ch.charCodeAt(0) - 65 - k + 26) % 26 + 65));
    await page.getByRole('button', { name: word.toLowerCase(), exact: true }).click();
    await expect(page.locator('#prog i.done')).toHaveCount(1);
  });

  test('painting the code fills in the picture', async ({ page }) => {
    await openLogica(page, 'easy');
    await openLevel(page, 'Secret Code', 2);
    const bits = (await page.locator('.bits div').allTextContents()).join('');
    const cells = page.locator('#paint button');
    for (let k = 0; k < bits.length; k++) if (bits[k] === '1') await cells.nth(k).click();
    await page.getByRole('button', { name: '✓ Check' }).click();
    await expect(page.locator('#prog i.done')).toHaveCount(1);
  });
});

for (const diff of ['easy', 'medium', 'hard']) {
  test(`every new level opens on ${diff}`, async ({ page }) => {
    test.setTimeout(60000);
    await openLogica(page, diff);
    for (const world of ['Secret Code', 'Mini Sudoku']) {
      for (let n = 1; n <= 7; n++) {
        await openLevel(page, world, n);
        await expect(page.locator('#qSay')).not.toBeEmpty();
        expect(await page.locator('#ask > *').count()).toBeGreaterThan(0);
        expect(await page.locator('#answers > *').count()).toBeGreaterThan(0);
        await page.locator('#qBack').click();
        await page.locator('#world .bar .btn.ghost').first().click();
      }
    }
  });
}
