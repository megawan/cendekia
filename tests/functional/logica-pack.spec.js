const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Poka's Backpack level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { pack: Array(7).fill(1) };
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
// A repeat does its steps n times.
const unroll = (prog) => prog.flatMap((o) => (o.op === 'loop' ? Array.from({ length: o.n }, () => o.body).flat() : [o]));
function follow({ start, prog }, lenient) {
  const s = start.slice();
  unroll(prog).forEach((o) => {
    if (o.op === 'put') s[o.p] = o.v;
    else if (o.op === 'add') s[o.p] += o.v;
    else if (o.op === 'take') { if (s[o.p] < o.v && !lenient) throw new Error('takes more than the pocket holds'); s[o.p] = Math.max(0, s[o.p] - o.v); }
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

// Repeat levels: a program may hold a repeat, whose steps are cards inside its card.
const readRepeat = (page) => page.evaluate(() => {
  const op = (li) => ({ op: li.dataset.op, p: li.dataset.p === '' ? null : +li.dataset.p, v: li.dataset.v === '' ? null : +li.dataset.v, to: li.dataset.to === '' ? null : +li.dataset.to });
  return {
    start: [...document.querySelectorAll('.pouch')].map((e) => +e.querySelector('.cnt').textContent),
    ask: [...document.querySelectorAll('.pouch')].findIndex((e) => e.classList.contains('ask')),
    prog: [...document.querySelectorAll('.recipe > li')].map((li) => (li.dataset.op === 'loop'
      ? { op: 'loop', n: +li.dataset.n, body: [...li.querySelectorAll(':scope > .body > li')].map(op) } : op(li)))
  };
});

// Build with a repeat: a repeat of one or two blocks, maybe with one block after it, that reaches the goal within the limit.
function repeatSolution({ start, goal, palette, limit }) {
  const plain = palette.filter((o) => o.op !== 'loop');
  const bodies = [...plain.map((o) => [o]), ...plain.flatMap((a) => plain.map((b) => [a, b]))];
  const reach = (prog) => { let v = start[0]; for (const o of unroll(prog)) { v += o.op === 'add' ? o.v : -o.v; if (v < 0) return null; } return v; };
  for (let n = 2; n <= 9; n++) for (const body of bodies) for (const tail of [null, ...plain]) {
    const prog = [{ op: 'loop', n, body }, ...(tail ? [tail] : [])];
    if (1 + body.length + (tail ? 1 : 0) <= limit && reach(prog) === goal[0]) return prog;
  }
  return null;
}
// The fewest blocks to reach the goal with no repeat at all.
function straightFewest({ start, goal, palette }) {
  const plain = palette.filter((o) => o.op !== 'loop'), seen = new Set([start[0]]);
  let frontier = [start[0]];
  for (let d = 0; d <= 12; d++) {
    if (frontier.includes(goal[0])) return d;
    const next = [];
    for (const v of frontier) for (const o of plain) {
      const w = v + (o.op === 'add' ? o.v : -o.v);
      if (w >= 0 && w <= 99 && !seen.has(w)) { seen.add(w); next.push(w); }
    }
    frontier = next;
  }
  return null;
}
async function buildRepeat(page) {
  const puzzle = await readBuild(page), prog = repeatSolution(puzzle);
  expect(prog).not.toBeNull();
  const block = (o) => page.locator('#bPal .pbtn[data-k="' + o.k + '"]');
  await page.locator('#bPal .pbtn[data-op="loop"]').click();
  for (let k = 2; k < prog[0].n; k++) await page.getByRole('button', { name: 'More times' }).click();
  for (const o of prog[0].body) await block(o).click();
  if (prog[1]) { await page.locator('#bTray .tg').click(); await block(prog[1]).click(); } // step out of the repeat first
  await page.getByRole('button', { name: '▶ Run' }).click();
}
// Plays whichever puzzle is on the screen of the Repeat level.
async function repeatOne(page, diff) {
  if (await page.locator('#bTray').count()) { await buildRepeat(page); return; }
  const puzzle = await readRepeat(page);
  await answer(page, diff, follow(puzzle)[puzzle.ask]);
}

// Mixed up: whichever kind of puzzle is on the screen, solved.
const readDebug = (page) => page.evaluate(() => {
  const op = (el) => ({ op: el.dataset.op, p: el.dataset.p === '' ? null : +el.dataset.p, v: el.dataset.v === '' ? null : +el.dataset.v, to: el.dataset.to === '' ? null : +el.dataset.to });
  const dbg = document.getElementById('dbg');
  return {
    start: [...document.querySelectorAll('.pouch')].map((e) => +e.querySelector('.cnt').textContent),
    ask: +dbg.dataset.ask, target: +dbg.dataset.target,
    prog: [...document.querySelectorAll('.recipe > li')].map(op),
    options: [...document.querySelectorAll('.opts .opt')].map((b) => ({ ...op(b), at: +b.dataset.at, label: b.getAttribute('aria-label') }))
  };
});
// Does this change make the program end with the target?
function fixWorks(d, o) {
  try { return follow({ start: d.start, prog: d.prog.map((x, j) => (j === o.at ? { op: o.op, p: o.p, v: o.v, to: o.to } : x)) })[d.ask] === d.target; } catch (e) { return false; }
}
async function mixedOne(page, diff) {
  if (await page.locator('#dbg').count()) {
    const d = await readDebug(page);
    await page.locator('.opts .opt').nth(d.options.findIndex((o) => fixWorks(d, o))).click();
  } else if (await page.locator('#bTray').count()) {
    if (await page.locator('#bPal .pbtn[data-op="loop"]').count()) await buildRepeat(page); else await buildOne(page);
  } else {
    const puzzle = await readRepeat(page);
    await answer(page, diff, follow(puzzle)[puzzle.ask]);
  }
}
// Plays the first two puzzles of Mixed up and waits for the third.
async function toLastPuzzle(page, diff) {
  await openLogica(page, diff);
  await openLevel(page, 7);
  for (let k = 0; k < 2; k++) { await nextPuzzle(page); await mixedOne(page, diff); }
  await nextPuzzle(page);
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

  // What the page stored for this player: the log of every level.
  const storedLog = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('logika.v3.' + window.Cendekia.profile().id)).log);

  test('a wrong answer is recorded with the slip behind it, even before the puzzle is solved', async ({ page }) => {
    let tagged = false;
    for (let k = 0; k < 15 && !tagged; k++) {
      await openLogica(page, 'medium');
      await openLevel(page, 1);
      const puzzle = await readPuzzle(page), ans = follow(puzzle)[puzzle.ask];
      // The answer of a child who takes every Put for an Add.
      const putAdd = follow({ start: puzzle.start, prog: puzzle.prog.map((o) => (o.op === 'put' ? { ...o, op: 'add' } : o)).filter(Boolean) }, true)[puzzle.ask];
      if (!puzzle.prog.some((o) => o.op === 'put') || putAdd === ans) continue;
      const option = page.locator('.opt[aria-label="' + putAdd + '"]');
      if (!(await option.count())) continue; // a number far above what a pocket holds is not offered
      await option.click();
      expect((await storedLog(page))['medium/pack/0'].slips).toEqual({ 'put-add': 1 });
      tagged = true;
    }
    expect(tagged).toBe(true);
  });

  test('on hard a typed number is recorded as a slip too', async ({ page }) => {
    await openLogica(page, 'hard');
    await openLevel(page, 1);
    const puzzle = await readPuzzle(page), ans = follow(puzzle)[puzzle.ask];
    await answer(page, 'hard', ans < 50 ? ans + 1 : ans - 1);
    const slips = (await storedLog(page))['hard/pack/0'].slips;
    expect(Object.values(slips)).toEqual([1]);
    expect(['put-add', 'copy-reverse', 'skip-step', 'other-pocket', 'start', 'off-by-one', 'other']).toContain(Object.keys(slips)[0]);
  });

  // Opens the parents' summary for a player whose log holds these slips.
  async function parentsWith(page, slips) {
    await openLogica(page, 'medium');
    await page.evaluate((sl) => {
      const key = 'logika.v3.' + window.Cendekia.profile().id, st = JSON.parse(localStorage.getItem(key));
      st.log = { 'medium/pack/0': { q: 6, ok: 2, runs: 0, wins: 0, fails: 0, hints: 0, slips: sl } };
      localStorage.setItem(key, JSON.stringify(st));
    }, slips);
    await page.reload();
    await page.locator('#toParents').click();
    const [a, b] = (await page.locator('#gateQ').textContent()).match(/\d+/g).map(Number);
    await page.locator('#gateA').fill(String(a * b));
    await page.getByRole('button', { name: 'Open the summary' }).click();
    return page.locator('#rep');
  }

  test('the parents summary names the two slips seen most often, at least three times', async ({ page }) => {
    const rep = await parentsWith(page, { 'put-add': 5, 'copy-reverse': 4, 'skip-step': 3, 'off-by-one': 2 });
    await expect(rep).toContainText('Common slips');
    await expect(rep).toContainText('Mixes up Put and Add');
    await expect(rep).toContainText('(5 times)');
    await expect(rep).toContainText('Copies the wrong way round');
    await expect(rep).not.toContainText('Skips a step'); // a third slip is left out
    await expect(rep).not.toContainText('one or two away'); // seen only twice
  });

  test('the parents summary has no slips box until a slip has been seen three times', async ({ page }) => {
    const rep = await parentsWith(page, { 'put-add': 2, other: 9 });
    await expect(rep).toContainText('Worth practicing');
    await expect(rep).not.toContainText('Common slips');
  });

  for (const diff of ['easy', 'medium', 'hard']) {
    test(`the repeat level is solved on ${diff}`, async ({ page }) => {
      await openLogica(page, diff);
      await openLevel(page, 6);
      for (let k = 0; k < (diff === 'easy' ? 2 : 3); k++) {
        await nextPuzzle(page);
        // Easy has two to read; Medium and Hard have one to read, then two to build.
        expect(await page.locator('#bTray').count()).toBe(diff !== 'easy' && k > 0 ? 1 : 0);
        await repeatOne(page, diff);
      }
      await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 15000 });
    });
  }

  for (const diff of ['easy', 'medium', 'hard']) {
    test(`repeat puzzles are valid on ${diff}`, async ({ page }) => {
      for (let k = 0; k < 5; k++) {
        await openLogica(page, diff);
        await openLevel(page, 6);
        const puzzle = await readRepeat(page);
        const loop = puzzle.prog.find((o) => o.op === 'loop');
        expect(loop.n).toBeGreaterThanOrEqual(2);
        expect(loop.body.length).toBeGreaterThanOrEqual(1);
        expect(loop.body.length).toBeLessThanOrEqual(diff === 'easy' ? 1 : 2);
        const final = follow(puzzle); // throws if a step takes too much
        expect(final[puzzle.ask]).not.toBe(puzzle.start[puzzle.ask]);
        // Doing the repeat only once must give another answer, or the count would not matter.
        // (A step after the repeat may take more than the pocket holds when the repeat is done once, so a pocket stops at zero.)
        const once = follow({ start: puzzle.start, prog: puzzle.prog.map((o) => (o.op === 'loop' ? { ...o, n: 1 } : o)) }, true);
        expect(once[puzzle.ask]).not.toBe(final[puzzle.ask]);
      }
    });
  }

  for (const diff of ['medium', 'hard']) {
    test(`a build puzzle needs the repeat on ${diff}`, async ({ page }) => {
      for (let k = 0; k < 3; k++) {
        await openLogica(page, diff);
        await openLevel(page, 6);
        await nextPuzzle(page);
        await repeatOne(page, diff); // the first puzzle is one to read
        await nextPuzzle(page);
        const puzzle = await readBuild(page), fewest = straightFewest(puzzle);
        expect(repeatSolution(puzzle)).not.toBeNull();
        // With no repeat, even the fewest blocks do not fit in the limit.
        if (fewest !== null) expect(fewest).toBeGreaterThan(puzzle.limit);
      }
    });
  }

  test('blocks go into the repeat until you step out of it, and a repeat holds two steps', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 6);
    await nextPuzzle(page);
    await repeatOne(page, 'medium');
    await nextPuzzle(page);
    const { limit } = await readBuild(page), plain = page.locator('#bPal .pbtn:not([data-op="loop"])');
    await page.locator('#bPal .pbtn[data-op="loop"]').click();
    await expect(page.locator('#bTray li.loop.target')).toHaveCount(1);
    await expect(page.locator('#bTray .rn')).toHaveText('2 times');
    await page.getByRole('button', { name: 'More times' }).click();
    await expect(page.locator('#bTray .rn')).toHaveText('3 times');
    await page.getByRole('button', { name: 'Fewer times' }).click();
    await page.getByRole('button', { name: 'Fewer times' }).click(); // never below two
    await expect(page.locator('#bTray .rn')).toHaveText('2 times');
    await plain.first().click();
    await plain.first().click();
    await expect(page.locator('#bTray .body li')).toHaveCount(2);
    await expect(page.locator('#blocks')).toHaveText('Blocks: 3 / ' + limit);
    if (limit > 3) {
      await plain.first().click(); // a third step does not fit in the repeat
      await expect(page.locator('#qSay')).toContainText('two steps at most');
      await expect(page.locator('#bTray .body li')).toHaveCount(2);
    }
    await page.locator('#bTray .tg').click(); // step out
    await expect(page.locator('#bTray li.loop.target')).toHaveCount(0);
    if (limit > 3) {
      await plain.first().click();
      await expect(page.locator('#bTray > li')).toHaveCount(2); // the repeat and a step after it
    }
    await page.getByRole('button', { name: 'Remove all blocks' }).click();
    await expect(page.locator('#bTray li')).toHaveCount(0);
  });

  test('a repeat done once is recorded as a slip, and the card says what it does', async ({ page }) => {
    let tagged = false;
    for (let k = 0; k < 15 && !tagged; k++) {
      await openLogica(page, 'medium');
      await openLevel(page, 6);
      const puzzle = await readRepeat(page), ans = follow(puzzle)[puzzle.ask];
      const once = follow({ start: puzzle.start, prog: puzzle.prog.map((o) => (o.op === 'loop' ? { ...o, n: 1 } : o)) }, true)[puzzle.ask];
      const option = page.locator('.opt[aria-label="' + once + '"]');
      if (once === ans || !(await option.count())) continue;
      await page.locator('.recipe > li.loop').click({ position: { x: 20, y: 8 } });
      await expect(page.locator('#qSay')).toContainText('times in all');
      await option.click();
      expect((await storedLog(page))['medium/pack/5'].slips).toEqual({ 'repeat-once': 1 });
      tagged = true;
    }
    expect(tagged).toBe(true);
  });

  test('the steps guide explains Repeat', async ({ page }) => {
    await openLogica(page, 'medium');
    await page.locator('#worlds .card', { hasText: 'Backpack' }).click();
    await page.locator('#wSteps').click();
    await expect(page.getByRole('dialog', { name: 'Backpack steps' }).locator('.tsteps')).toContainText('Like clapping three times');
  });

  for (const diff of ['easy', 'medium', 'hard']) {
    test(`mixed up is solved on ${diff}, and ends with a debug on medium and hard`, async ({ page }) => {
      await openLogica(page, diff);
      await openLevel(page, 7);
      const puzzles = diff === 'easy' ? 2 : 3;
      for (let k = 0; k < puzzles; k++) {
        await nextPuzzle(page);
        expect(await page.locator('#dbg').count()).toBe(diff !== 'easy' && k === 2 ? 1 : 0);
        await mixedOne(page, diff);
      }
      await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 15000 });
    });
  }

  for (const diff of ['medium', 'hard']) {
    test(`a debug puzzle has exactly one working change on ${diff}`, async ({ page }) => {
      for (let k = 0; k < 3; k++) {
        await toLastPuzzle(page, diff);
        const d = await readDebug(page);
        expect(d.options).toHaveLength(diff === 'medium' ? 3 : 4);
        expect(new Set(d.options.map((o) => o.label)).size).toBe(d.options.length);
        expect(d.options.filter((o) => fixWorks(d, o))).toHaveLength(1);
        expect(follow({ start: d.start, prog: d.prog })[d.ask]).not.toBe(d.target); // the program really ends wrong
        expect(d.prog.length).toBeGreaterThanOrEqual(diff === 'medium' ? 3 : 4);
        expect(d.prog.length).toBeLessThanOrEqual(diff === 'medium' ? 4 : 5);
      }
    });
  }

  test('two wrong changes show the table and are recorded as slips, and the stars drop', async ({ page }) => {
    await toLastPuzzle(page, 'medium');
    const d = await readDebug(page);
    const wrongs = d.options.map((o, i) => [o, i]).filter(([o]) => !fixWorks(d, o)).map(([, i]) => i);
    await expect(page.locator('table.trace')).toHaveCount(0);
    await page.locator('.opts .opt').nth(wrongs[0]).click();
    await page.locator('.opts .opt').nth(wrongs[1]).click();
    await expect(page.locator('table.trace')).toBeVisible();
    const slips = (await storedLog(page))['medium/pack/6'].slips;
    expect(Object.values(slips).reduce((a, n) => a + n, 0)).toBe(2);
    expect(Object.keys(slips).every((t) => ['wrong-step', 'wrong-value'].includes(t))).toBe(true);
    await page.locator('.opts .opt').nth(d.options.findIndex((o) => fixWorks(d, o))).click();
    await expect(page.locator('.recipe > li.fixed')).toHaveCount(1);
    await expect(page.locator('#resStars .star.on')).toHaveCount(2, { timeout: 10000 });
  });

  test('the program is shown as cards that say what they do, also in a debug puzzle', async ({ page }) => {
    await toLastPuzzle(page, 'medium');
    await expect(page.locator('#dbg')).toContainText('It should end with');
    await page.locator('.recipe > li').first().click();
    await expect(page.locator('#qSay')).toContainText(/exactly|more go into|come out of|same number/);
  });
});
