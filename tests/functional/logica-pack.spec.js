const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Poka's Backpack level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { pack: Array(3).fill(1) };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { pack: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
  // The Arc bundle loads on the first touch; its stepper is what the progress checks read.
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await page.waitForFunction(() => window.LogicaUI);
}

async function openLevel(page, n) {
  await page.locator('#worlds .card', { hasText: 'Backpack' }).click();
  await page.locator('#wLevels .lv button').nth(n - 1).click();
  await expect(page.locator('.pouch').first()).toBeVisible();
}

// Reads the pockets and the steps from the page.
const readPuzzle = (page) => page.evaluate(() => ({
  start: [...document.querySelectorAll('.pouch')].map((e) => +e.querySelector('.cnt').textContent),
  ask: [...document.querySelectorAll('.pouch')].findIndex((e) => e.classList.contains('ask')),
  prog: [...document.querySelectorAll('.recipe li')].map((li) => ({
    op: li.dataset.op, p: +li.dataset.p, v: li.dataset.v === '' ? null : +li.dataset.v, to: li.dataset.to === '' ? null : +li.dataset.to
  }))
}));

// Follows the steps. A step that takes more than a pocket holds throws.
function follow({ start, prog }) {
  const s = start.slice();
  prog.forEach((o) => {
    if (o.op === 'put') s[o.p] = o.v;
    else if (o.op === 'add') s[o.p] += o.v;
    else if (o.op === 'take') { if (s[o.p] < o.v) throw new Error('takes more than the pocket holds'); s[o.p] -= o.v; }
    else s[o.to] = s[o.p];
  });
  return s;
}

async function answer(page, diff, value) {
  if (diff === 'hard') {
    for (const d of String(value)) await page.getByRole('button', { name: d, exact: true }).click();
    await page.getByRole('button', { name: 'Check' }).click();
  } else {
    await page.locator('.opt[aria-label="' + value + '"]').click();
  }
}

// Waits for a new puzzle: the hint box is replaced for every one.
async function nextPuzzle(page) {
  await page.waitForFunction(() => document.getElementById('traceBox') && document.getElementById('traceBox') !== window.__tb, null, { timeout: 10000 });
  await page.evaluate(() => { window.__tb = document.getElementById('traceBox'); });
}

async function solveOne(page, diff) {
  const puzzle = await readPuzzle(page);
  await answer(page, diff, follow(puzzle)[puzzle.ask]);
}

test.describe("Poka's Backpack", () => {
  test.setTimeout(90000);

  for (const diff of ['easy', 'medium', 'hard']) {
    for (const n of [1, 2, 3]) {
      test(`level ${n} is solved by following the steps on ${diff}`, async ({ page }) => {
        await openLogica(page, diff);
        await openLevel(page, n);
        for (let k = 0; k < (diff === 'easy' ? 2 : 3); k++) {
          await nextPuzzle(page);
          await solveOne(page, diff);
        }
        await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 10000 });
      });
    }
  }

  for (const diff of ['easy', 'medium', 'hard']) {
    test(`puzzles are valid and copies are followed by a change on ${diff}`, async ({ page }) => {
      for (let k = 0; k < 6; k++) {
        await openLogica(page, diff);
        await openLevel(page, 3);
        const puzzle = await readPuzzle(page);
        const first = puzzle.prog.findIndex((o) => o.op === 'copy');
        expect(first).toBeGreaterThanOrEqual(0);
        expect(puzzle.prog.slice(first + 1).some((o) => o.op !== 'copy')).toBe(true);
        const final = follow(puzzle); // throws if a step takes too much
        expect(final[puzzle.ask]).not.toBe(puzzle.start[puzzle.ask]);
        expect(Math.max(...final)).toBeLessThanOrEqual({ easy: 9, medium: 20, hard: 99 }[diff]);
      }
    });
  }

  test('two wrong answers show the table of pockets, and the stars drop', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    await nextPuzzle(page);
    const puzzle = await readPuzzle(page), ans = follow(puzzle)[puzzle.ask];
    await expect(page.locator('table.trace')).toHaveCount(0);
    const wrongs = page.locator('.opt:not([aria-label="' + ans + '"])');
    await wrongs.nth(0).click();
    await wrongs.nth(1).click();
    await expect(page.locator('table.trace')).toBeVisible();
    // Every step but the last, so the answer is still the child's to find.
    await expect(page.locator('table.trace tbody tr')).toHaveCount(puzzle.prog.length);
    await answer(page, 'medium', ans);
    for (let k = 0; k < 2; k++) { await nextPuzzle(page); await solveOne(page, 'medium'); }
    await expect(page.locator('#resStars .star.on')).toHaveCount(2, { timeout: 10000 });
  });

  test('on hard a wrong number clears the pad and two show the table', async ({ page }) => {
    await openLogica(page, 'hard');
    await openLevel(page, 2);
    const puzzle = await readPuzzle(page), ans = follow(puzzle)[puzzle.ask];
    const wrongNumber = ans < 50 ? ans + 1 : ans - 1;
    for (let k = 0; k < 2; k++) await answer(page, 'hard', wrongNumber);
    await expect(page.locator('.padAns')).toHaveText('?');
    await expect(page.locator('table.trace')).toBeVisible();
    await answer(page, 'hard', ans);
    await expect(page.locator('#prog [data-status="complete"]')).toHaveCount(1);
  });
});
