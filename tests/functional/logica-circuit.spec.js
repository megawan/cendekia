const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Poka's Workshop level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard', 'veryhard', 'extreme']) best[x] = { circuit: Array(6).fill(1) };
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

// Fill the gate: the boxes (slots) of the circuit, and the lamp column of the table.
const slotsOf = (n) => [...(n.slot !== undefined ? [n] : []), ...(n.a ? slotsOf(n.a) : []), ...(n.b ? slotsOf(n.b) : [])];
const choices = (slot) => (slot.b ? ['and', 'or'] : ['not', 'wire']);
function evalFill(n, inp, fill) {
  if (n.t === 'in') return inp[n.i];
  const t = n.slot !== undefined ? fill[n.slot] : n.t;
  if (t === 'not') return !evalFill(n.a, inp, fill);
  if (t === 'wire') return evalFill(n.a, inp, fill);
  return t === 'and' ? evalFill(n.a, inp, fill) && evalFill(n.b, inp, fill) : evalFill(n.a, inp, fill) || evalFill(n.b, inp, fill);
}
const readFill = (page) => page.evaluate(() => ({
  tree: JSON.parse(document.querySelector('.circ').dataset.tree),
  want: [...document.querySelectorAll('#tt tbody tr')].map((r) => r.dataset.want === '1')
}));
// Every choice of gates that matches the table.
function fits({ tree, want }) {
  const slots = slotsOf(tree), n = Math.round(Math.log2(want.length)), inputs = assignments(n), out = [];
  for (let m = 0; m < 1 << slots.length; m++) {
    const fill = {};
    slots.forEach((sl, j) => { fill[sl.slot] = choices(sl)[(m >> j) & 1]; });
    out.push({ fill, ok: inputs.every((x, k) => evalFill(tree, x, fill) === want[k]) });
  }
  return { slots, all: out, good: out.filter((o) => o.ok) };
}
// Taps each box until it shows the wanted gate (the first tap on an empty box shows the first choice).
async function setBoxes(page, fill) {
  const { tree } = await readFill(page);
  for (const sl of slotsOf(tree)) {
    const opts = choices(sl), now = opts.indexOf(sl.t), clicks = (opts.indexOf(fill[sl.slot]) - now + opts.length) % opts.length || (now < 0 ? 0 : 0);
    const taps = now < 0 ? opts.indexOf(fill[sl.slot]) + 1 : clicks;
    for (let k = 0; k < taps; k++) await page.locator('.circ .gate.slot[data-slot="' + sl.slot + '"]').click();
  }
}

test.describe("Poka's Workshop", () => {
  test.setTimeout(90000);

  for (const diff of ['easy', 'medium', 'hard', 'veryhard', 'extreme']) {
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

  for (const diff of ['easy', 'medium', 'hard', 'veryhard', 'extreme']) {
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
        if (['hard', 'veryhard', 'extreme'].includes(diff)) expect(sols).toHaveLength(1);
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

  for (const diff of ['easy', 'medium', 'hard', 'veryhard', 'extreme']) {
    for (const n of [5, 6]) {
      test(`level ${n} is solved by filling the gates on ${diff}`, async ({ page }) => {
        await openLogica(page, diff);
        await openLevel(page, n);
        for (let k = 0; k < (diff === 'easy' ? 2 : 3); k++) {
          await nextPuzzle(page);
          await setBoxes(page, fits(await readFill(page)).good[0].fill);
          await check(page).click();
        }
        await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 10000 });
      });
    }
  }

  for (const diff of ['easy', 'medium', 'hard', 'veryhard', 'extreme']) {
    test(`fill-the-gate puzzles are valid on ${diff}`, async ({ page }) => {
      for (let k = 0; k < 5; k++) {
        for (const n of [5, 6]) {
          await openLogica(page, diff);
          await openLevel(page, n);
          const f = fits(await readFill(page));
          if (n === 5) expect(f.slots).toHaveLength(1);
          else expect(f.slots.length).toBeGreaterThanOrEqual(diff === 'easy' ? 2 : 3);
          expect(f.good.length).toBeGreaterThanOrEqual(1);
          expect(f.good.length).toBeLessThan(f.all.length); // the table must tell the gates apart
          if (['hard', 'veryhard', 'extreme'].includes(diff)) expect(f.good).toHaveLength(1);
          const { want } = await readFill(page);
          expect(new Set(want).size).toBe(2); // the lamp is not always on or always off
        }
      }
    });
  }

  test('tapping a box shows each gate in turn and says what it does', async ({ page }) => {
    await openLogica(page, 'easy');
    await openLevel(page, 5);
    await nextPuzzle(page);
    const box = page.locator('.circ .gate.slot').first();
    await expect(box).toHaveAttribute('data-t', 'blank');
    await box.click();
    await expect(page.locator('#qSay')).toContainText('AND: power gets through only when both');
    await box.click();
    await expect(page.locator('#qSay')).toContainText('OR: power gets through when at least one');
    await box.click();
    await expect(page.locator('#qSay')).toContainText('AND:');
  });

  test('empty boxes must be filled before checking', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 6);
    await nextPuzzle(page);
    await check(page).click();
    await expect(page.locator('#qSay')).toContainText('Fill every ? box');
    await expect(page.locator('#tt tr.bad')).toHaveCount(0);
  });

  test('a wrong try marks the rows, a second puts a gate in, and the stars drop', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 6);
    await nextPuzzle(page);
    const f = fits(await readFill(page)), wrongFill = f.all.find((o) => !o.ok).fill;
    await setBoxes(page, wrongFill);
    await check(page).click();
    await expect(page.locator('#qSay')).toContainText('Not quite');
    expect(await page.locator('#tt tr.bad').count()).toBeGreaterThan(0);
    await expect(page.locator('#tt tr.bad .mine').first()).toContainText('✗');
    await check(page).click();
    await expect(page.locator('#qSay')).toContainText('Poka filled in a box for you');
    // Fix the boxes and carry on.
    await setBoxes(page, fits(await readFill(page)).good[0].fill);
    await check(page).click();
    for (let k = 0; k < 2; k++) {
      await nextPuzzle(page);
      await setBoxes(page, fits(await readFill(page)).good[0].fill);
      await check(page).click();
    }
    await expect(page.locator('#resStars .star.on')).toHaveCount(2, { timeout: 10000 });
  });

  test('the gate guide explains every gate, from a puzzle and from the world screen', async ({ page }) => {
    await openLogica(page, 'medium');
    await page.locator('#worlds .card', { hasText: 'Workshop' }).click();
    await page.locator('#wGates').click();
    const steps = page.getByRole('dialog', { name: 'Logic gates' }).locator('.tsteps');
    await expect(steps).toContainText('both wires need power');
    await expect(steps).toContainText('at least one wire needs power');
    await expect(steps).toContainText('NOT');
    await expect(steps).toContainText('WIRE');
    await expect(steps.locator('table.tt')).toHaveCount(4);
    await page.keyboard.press('Escape');
    await page.locator('#wLevels .lv button').first().click();
    await expect(page.locator('.circ').first()).toBeVisible();
    await page.getByRole('button', { name: '📖 Gates' }).click();
    await expect(page.getByRole('dialog', { name: 'Logic gates' }).locator('.tsteps')).toContainText('red key AND the blue key');
  });
});
