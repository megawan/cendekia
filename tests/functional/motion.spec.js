const { test, expect } = require('../support/fixtures');

const APPS = ['iqra', 'aksara', 'lexica', 'logica', 'numeria'];

// The confetti used to be copied into every app. They now share shared/motion.js, which draws it with anime.js.
for (const dir of APPS) {
  test(`${dir}: confetti falls and is cleaned up`, async ({ page }) => {
    await page.goto(`/${dir}/`);
    await page.evaluate(() => window.Cendekia.fx.confetti(20));
    const layer = page.locator('body > div[aria-hidden="true"][style*="z-index: 50"]');
    await expect(layer.locator('> *')).toHaveCount(20);
    await expect(layer.locator('> *')).toHaveCount(0, { timeout: 6000 });
  });

  test(`${dir}: the service worker precaches the motion files`, async ({ request }) => {
    const sw = await (await request.get(`/${dir}/sw.js`)).text();
    expect(sw).toContain('../shared/motion.js');
    expect(sw).toContain('../shared/anime.esm.min.js');
  });
}

// Screens: a section that was hidden and appears has its children rise in one after another.
test('a screen that appears animates in, and is fully visible afterwards', async ({ page }) => {
  await page.goto('/lexica/');
  await page.waitForTimeout(200);
  // Read straight after the section is shown, before the first frame: the children start hidden, with no flash.
  const start = await page.evaluate(async () => {
    document.getElementById('home').hidden = true; document.getElementById('map').hidden = false;
    await Promise.resolve();
    return getComputedStyle(document.querySelector('#map > *')).opacity;
  });
  expect(start).toBe('0');
  const first = page.locator('#map > *').first();
  await expect.poll(() => page.locator('#map > *').evaluateAll((els) => els.every((e) => e.style.opacity === '' && e.style.transform === '')), { timeout: 5000 }).toBe(true);
  await expect(first).toHaveCSS('opacity', '1');
});

test('screens do not animate when the device asks for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lexica/');
  await page.waitForTimeout(200);
  await page.evaluate(() => { document.getElementById('home').hidden = true; document.getElementById('map').hidden = false; });
  await expect(page.locator('#map > *').first()).toHaveCSS('opacity', '1');
});

// Poka: the coaches idle and hop, and the robot on the board idles too but keeps its own CSS animations.
test('logica: Poka idles and the coach hops', async ({ page }) => {
  await page.goto('/logica/');
  await expect.poll(() => page.locator('svg.poka .ear-l').first().evaluate((e) => e.style.transform)).toContain('rotate');
  await page.evaluate(() => {
    const s = document.querySelector('#rCoach');
    window.Cendekia.fx.react(s, 'cheer');
  });
  await expect.poll(() => page.locator('#rCoach').evaluate((e) => e.style.transform)).toContain('translateY');
});

// Home screens: numbers count up with their words kept, and a streak flame flickers.
test('count keeps the words and ends on the real number', async ({ page }) => {
  await page.goto('/lexica/');
  const start = await page.evaluate(async () => {
    document.body.insertAdjacentHTML('beforeend', '<span id="cnt">12 stars</span>');
    const el = document.getElementById('cnt');
    window.Cendekia.fx.count(el);
    return el.textContent;
  });
  expect(start).toBe('0 stars');
  await expect(page.locator('#cnt')).toHaveText('12 stars', { timeout: 5000 });
});

test('the home screen counts its stars and days up and lights the streak flame', async ({ page }) => {
  await page.goto('/lexica/');
  await page.evaluate(() => {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    const day = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    localStorage.setItem(window.Cendekia.key('kosakata.v1'), JSON.stringify({ stars: 42, best: {}, day, streak: 5 }));
  });
  await page.reload();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Word cards/ }).click();
  const start = await page.evaluate(async () => {
    document.querySelector('#cards [data-go="home"]').click();
    await Promise.resolve();
    return document.getElementById('homeStars').textContent;
  });
  expect(start).toBe('0');
  await expect(page.locator('#homeStars')).toHaveText('42', { timeout: 5000 });
  await expect(page.locator('#homeDays')).toHaveText('5');
  await expect.poll(() => page.locator('#homeDays').evaluate((e) => e.closest('.pill').firstElementChild.style.transform)).toContain('rotate');
});

test('flame flickers the element', async ({ page }) => {
  await page.goto('/lexica/');
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<span id="fl">🔥</span>');
    window.Cendekia.fx.flame(document.getElementById('fl'));
  });
  await expect.poll(() => page.locator('#fl').evaluate((e) => e.style.transform)).toContain('rotate');
});

test('the landing page shows every app card once it has settled', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.locator('.apps li').evaluateAll((els) => els.every((e) => e.style.opacity === '')), { timeout: 5000 }).toBe(true);
  await expect(page.locator('a.app')).toHaveCount(6);
});

// Lexica's word cards: choosing a word turns the stage over.
test('lexica: the stage flips when another word is chosen', async ({ page }) => {
  await page.goto('/lexica/');
  await page.getByRole('button', { name: /Word cards/ }).click();
  await expect(page.locator('#cGrid .wcard').nth(1)).toBeVisible();
  await page.locator('#cGrid .wcard').nth(1).evaluate((b) => b.click());
  await expect.poll(() => page.locator('#cards .stage').evaluate((e) => e.style.transform)).toContain('rotateY');
  await expect.poll(() => page.locator('#cards .stage').evaluate((e) => e.style.transform), { timeout: 5000 }).toBe('');
});

// The earned stars pop in one by one. Stars are small SVGs with the class "on" when earned.
test('result stars pop in and are all visible afterwards', async ({ page }) => {
  await page.goto('/lexica/');
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="t"><div id="ts"><i class="on"></i><i class="on"></i><i></i></div><div id="tg"></div></div>');
    window.Cendekia.fx.reveal(document.getElementById('ts'), document.getElementById('tg'));
  });
  const stars = page.locator('#ts .on');
  await expect(stars.first()).toHaveCSS('opacity', '0');
  await expect.poll(() => stars.evaluateAll((els) => els.every((e) => getComputedStyle(e).opacity === '1')), { timeout: 5000 }).toBe(true);
  await expect(page.locator('#ts i:not(.on)')).toHaveCSS('opacity', '1');
});

test('nothing is drawn when the device asks for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lexica/');
  await page.evaluate(() => window.Cendekia.fx.confetti(20));
  await page.waitForTimeout(300);
  await expect(page.locator('body > div[style*="z-index: 50"]')).toHaveCount(0);
});

test('lexica: Pochi idles, reacts and keeps his drawing', async ({ page }) => {
  await page.goto('/lexica/');
  const hero = page.locator('#home .mascot');
  // The drawing is copied out of its <symbol>, so the parts can move on their own.
  await expect(hero.locator('use')).toHaveCount(0);
  await expect(hero.locator('.crest, .wing-l, .wing-r, .eyes')).toHaveCount(4);
  await expect.poll(() => hero.locator('.crest').evaluate((e) => e.style.transform)).toContain('rotate');
  await page.evaluate(() => window.Cendekia.fx.react(document.getElementById('coachMascot'), 'cheer'));
  await expect.poll(() => page.locator('#coachMascot').evaluate((e) => e.style.transform)).toContain('translateY');
});

test('lexica: Pochi stays still when the device asks for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lexica/');
  await page.waitForTimeout(300);
  await expect(page.locator('#home .mascot use')).toHaveCount(1);
});

// Each mascot's drawing is marked with the parts that move. The coach mascot is the one that reacts to answers.
for (const [dir, part, coach] of [['iqra', '.mane', '#coachMascot'], ['aksara', '.wing-l', '#coachMascot'], ['numeria', '.tail', '#coach'], ['omnia', '.ear-l', '#coach']]) {
  test(`${dir}: the mascot idles and hops`, async ({ page }) => {
    await page.goto(`/${dir}/`);
    const first = page.locator('.mascot').first();
    await expect(first.locator('use')).toHaveCount(0);
    await expect.poll(() => first.locator(part).first().evaluate((e) => e.style.transform)).not.toBe('');
    await page.evaluate((sel) => window.Cendekia.fx.react(document.querySelector(sel), 'cheer'), coach);
    await expect.poll(() => page.locator(coach).evaluate((e) => e.style.transform)).toContain('translateY');
  });
}
