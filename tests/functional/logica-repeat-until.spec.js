const { test, expect } = require('../support/fixtures');

// Opens Robot Path at a difficulty with every level open and the guide seen.
async function openRobot(page, diff, level) {
  await page.goto('/logica/');
  await page.evaluate((d) => {
    const id = window.Cendekia.profile().id;
    const best = { easy: { robot: Array(20).fill(1) }, medium: { robot: Array(20).fill(1) }, hard: { robot: Array(20).fill(1) } };
    localStorage.setItem('logika.v3.' + id, JSON.stringify({ diff: d, best, day: '', streak: 0, seen: { robot: true }, log: {}, days: {} }));
  }, diff);
  await page.reload();
  await page.locator('#worlds .card', { hasText: 'Robot Path' }).click();
  await page.locator('#wLevels .lv button').nth(level - 1).dispatchEvent('click');
  await expect(page.locator('#robot')).toBeVisible();
}

const add = (page, label) => page.locator('#palette').getByRole('button', { name: label, exact: true }).click();
const NAMES = { U: 'Up', D: 'Down', L: 'Left', R: 'Right' };

// Builds a program such as {2}(R){F}(D) or {F}(?DR) with the palette, the way a child would.
async function build(page, sol) {
  for (const [, cond, body] of sol.matchAll(/\{(\w)\}\(([^)]*)\)/g)) {
    await page.locator('#tray').click({ position: { x: 5, y: 5 } });
    await add(page, 'Add a repeat-until block');
    const times = page.locator('#tray .loop.until .times').last();
    // Tap the condition until it shows the right one.
    for (let k = 0; k < 5 && (await times.textContent()) !== (cond === 'F' ? '🚩' : '💎×' + cond); k++) await times.click();
    for (let i = 0; i < body.length; i++) {
      if (body[i] === '?') { await add(page, 'Add an if block'); await add(page, 'Add: ' + NAMES[body[i + 1]]); await add(page, 'Add: ' + NAMES[body[i + 2]]); i += 2; }
      else await add(page, 'Add: ' + NAMES[body[i]]);
    }
  }
}

const LEVELS = [
  ['easy', 11, 'Until the flag', '{F}(R)'],
  ['medium', 15, 'Until the flag', '{F}(RD)'],
  ['medium', 16, 'Count the gems', '{2}(R){F}(D)'],
  ['hard', 11, 'Gem counter', '{3}(RD){F}(R)'],
  ['hard', 12, 'Until and if', '{F}(?DR)']
];
for (const [diff, level, name, sol] of LEVELS) {
  test(`${diff} level ${level} (${name}) is won with ${sol}`, async ({ page }) => {
    await openRobot(page, diff, level);
    await expect(page.locator('#rSay')).toContainText('repeats until');
    await build(page, sol);
    await page.locator('#rRun').click();
    await expect(page.locator('#result')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#resText')).toContainText('perfect');
  });
}

test('the gem counter counts while Gbot runs', async ({ page }) => {
  await openRobot(page, 'medium', 16);
  await expect(page.locator('#gemCount')).toHaveText('💎 0 / 2');
  await build(page, '{2}(R)');
  await page.locator('#rRun').click();
  await expect(page.locator('#gemCount')).toHaveText('💎 2 / 2', { timeout: 10000 });
});

test('an until block with nothing inside it does not hang', async ({ page }) => {
  await openRobot(page, 'easy', 11);
  await add(page, 'Add a repeat-until block');
  await page.locator('#rRun').click();
  await expect(page.locator('#rRun')).toBeEnabled({ timeout: 5000 });
  await expect(page.locator('#result')).toBeHidden();
});

test('an until block cannot go inside a repeat block', async ({ page }) => {
  await openRobot(page, 'medium', 16);
  await add(page, 'Add a repeat-until block');
  await add(page, 'Add a repeat-until block');
  await expect(page.locator('#tray .loop.until')).toHaveCount(1);
});
