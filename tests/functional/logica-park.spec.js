const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Poka's Parking Lot level open and its guide seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { park: Array(7).fill(1) };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { park: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
  // The Arc bundle loads on the first touch; its stepper is what the progress checks read.
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await page.waitForFunction(() => window.LogicaUI);
}

async function openLevel(page, n) {
  await page.locator('#worlds .card', { hasText: "Poka's Parking Lot" }).click();
  await page.locator('#wLevels .lv button').nth(n - 1).click();
  await expect(page.locator('#lot')).toBeVisible();
}

// The cars as the page draws them: lane, length and place along the lane. Car 0 is the police car.
const readLot = (page) => page.locator('#lot').evaluate((lot) => {
  const num = (el, k) => parseInt(el.style.getPropertyValue('--' + k), 10);
  const cars = [...lot.querySelectorAll('.pcar')].map((b) => {
    const v = num(b, 'w') === 1 && num(b, 'h') > 1;
    return { v, f: v ? num(b, 'x') : num(b, 'y'), len: Math.max(num(b, 'w'), num(b, 'h')), at: v ? num(b, 'y') : num(b, 'x') };
  });
  return { n: parseInt(lot.style.getPropertyValue('--n'), 10), cars };
});

// The same rules as the game, worked out again here: every slide, and the fewest moves from each position to the exit.
function slides(cars, pos, n) {
  const occ = Array(n * n).fill(-1), at = (c, p, k) => (c.v ? c.f + (p + k) * n : p + k + c.f * n);
  cars.forEach((c, i) => { for (let k = 0; k < c.len; k++) occ[at(c, pos[i], k)] = i; });
  const out = [];
  cars.forEach((c, i) => {
    for (let p = pos[i] - 1; p >= 0 && occ[at(c, p, 0)] < 0; p--) out.push({ i, to: p });
    for (let p = pos[i] + 1; p + c.len <= n && occ[at(c, p, c.len - 1)] < 0; p++) out.push({ i, to: p });
  });
  return out;
}
function analyse({ n, cars }) {
  const start = cars.map((c) => c.at), key = (s) => s.join(','), states = [start], index = new Map([[key(start), 0]]), edges = [];
  for (let h = 0; h < states.length; h++) {
    edges.push(slides(cars, states[h], n).map((m) => {
      const next = states[h].slice(); next[m.i] = m.to;
      if (!index.has(key(next))) { index.set(key(next), states.length); states.push(next); }
      return index.get(key(next));
    }));
  }
  const dist = Array(states.length).fill(-1), queue = [];
  states.forEach((s, k) => { if (s[0] === n - cars[0].len) { dist[k] = 0; queue.push(k); } });
  for (let h = 0; h < queue.length; h++) edges[queue[h]].forEach((k) => { if (dist[k] < 0) { dist[k] = dist[queue[h]] + 1; queue.push(k); } });
  return { start, dist: (s) => dist[index.get(key(s))] };
}

// Slides a car: tap it, then tap the spot its far edge goes to.
async function slide(page, cars, n, pos, m) {
  const c = cars[m.i], far = m.to > pos[m.i] ? m.to + c.len - 1 : m.to;
  const [x, y] = c.v ? [c.f, far] : [far, c.f];
  await page.locator('#lot .pcar').nth(m.i).click();
  const dots = await page.locator('#lot .pdest').evaluateAll((els) => els.map((e) => [parseInt(e.style.getPropertyValue('--x'), 10), parseInt(e.style.getPropertyValue('--y'), 10)]));
  await page.locator('#lot .pdest').nth(dots.findIndex(([dx, dy]) => dx === x && dy === y)).click();
}

// Reads the lot, finds the shortest way out and plays it.
async function solvePuzzle(page) {
  const lot = await readLot(page), { start, dist } = analyse(lot);
  let pos = start, moves = 0;
  while (dist(pos) > 0) {
    const m = slides(lot.cars, pos, lot.n).find((s) => { const t = pos.slice(); t[s.i] = s.to; return dist(t) === dist(pos) - 1; });
    await slide(page, lot.cars, lot.n, pos, m);
    pos = pos.slice(); pos[m.i] = m.to; moves++;
  }
  return { moves, fewest: dist(start) };
}

// Plays every puzzle of a level by the shortest way. Three stars mean no wrong turn in any of them.
async function playLevel(page, diff) {
  const puzzles = diff === 'easy' ? 2 : 3, found = [];
  for (let k = 0; k < puzzles; k++) {
    await expect(page.locator('#lot:not(.done)')).toBeVisible({ timeout: 10000 });
    found.push(await solvePuzzle(page));
  }
  await expect(page.locator('#resStars .star.on')).toHaveCount(3, { timeout: 10000 });
  return found;
}

test.describe("Poka's Parking Lot", () => {
  test.setTimeout(120000);

  const plan = { easy: [1, 3, 6, 7], medium: [2, 4, 7], hard: [1, 5, 7] };
  for (const [diff, levels] of Object.entries(plan)) {
    for (const n of levels) {
      test(`level ${n} is solved by the shortest way on ${diff}`, async ({ page }) => {
        await openLogica(page, diff);
        await openLevel(page, n);
        const found = await playLevel(page, diff);
        for (const f of found) expect(f.fewest).toBeGreaterThanOrEqual(1);
      });
    }
  }

  test('every puzzle can be solved and its fewest moves is shown within the limit', async ({ page }) => {
    for (let k = 0; k < 6; k++) {
      await openLogica(page, 'medium');
      await openLevel(page, 4);
      const lot = await readLot(page), { start, dist } = analyse(lot);
      expect(dist(start)).toBeGreaterThanOrEqual(6);
      expect(dist(start)).toBeLessThanOrEqual(8);
      await expect(page.locator('#moves')).toHaveText('Moves: 0 · Fewest: ' + dist(start));
      // No car overlaps another.
      const cells = lot.cars.flatMap((c) => Array.from({ length: c.len }, (_, i) => (c.v ? [c.f, c.at + i] : [c.at + i, c.f]).join(',')));
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  test('hides the fewest moves on hard', async ({ page }) => {
    await openLogica(page, 'hard');
    await openLevel(page, 2);
    await expect(page.locator('#moves')).toHaveText('Moves: 0');
  });

  test('tapping a car shows where it can go and tapping it again hides the spots', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    const lot = await readLot(page);
    const moving = slides(lot.cars, lot.cars.map((c) => c.at), lot.n)[0].i;
    await expect(page.locator('#lot .pdest')).toHaveCount(0);
    await page.locator('#lot .pcar').nth(moving).click();
    await expect(page.locator('#lot .pcar').nth(moving)).toHaveClass(/\bsel\b/);
    const free = slides(lot.cars, lot.cars.map((c) => c.at), lot.n).filter((m) => m.i === moving).length;
    await expect(page.locator('#lot .pdest')).toHaveCount(free);
    await page.locator('#lot .pcar').nth(moving).click();
    await expect(page.locator('#lot .pdest')).toHaveCount(0);
  });

  test('a turn away from the exit is flagged, undo takes it back and two show a hint', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 3);
    const lot = await readLot(page), { start, dist } = analyse(lot);
    // A puzzle starts as far from the exit as it can, so play the shortest way until a slide makes things worse.
    let pos = start, played = 0, wrong = null;
    for (; !wrong && dist(pos) > 0; played++) {
      const all = slides(lot.cars, pos, lot.n), worse = (s) => { const t = pos.slice(); t[s.i] = s.to; return dist(t) > dist(pos); };
      wrong = all.find(worse) || null;
      if (!wrong) {
        const m = all.find((s) => { const t = pos.slice(); t[s.i] = s.to; return dist(t) === dist(pos) - 1; });
        await slide(page, lot.cars, lot.n, pos, m);
        pos = pos.slice(); pos[m.i] = m.to;
      }
    }
    expect(wrong).not.toBeNull();
    played--;
    await slide(page, lot.cars, lot.n, pos, wrong);
    await expect(page.locator('#qSay')).toContainText('further away');
    await expect(page.locator('#lot .pcar.hint')).toHaveCount(0);
    await page.getByRole('button', { name: '↩ Undo' }).click();
    await expect(page.locator('#moves')).toContainText('Moves: ' + played);
    await slide(page, lot.cars, lot.n, pos, wrong);
    await expect(page.locator('#lot .pcar.hint')).toHaveCount(1);
    await expect(page.locator('#lot .pdest.hint')).toHaveCount(1);
  });

  test('a car can be dragged along its lane: it stops at the next car, and the drag is one move', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    const lot = await readLot(page), start = lot.cars.map((c) => c.at);
    const all = slides(lot.cars, start, lot.n);
    const m = all.find((s) => s.i !== 0) || all[0];
    const far = all.filter((s) => s.i === m.i).reduce((a, s) => (Math.abs(s.to - start[m.i]) > Math.abs(a.to - start[m.i]) ? s : a));
    const box = await page.locator('#lot').boundingBox(), cell = (box.width - 8) / lot.n, car = lot.cars[m.i];
    const from = await page.locator('#lot .pcar').nth(m.i).boundingBox();
    const cx = from.x + from.width / 2, cy = from.y + from.height / 2, k = far.to - start[m.i];
    // Drag one cell further than the car can go: it must stop where the free cells end.
    const over = k + Math.sign(k);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + (car.v ? 0 : over * cell), cy + (car.v ? over * cell : 0), { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('#moves')).toContainText('Moves: 1', { timeout: 5000 });
    const after = await readLot(page);
    expect(after.cars[m.i].at).toBe(far.to);
    await expect(page.locator('#lot .pcar').nth(m.i)).not.toHaveClass(/\bsel\b/); // the end of a drag is not a tap
  });

  test('the cars still show, and tapping works, when an older cached motion.js has no drag', async ({ page }) => {
    await page.route('**/shared/motion.js', async (route) => {
      const res = await route.fetch(), body = await res.text();
      await route.fulfill({ response: res, body: body + '\n;delete window.Cendekia.fx.drag;' });
    });
    await openLogica(page, 'easy');
    await openLevel(page, 1);
    await expect(page.locator('#lot .pcar').first()).toBeVisible();
    const box = await page.locator('#lot .pcar').first().boundingBox();
    expect(box.width).toBeGreaterThan(20);
    expect(box.height).toBeGreaterThan(20);
  });

  test('the police car can be dragged all the way to the exit, even in a short window', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 545 });
    await openLogica(page, 'medium');
    await openLevel(page, 1);
    const lot = await readLot(page), { start, dist } = analyse(lot);
    let pos = start;
    while (dist(pos) > 1) {
      const m = slides(lot.cars, pos, lot.n).find((s) => { const q = pos.slice(); q[s.i] = s.to; return dist(q) === dist(pos) - 1; });
      await slide(page, lot.cars, lot.n, pos, m);
      pos = pos.slice(); pos[m.i] = m.to;
    }
    const last = slides(lot.cars, pos, lot.n).find((s) => s.i === 0 && s.to === lot.n - lot.cars[0].len);
    const from = await page.locator('#lot .pcar').first().boundingBox(), cell = (await page.locator('#lot').boundingBox()).height / lot.n;
    const cx = from.x + from.width / 2, cy = from.y + from.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy + (last.to - pos[0]) * cell, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator('#lot.done')).toBeVisible({ timeout: 5000 });
  });

  test('the guide pictures show the lot with cars big enough to see', async ({ page }) => {
    await page.goto('/logica/');
    await page.evaluate(() => {
      const id = window.Cendekia.profile().id, best = {};
      for (const x of ['easy', 'medium', 'hard']) best[x] = { park: Array(7).fill(1) };
      localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: 'medium', best, day: '', streak: 0, seen: {}, log: {}, days: {} }));
    });
    await page.reload();
    await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
    await page.waitForFunction(() => window.LogicaUI);
    await page.locator('#worlds .card', { hasText: "Poka's Parking Lot" }).click();
    const lots = page.locator('.tsteps .lotmini');
    await expect(lots).toHaveCount(3);
    await page.waitForTimeout(1200); // the steps pop in one after another
    for (let k = 0; k < 3; k++) {
      const lot = await lots.nth(k).boundingBox(), car = await lots.nth(k).locator('.pcar').first().boundingBox();
      expect(lot.width).toBeGreaterThan(120);
      expect(car.height).toBeGreaterThan(lot.width / 4); // a car is about two cells of a four-cell lot
    }
  });
});
