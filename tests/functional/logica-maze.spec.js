const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Poka's Maze level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { maze: Array(7).fill(1) };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { maze: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await page.waitForFunction(() => window.LogicaUI);
}

async function openLevel(page, n) {
  await page.locator('#worlds .card', { hasText: "Poka's Maze" }).click();
  await page.locator('#wLevels .lv button').nth(n - 1).click();
  await expect(page.locator('#maze')).toBeVisible();
}

// The maze as the page draws it: its size, which sides of each square are open, where the house is and where Poka stands.
const readMaze = (page) => page.locator('#maze').evaluate((box) => ({
  n: parseInt(box.style.getPropertyValue('--w'), 10),
  open: box.dataset.open.split(',').map(Number),
  goal: +box.dataset.goal,
  at: parseInt(document.getElementById('mzBot').style.getPropertyValue('--x'), 10) + parseInt(document.getElementById('mzBot').style.getPropertyValue('--y'), 10) * parseInt(box.style.getPropertyValue('--w'), 10)
}));

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const next = (n, c, d) => { const x = (c % n) + DIRS[d][0], y = Math.floor(c / n) + DIRS[d][1]; return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x; };

// The same rules as the game, worked out again here: the fewest steps from every square to the house.
function distances({ n, open, goal }) {
  const dist = Array(n * n).fill(-1), queue = [goal];
  dist[goal] = 0;
  for (let h = 0; h < queue.length; h++) {
    for (let d = 0; d < 4; d++) {
      const b = (open[queue[h]] >> d) & 1 ? next(n, queue[h], d) : -1;
      if (b >= 0 && dist[b] < 0) { dist[b] = dist[queue[h]] + 1; queue.push(b); }
    }
  }
  return dist;
}

const press = (page, d) => page.locator('.dpad button').nth(d).click();

// Walks to the house by the shortest way, one arrow at a time.
async function walkHome(page) {
  const maze = await readMaze(page), dist = distances(maze);
  let at = maze.at, steps = 0;
  while (at !== maze.goal) {
    const d = [0, 1, 2, 3].find((k) => (maze.open[at] >> k) & 1 && dist[next(maze.n, at, k)] === dist[at] - 1);
    await press(page, d);
    at = next(maze.n, at, d); steps++;
  }
  return { steps, fewest: dist[maze.at] };
}

test.describe("Poka's Maze", () => {
  test.setTimeout(120000);

  const plan = { easy: [1, 3, 6, 7], medium: [2, 5, 7], hard: [1, 4, 7] };
  for (const [diff, levels] of Object.entries(plan)) {
    for (const n of levels) {
      test(`level ${n} is solved by the shortest way on ${diff}`, async ({ page }) => {
        await openLogica(page, diff);
        await openLevel(page, n);
        const puzzles = diff === 'easy' ? 2 : 3;
        for (let k = 0; k < puzzles; k++) {
          await expect(page.locator('#maze:not(.done)')).toBeVisible({ timeout: 10000 });
          const { steps, fewest } = await walkHome(page);
          expect(steps).toBe(fewest);
        }
        await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 10000 });
      });
    }
  }

  test('a wall is refused and does not count as a step or a wrong turn', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    const maze = await readMaze(page), wall = [0, 1, 2, 3].find((k) => !((maze.open[maze.at] >> k) & 1));
    await press(page, wall);
    await expect(page.locator('#moves')).toContainText('Steps: 0');
    expect((await readMaze(page)).at).toBe(maze.at);
    await expect(page.locator('#mzBot.bump')).toHaveCount(1);
  });

  test('stepping off the shortest way is a wrong turn, and undo takes the step back', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    // A maze with no shortcuts has dead ends: from the start, a step to a square farther from the house leaves every shortest route.
    const maze = await readMaze(page), dist = distances(maze);
    const away = [0, 1, 2, 3].find((k) => (maze.open[maze.at] >> k) & 1 && dist[next(maze.n, maze.at, k)] > dist[maze.at]);
    test.skip(away === undefined, 'this start has no dead end next to it');
    await press(page, away);
    await expect(page.locator('#moves')).toContainText('Steps: 1');
    await expect(page.locator('#qSay')).toContainText('dead end');
    await page.locator('#mUndo').click();
    await expect(page.locator('#moves')).toContainText('Steps: 0');
    expect((await readMaze(page)).at).toBe(maze.at);
  });

  test('every maze has a way home within the limit and shows the fewest steps', async ({ page }) => {
    for (let k = 0; k < 6; k++) {
      await openLogica(page, 'easy');
      await openLevel(page, 6);
      const maze = await readMaze(page), dist = distances(maze);
      expect(dist[maze.at]).toBeGreaterThanOrEqual(14);
      expect(dist[maze.at]).toBeLessThanOrEqual(20);
      // from one corner to the opposite one
      const last = maze.n - 1, x = maze.at % maze.n, y = Math.floor(maze.at / maze.n);
      expect([0, last]).toContain(x); expect([0, last]).toContain(y);
      expect(maze.goal).toBe((last - y) * maze.n + (last - x));
      await expect(page.locator('#moves')).toContainText('Fewest: ' + dist[maze.at]);
    }
  });

  test('the fewest steps is hidden on hard', async ({ page }) => {
    await openLogica(page, 'hard');
    await openLevel(page, 1);
    await expect(page.locator('#moves')).not.toContainText('Fewest');
  });

  test('Poka stays drawn on the board after a step', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    const maze = await readMaze(page), d = [0, 1, 2, 3].find((k) => (maze.open[maze.at] >> k) & 1);
    await press(page, d);
    await expect(page.locator('#mzBot svg.poka')).toBeVisible();
  });

  test('the arrow keys walk Poka', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    const maze = await readMaze(page), d = [0, 1, 2, 3].find((k) => (maze.open[maze.at] >> k) & 1);
    await page.keyboard.press(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][d]);
    expect((await readMaze(page)).at).toBe(next(maze.n, maze.at, d));
  });
});
