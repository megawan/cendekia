const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Poka's Backpack level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { pack: Array(5).fill(1) };
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

// Build levels: reads the goal and the blocks from the page and finds the fewest blocks that reach it.
const readBuild = (page) => page.evaluate(() => ({
  start: [...document.querySelectorAll('.pouch')].map((e) => +e.querySelector('.cnt').textContent),
  goal: [...document.querySelectorAll('.pouch')].map((e) => (e.dataset.goal === '' ? null : +e.dataset.goal)),
  limit: +document.getElementById('blocks').textContent.match(/\/ (\d+)/)[1],
  palette: [...document.querySelectorAll('#bPal .pbtn')].map((b) => ({
    k: +b.dataset.k, op: b.dataset.op, p: +b.dataset.p, v: b.dataset.v === '' ? null : +b.dataset.v, to: b.dataset.to === '' ? null : +b.dataset.to
  }))
}));

function shortest({ start, goal, palette }) {
  const key = (s) => s.join(','), fits = (s) => goal.every((g, p) => g === null || s[p] === g);
  const seen = new Map([[key(start), null]]);
  if (fits(start)) return [];
  let frontier = [start];
  for (let d = 0; d < 8; d++) {
    const next = [];
    for (const s of frontier) {
      for (const o of palette) {
        const n = s.slice();
        if (o.op === 'add') n[o.p] += o.v;
        else if (o.op === 'take') { if (n[o.p] < o.v) continue; n[o.p] -= o.v; }
        else n[o.to] = n[o.p];
        if (n.some((v) => v > 99) || seen.has(key(n))) continue;
        seen.set(key(n), { prev: s, o });
        if (fits(n)) {
          const path = [];
          for (let at = n, e = seen.get(key(at)); e; at = e.prev, e = seen.get(key(at))) path.unshift(e.o);
          return path;
        }
        next.push(n);
      }
    }
    frontier = next;
  }
  throw new Error('no way to the goal');
}

async function buildOne(page) {
  const puzzle = await readBuild(page), path = shortest(puzzle);
  expect(path.length).toBeLessThanOrEqual(puzzle.limit);
  for (const o of path) await page.locator('#bPal .pbtn').nth(o.k).click();
  await page.getByRole('button', { name: '▶ Run' }).click();
  return path.length;
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

  for (const diff of ['easy', 'medium', 'hard']) {
    for (const n of [4, 5]) {
      test(`level ${n} is solved by building the steps on ${diff}`, async ({ page }) => {
        await openLogica(page, diff);
        await openLevel(page, n);
        for (let k = 0; k < (diff === 'easy' ? 2 : 3); k++) {
          await nextPuzzle(page);
          const blocks = await buildOne(page);
          // The goal is reached in the fewest blocks the page allows, and a swap takes three.
          if (n === 5) expect(blocks).toBe(3);
        }
        await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 15000 });
      });
    }
  }

  test('the run button waits for a block, and the limit stops extra blocks', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 4);
    await expect(page.getByRole('button', { name: '▶ Run' })).toBeDisabled();
    const { limit } = await readBuild(page);
    const first = page.locator('#bPal .pbtn').first();
    for (let k = 0; k < limit; k++) await first.click();
    await expect(page.locator('#bTray li')).toHaveCount(limit);
    await first.click();
    await expect(page.locator('#qSay')).toContainText('at most ' + limit + ' blocks');
    await expect(page.locator('#bTray li')).toHaveCount(limit);
    await page.getByRole('button', { name: 'Remove the last block' }).click();
    await expect(page.locator('#bTray li')).toHaveCount(limit - 1);
  });

  test('a wrong run is a miss: two show the table, the third puts a block in', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 5); // a swap cannot be done with one copy
    await nextPuzzle(page);
    await page.locator('#bPal .pbtn').first().click();
    const run = page.getByRole('button', { name: '▶ Run' });
    await run.click();
    await expect(page.locator('#qSay')).toContainText('Not quite');
    await expect(run).toBeEnabled();
    await expect(page.locator('table.trace')).toHaveCount(0);
    await run.click();
    await expect(page.locator('table.trace')).toBeVisible();
    await expect(run).toBeEnabled();
    await run.click();
    await expect(page.locator('#qSay')).toContainText('Poka put the first 1 block');
    await expect(page.locator('table.trace')).toHaveCount(0);
    await expect(page.locator('#bTray li')).toHaveCount(1);
    // The wrong runs cost the stars of this puzzle.
    await page.locator('#bTray li button').click();
    const [a] = await readBuild(page).then((b) => [shortest(b)]);
    for (const o of a) await page.locator('#bPal .pbtn').nth(o.k).click();
    await run.click();
    for (let k = 0; k < 2; k++) { await nextPuzzle(page); await buildOne(page); }
    await expect(page.locator('#resStars .star.on')).toHaveCount(2, { timeout: 15000 });
  });

  test('tapping a step says what it does', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 3);
    await nextPuzzle(page);
    const said = { put: 'now has exactly', add: 'more go into', take: 'come out of', copy: 'gets the same number' };
    const steps = page.locator('.recipe li');
    for (let k = 0; k < await steps.count(); k++) {
      const op = await steps.nth(k).getAttribute('data-op');
      await steps.nth(k).click();
      await expect(page.locator('#qSay')).toContainText(said[op]);
    }
  });

  test('a step can be read from the keyboard too', async ({ page }) => {
    await openLogica(page, 'easy');
    await openLevel(page, 1);
    await nextPuzzle(page);
    await page.locator('.recipe li').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#qSay')).toContainText(/exactly|more go into|come out of|same number/);
  });

  test('a block says what it does when it is added', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 4);
    await nextPuzzle(page);
    await page.locator('#bPal .pbtn').first().click();
    await expect(page.locator('#qSay')).toContainText(/more go into|come out of/);
  });

  test('the steps guide explains every step, from the world screen and from a puzzle', async ({ page }) => {
    await openLogica(page, 'medium');
    await page.locator('#worlds .card', { hasText: 'Backpack' }).click();
    await page.locator('#wSteps').click();
    const steps = page.getByRole('dialog', { name: 'Backpack steps' }).locator('.tsteps');
    await expect(steps).toContainText('Put 5 in');
    await expect(steps).toContainText('becomes exactly 5');
    await expect(steps).toContainText('Add 3 to');
    await expect(steps).toContainText('Take 3 from');
    await expect(steps).toContainText('Copy');
    await page.keyboard.press('Escape');
    await page.locator('#wLevels .lv button').first().click();
    await expect(page.locator('.pouch').first()).toBeVisible();
    await page.getByRole('button', { name: '📖 Steps' }).click();
    await expect(page.getByRole('dialog', { name: 'Backpack steps' }).locator('.tsteps')).toContainText('Like emptying your bag');
  });
});
