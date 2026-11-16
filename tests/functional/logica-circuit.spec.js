const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Poka's Workshop level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { circuit: Array(4).fill(1) };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { circuit: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
  // The Arc bundle loads on the first touch; its stepper is what the progress checks read.
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await page.waitForFunction(() => window.LogicaUI);
}

async function openLevel(page, n) {
  await page.locator('#worlds .card', { hasText: 'Workshop' }).click();
  await page.locator('#wLevels .lv button').nth(n - 1).click();
  await expect(page.locator('.circ').first()).toBeVisible();
}

// Waits for a new puzzle: the circuits box is replaced for every one.
async function nextPuzzle(page) {
  await page.waitForFunction(() => document.getElementById('circs') && document.getElementById('circs') !== window.__c, null, { timeout: 10000 });
  await page.evaluate(() => { window.__c = document.getElementById('circs'); });
}

// The circuits and the switch positions, read from the page.
const readCircuits = (page) => page.evaluate(() => {
  const inp = [];
  document.querySelectorAll('.circ .sw').forEach((s) => { inp[+s.dataset.i] = s.classList.contains('on'); });
  return { inp, trees: [...document.querySelectorAll('.circ')].map((f) => JSON.parse(f.dataset.tree)) };
});

const evalTree = (n, inp) => (n.t === 'in' ? inp[n.i] : n.t === 'not' ? !evalTree(n.a, inp) : n.t === 'and' ? evalTree(n.a, inp) && evalTree(n.b, inp) : evalTree(n.a, inp) || evalTree(n.b, inp));
const assignments = (n) => Array.from({ length: 1 << n }, (_, m) => Array.from({ length: n }, (__, i) => !!((m >> i) & 1)));

const check = (page) => page.getByRole('button', { name: '✓ Check' });

// Predict: tap each lamp once for yes, twice for no.
async function guessLamps(page, truth) {
  for (const [k, shines] of truth.entries()) {
    const lamp = page.locator('.circ').nth(k).locator('.lamp');
    await lamp.click();
    if (!shines) await lamp.click();
  }
}

async function solveOne(page, diff, lvl) {
  const { inp, trees } = await readCircuits(page);
  if (lvl === 1 || lvl === 2) {
    const target = !/stays dark/.test(await page.locator('#qSay').textContent());
    const goal = assignments(inp.length).find((x) => evalTree(trees[0], x) === target);
    for (const [i, on] of goal.entries()) if (inp[i] !== on) await page.locator('.circ .sw[data-i="' + i + '"]').click();
    if (diff !== 'easy') await check(page).click();
  } else {
    await guessLamps(page, trees.map((t) => evalTree(t, inp)));
    await check(page).click();
  }
}

test.describe("Poka's Workshop", () => {
  test.setTimeout(90000);

  for (const diff of ['easy', 'medium', 'hard']) {
    for (const n of [1, 2, 3, 4]) {
      test(`level ${n} is solved by following the wires on ${diff}`, async ({ page }) => {
        await openLogica(page, diff);
        await openLevel(page, n);
        for (let k = 0; k < (diff === 'easy' ? 2 : 3); k++) {
          await nextPuzzle(page);
          await solveOne(page, diff, n - 1);
        }
        await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 10000 });
      });
    }
  }

  for (const diff of ['easy', 'medium', 'hard']) {
    test(`puzzles are valid on ${diff}`, async ({ page }) => {
      for (let k = 0; k < 5; k++) {
        await openLogica(page, diff);
        await openLevel(page, 4);
        const { inp, trees } = await readCircuits(page);
        const outs = trees.map((t) => evalTree(t, inp));
        if (outs.length > 1) expect(new Set(outs).size).toBe(2); // a mix of lamps on and off
        for (const t of trees) {
          // Every switch is used once, and no circuit is stuck on or off.
          const ids = JSON.stringify(t).match(/"i":\d+/g);
          expect(new Set(ids).size).toBe(ids.length);
          const all = assignments(inp.length).map((x) => evalTree(t, x));
          expect(new Set(all).size).toBe(2);
        }
        await openLogica(page, diff);
        await openLevel(page, 3);
        const lit = await readCircuits(page);
        const target = !/stays dark/.test(await page.locator('#qSay').textContent());
        const sols = assignments(lit.inp.length).filter((x) => evalTree(lit.trees[0], x) === target);
        expect(sols.length).toBeGreaterThanOrEqual(1);
        expect(evalTree(lit.trees[0], lit.inp)).not.toBe(target); // it does not start solved
        if (diff === 'hard') expect(sols).toHaveLength(1);
      }
    });
  }

  test('a gate says what it does when tapped', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 2);
    await page.locator('.circ .gate').first().click();
    await expect(page.locator('#qSay')).toContainText('AND: power gets through only when both');
  });

  test('every lamp needs an answer before checking', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 4);
    await nextPuzzle(page);
    await check(page).click();
    await expect(page.locator('#qSay')).toContainText('every lamp first');
    await expect(page.locator('.circ.no')).toHaveCount(0);
  });

  test('two wrong guesses show the power in the wires, and the stars drop', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 4);
    await nextPuzzle(page);
    const { inp, trees } = await readCircuits(page);
    const truth = trees.map((t) => evalTree(t, inp)), badges = page.locator('.circuit .bd');
    const before = await badges.count();
    await guessLamps(page, truth.map((v) => !v));
    await check(page).click();
    await expect(page.locator('.circ.no')).toHaveCount(truth.length);
    await expect(page.locator('#qSay')).toContainText('Not quite');
    await expect(badges).toHaveCount(before);
    await check(page).click();
    await expect.poll(() => badges.count()).toBeGreaterThan(before);
    // Fix the lamps (each tap flips a guess) and carry on.
    for (let k = 0; k < truth.length; k++) await page.locator('.circ').nth(k).locator('.lamp').click();
    await check(page).click();
    for (let k = 0; k < 2; k++) { await nextPuzzle(page); await solveOne(page, 'medium', 3); }
    await expect(page.locator('#resStars .star.on')).toHaveCount(2, { timeout: 10000 });
  });

  test('on medium the lamp stays hidden until Check, and a wrong try shows it', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 2);
    await nextPuzzle(page);
    await expect(page.locator('.circ .lamp')).toHaveAttribute('aria-label', 'Lamp: not shown yet');
    await check(page).click();
    await expect(page.locator('#qSay')).toContainText('Not yet: the lamp is off');
    await expect(page.locator('.circ .lamp')).toHaveAttribute('aria-label', 'Lamp: off');
  });

  test('on easy the lamp answers at once and the puzzle ends when it shines', async ({ page }) => {
    await openLogica(page, 'easy');
    await openLevel(page, 2);
    await nextPuzzle(page);
    await expect(page.getByRole('button', { name: '✓ Check' })).toHaveCount(0);
    await solveOne(page, 'easy', 1);
    await expect(page.locator('.circ .lamp.lit')).toHaveCount(1);
  });
});
