const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Tower of Poka level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard', 'veryhard', 'extreme']) best[x] = { hanoi: Array(7).fill(1) };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { hanoi: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
  // The Arc bundle loads on the first touch; its stepper is what the progress checks read.
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await page.waitForFunction(() => window.LogicaUI);
}

async function openLevel(page, n) {
  await page.locator('#worlds .card', { hasText: 'Tower of Poka' }).click();
  await page.locator('#wLevels .lv button').nth(n - 1).click();
  await expect(page.locator('#hanoi')).toBeVisible();
}

// The same moves as the game: the disk on top (the smallest) of a peg may go to a peg whose top disk is bigger.
function neighbours(s) {
  const out = [];
  s.forEach((from, d) => {
    const smaller = s.slice(0, d);
    if (smaller.includes(from)) return;
    for (let to = 0; to < 3; to++) if (to !== from && !smaller.includes(to)) out.push({ from, to, next: s.map((q, k) => (k === d ? to : q)) });
  });
  return out;
}

// Reads the pegs from the page, finds the shortest way to the goal and plays it.
async function solvePuzzle(page) {
  const pegs = await page.locator('#hanoi .peg').evaluateAll((els) => els.map((e) => ({
    disks: [...e.querySelectorAll('.disk')].map((d) => +d.textContent), flag: !!e.querySelector('.flag')
  })));
  const n = pegs.reduce((a, p) => a + p.disks.length, 0);
  const start = Array(n).fill(0);
  pegs.forEach((p, i) => p.disks.forEach((d) => { start[d - 1] = i; }));
  let goal = Array(n).fill(pegs.findIndex((p) => p.flag));
  if (goal[0] < 0) {
    const pic = await page.locator('.goalpic .mpeg').evaluateAll((els) => els.map((e) => [...e.querySelectorAll('.disk')].map((d) => +d.textContent)));
    goal = Array(n).fill(0);
    pic.forEach((disks, i) => disks.forEach((d) => { goal[d - 1] = i; }));
  }
  const parent = new Map([[start.join(''), null]]), queue = [start];
  for (let h = 0; h < queue.length && !parent.has(goal.join('')); h++) {
    for (const m of neighbours(queue[h])) {
      if (!parent.has(m.next.join(''))) { parent.set(m.next.join(''), { prev: queue[h], from: m.from, to: m.to }); queue.push(m.next); }
    }
  }
  const path = [];
  for (let s = goal, step; (step = parent.get(s.join(''))); s = step.prev) path.unshift(step);
  for (const m of path) {
    await page.locator('#hanoi .peg').nth(m.from).click();
    await page.locator('#hanoi .peg').nth(m.to).click();
  }
  return { n, moves: path.length };
}

// Plays every puzzle of a level by the shortest way. Three stars mean no wrong turn in any of them.
async function playLevel(page, diff) {
  const puzzles = diff === 'easy' ? 2 : 3, found = [];
  for (let k = 0; k < puzzles; k++) {
    await expect(page.locator('#hanoi:not(.done)')).toBeVisible({ timeout: 10000 });
    found.push(await solvePuzzle(page));
  }
  await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 10000 });
  return found;
}

test.describe('Tower of Poka', () => {
  test.setTimeout(120000);

  const plan = { easy: [1, 2, 3, 4, 5, 7], medium: [2, 3, 4, 5, 7], hard: [1, 6, 7], veryhard: [2, 4], extreme: [3, 5] };
  for (const [diff, levels] of Object.entries(plan)) {
    for (const n of levels) {
      test(`level ${n} is solved by the shortest way on ${diff}`, async ({ page }) => {
        await openLogica(page, diff);
        await openLevel(page, n);
        const found = await playLevel(page, diff);
        // A tower that starts on one peg and ends on another takes 2^n - 1 moves.
        if ([1, 2, 3, 6].includes(n)) for (const f of found) expect(f.moves).toBe(2 ** f.n - 1);
      });
    }
  }

  test('shows the fewest moves for random puzzles within the limit', async ({ page }) => {
    for (let k = 0; k < 6; k++) {
      await openLogica(page, 'medium');
      await openLevel(page, 5);
      const fewest = +(await page.locator('#moves').textContent()).match(/Fewest: (\d+)/)[1];
      expect(fewest).toBeGreaterThanOrEqual(3);
      expect(fewest).toBeLessThanOrEqual(31);
    }
  });

  test('hides the fewest moves on hard', async ({ page }) => {
    await openLogica(page, 'hard');
    await openLevel(page, 2);
    await expect(page.locator('#moves')).toHaveText('Moves: 0');
  });

  test('a big disk on a small one is refused and is not a miss', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    const pegs = page.locator('#hanoi .peg');
    await pegs.nth(0).click(); await pegs.nth(1).click(); // disk 1 to the middle
    await expect(page.locator('#moves')).toContainText('Moves: 1');
    await pegs.nth(0).click(); await pegs.nth(1).click(); // disk 2 onto disk 1
    await expect(page.locator('#qSay')).toHaveText('A big disk can\'t sit on a small one.');
    await expect(page.locator('#moves')).toContainText('Moves: 1');
    await expect(pegs.nth(1)).toHaveClass(/\bno\b/);
  });

  test('a turn away from the goal is flagged, undo takes it back and two show a hint', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1); // 3 disks to the right peg: the small disk goes right first
    const pegs = page.locator('#hanoi .peg');
    await pegs.nth(0).click(); await pegs.nth(2).click();
    const turnAway = async () => { await pegs.nth(2).click(); await pegs.nth(1).click(); }; // the small disk wanders off again
    await turnAway();
    await expect(page.locator('#qSay')).toContainText('further away');
    await expect(page.locator('#hanoi .peg.hint')).toHaveCount(0);
    await page.getByRole('button', { name: '↩ Undo' }).click();
    await expect(page.locator('#moves')).toContainText('Moves: 1');
    await turnAway();
    await expect(page.locator('#hanoi .peg.hint')).toHaveCount(2);
  });

  test('a wrong turn can be undone and the puzzle still finishes', async ({ page }) => {
    await openLogica(page, 'easy');
    await openLevel(page, 1); // 2 disks: the small disk goes to the middle first
    const pegs = page.locator('#hanoi .peg');
    const go = async (a, b) => { await pegs.nth(a).click(); await pegs.nth(b).click(); };
    await go(0, 1);
    await go(1, 2); // the small disk to the right peg too early
    await expect(page.locator('#qSay')).toContainText('further away');
    await page.getByRole('button', { name: '↩ Undo' }).click();
    await go(0, 2); await go(1, 2);
    await expect(page.locator('#hanoi.done')).toBeVisible();
    await expect(page.locator('#qSay')).toContainText('fewest for 2 disks is 3 moves');
  });
});
