const { test, expect } = require('../support/fixtures');

// Opens Logica at a difficulty with every Who Is It? and Sort the Train level open and their guides seen.
async function openLogica(page, diff) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id, best = {};
    for (const x of ['easy', 'medium', 'hard']) best[x] = { clues: Array(7).fill(1), train: Array(7).fill(1) };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { clues: true, train: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
}

async function openLevel(page, world, n) {
  await page.locator('#worlds .card', { hasText: world }).click();
  await page.locator('#wLevels .lv button').nth(n - 1).click();
  await expect(page.locator('#quiz')).toBeVisible();
}

// Works out the pets from the clue sentences by trying every way to hand them out.
function solveClues() {
  const people = [...document.querySelectorAll('#people .person .nm')].map((e) => e.textContent);
  const pets = [...document.querySelectorAll('.pets button')].map((b) => b.getAttribute('aria-label').replace('Give the ', ''));
  const facts = { 'says meow': 'cat', barks: 'dog', 'lives in water': 'fish', 'can fly': 'bird', 'has a shell': 'turtle', 'has long ears': 'rabbit' };
  const no = { 'does not say meow': 'cat', 'does not bark': 'dog', 'does not live in water': 'fish', 'cannot fly': 'bird', 'has no shell': 'turtle', 'does not have long ears': 'rabbit' };
  const P = (s) => pets.indexOf(s.replace(/^the \S+ /, '')), F = (s) => people.indexOf(s);
  const tests = [...document.querySelectorAll('#clueList .clue')].map((c) => {
    const t = c.textContent.replace(/^\d+/, '').replace(/\.$/, '');
    let m;
    if ((m = t.match(/^Neither (\w+) nor (\w+) has (.+)$/))) { const [i, k, j] = [F(m[1]), F(m[2]), P(m[3])]; return (a) => a[i] !== j && a[k] !== j; }
    if ((m = t.match(/^The (.+) belongs to (\w+) or (\w+)$/i))) { const [j, i, k] = [P('the ' + m[1]), F(m[2]), F(m[3])]; return (a) => a[i] === j || a[k] === j; }
    if ((m = t.match(/^(\w+) does not have (.+)$/))) { const [i, j] = [F(m[1]), P(m[2])]; return (a) => a[i] !== j; }
    if ((m = t.match(/^(\w+) has (.+)$/))) { const [i, j] = [F(m[1]), P(m[2])]; return (a) => a[i] === j; }
    if ((m = t.match(/^(\w+)’s pet (.+)$/))) {
      const i = F(m[1]);
      if (no[m[2]]) { const j = pets.indexOf(no[m[2]]); return (a) => a[i] !== j; }
      const j = pets.indexOf(facts[m[2]]); return (a) => a[i] === j;
    }
    throw new Error('Unknown clue: ' + t);
  });
  const n = people.length, perms = (k) => (k === 1 ? [[0]] : perms(k - 1).flatMap((p) => Array.from({ length: k }, (_, x) => [...p.slice(0, x), k - 1, ...p.slice(x)])));
  const fits = perms(n).filter((a) => tests.every((ok) => ok(a)));
  return fits;
}

test.describe('Who Is It?', () => {
  for (const diff of ['easy', 'medium', 'hard']) {
    test(`the detective level has one answer and can be solved on ${diff}`, async ({ page }) => {
      await openLogica(page, diff);
      await openLevel(page, 'Who Is It?', 7);
      const fits = await page.evaluate(solveClues);
      expect(fits).toHaveLength(1);
      for (const [i, j] of fits[0].entries()) {
        await page.locator('#people .person').nth(i).click();
        await page.locator('.pets button').nth(j).click();
      }
      await page.getByRole('button', { name: '✓ Check' }).click();
      await expect(page.locator('#prog i.done')).toHaveCount(1);
    });
  }

  test('asks for every pet before checking, and marks a wrong one', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 'Who Is It?', 2);
    await page.getByRole('button', { name: '✓ Check' }).click();
    await expect(page.locator('#qSay')).toHaveText('Give every friend a pet first, then press ✓ Check.');
    const [sol] = await page.evaluate(solveClues);
    // Swap the pets of the first two friends.
    const wrong = sol.slice(); [wrong[0], wrong[1]] = [wrong[1], wrong[0]];
    for (const [i, j] of wrong.entries()) {
      await page.locator('#people .person').nth(i).click();
      await page.locator('.pets button').nth(j).click();
    }
    await page.getByRole('button', { name: '✓ Check' }).click();
    await expect(page.locator('#people .person.no')).toHaveCount(2);
    await expect(page.locator('#prog i.done')).toHaveCount(0);
  });
});

test.describe('Sort the Train', () => {
  // Swaps the first pair that is the wrong way round until the train is in order, and returns the swap count text.
  async function sortTrain(page) {
    const say = await page.locator('#qSay').textContent();
    const before = /biggest/.test(say) ? (x, y) => x > y : (x, y) => x < y;
    for (let guard = 0; guard < 60; guard++) {
      if (await page.locator('#train.done').count()) break;
      const vals = (await page.locator('#train .wagon').allTextContents()).map((t) => (isNaN(+t) ? t : +t));
      const k = vals.findIndex((v, j) => j + 1 < vals.length && before(vals[j + 1], v));
      await page.locator('#train .wagon').nth(k).click();
      await page.locator('#train .wagon').nth(k + 1).click();
    }
    return page.locator('#swaps').textContent();
  }

  for (const n of [1, 4, 7]) {
    test(`level ${n} sorts in the fewest swaps`, async ({ page }) => {
      await openLogica(page, 'hard');
      await openLevel(page, 'Sort the Train', n);
      const text = await sortTrain(page);
      const [swaps, fewest] = text.match(/\d+/g).map(Number);
      expect(swaps).toBe(fewest);
      await expect(page.locator('#prog i.done')).toHaveCount(1);
    });
  }

  test('a wasted swap counts as a miss, and two show a hint', async ({ page }) => {
    await openLogica(page, 'medium');
    await openLevel(page, 'Sort the Train', 3);
    const say = await page.locator('#qSay').textContent();
    const before = /biggest/.test(say) ? (x, y) => x > y : (x, y) => x < y;
    const wasted = async () => {
      let vals = (await page.locator('#train .wagon').allTextContents()).map(Number);
      let k = vals.findIndex((v, j) => j + 1 < vals.length && before(v, vals[j + 1]));
      if (k < 0) {
        // The train is fully the wrong way round: one good swap first makes a pair that is in order.
        await page.locator('#train .wagon').nth(0).click();
        await page.locator('#train .wagon').nth(1).click();
        vals = (await page.locator('#train .wagon').allTextContents()).map(Number);
        k = vals.findIndex((v, j) => j + 1 < vals.length && before(v, vals[j + 1]));
      }
      await page.locator('#train .wagon').nth(k).click();
      await page.locator('#train .wagon').nth(k + 1).click();
    };
    await wasted();
    await expect(page.locator('#qSay')).toHaveText('Try again.');
    await wasted();
    await expect(page.locator('#train .wagon.hint')).toHaveCount(2);
  });
});

for (const diff of ['easy', 'medium', 'hard']) {
  test(`every Who Is It? and Sort the Train level opens on ${diff}`, async ({ page }) => {
    test.setTimeout(60000);
    await openLogica(page, diff);
    for (const world of ['Who Is It?', 'Sort the Train']) {
      for (let n = 1; n <= 7; n++) {
        await openLevel(page, world, n);
        await expect(page.locator('#qSay')).not.toBeEmpty();
        expect(await page.locator('#ask > *').count()).toBeGreaterThan(0);
        await page.locator('#qBack').click();
        await page.locator('#world .bar .btn.ghost').first().click();
      }
    }
  });
}
