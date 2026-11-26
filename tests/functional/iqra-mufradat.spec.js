const { test, expect } = require('../support/fixtures');

const W = require('../../iqra/mufradat.js');
const ART = require('../../shared/art.js');

test.describe('Iqra: mufradat', () => {
  test('every word has its texts, its own drawing and a recording', async ({ request }) => {
    const arts = new Set();
    for (const t of W.THEMES) {
      expect(t.list.length, t.id).toBeGreaterThanOrEqual(8); // a round has eight questions
      for (const w of t.list) {
        for (const k of ['ar', 'read', 'id', 'en']) expect(w[k], `${w.art} ${k}`).toBeTruthy();
        expect(ART[w.art], w.art).toBeTruthy();
        expect(arts.has(w.art), `${w.art} used twice`).toBe(false);
        arts.add(w.art);
        const res = await request.get(`/iqra/audio/${w.file}`);
        expect(res.status(), w.file).toBe(200);
        expect((await res.body()).length, w.file).toBeGreaterThan(500);
      }
    }
  });

  test('a theme shows its words with picture, Arabic, reading and meaning', async ({ page }) => {
    await page.goto('/iqra/');
    await page.getByRole('button', { name: /Mufradat/ }).click();
    await expect(page.locator('#words')).toBeVisible();
    await expect(page.locator('#wTabs .tab')).toHaveCount(W.THEMES.length);
    const cat = page.locator('#wGrid .wcard').first();
    await expect(page.locator('#wGrid .wcard')).toHaveCount(W.THEMES[0].list.length);
    await expect(cat.locator('svg.art')).toBeVisible();
    await expect(cat.locator('.ar')).toHaveText('قِطٌّ');
    await expect(cat.locator('b')).toHaveText('qiththun');
    await expect(cat.locator('small')).toHaveText('kucing · cat');
    await page.locator('#wTabs .tab').nth(1).click();
    await expect(page.locator('#wGrid .wcard .ar').first()).toHaveText('تُفَّاحٌ');
  });

  test('a practice round can be finished and is logged under the theme', async ({ page }) => {
    await page.goto('/iqra/');
    await page.getByRole('button', { name: /Mufradat/ }).click();
    await page.locator('#wTabs .tab').nth(1).click();
    await page.getByRole('button', { name: 'Practise' }).click();
    await expect(page.locator('#quiz')).toBeVisible();
    for (let q = 0; q < 8; q++) {
      // "hear": the options are pictures; "see": the picture is shown and the options are Arabic words.
      // The test cannot hear, so it clicks the options in turn until one is right.
      const opts = page.locator('#opts .opt');
      await expect(opts).toHaveCount(4);
      for (let k = 0; k < 4; k++) {
        if (await page.locator('#opts .opt.ok').count()) break;
        await opts.nth(k).click();
      }
      await page.waitForTimeout(1250);
    }
    await expect(page.locator('#result')).toBeVisible();
    const log = await page.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => /^cendekia\.log\./.test(x));
      return JSON.parse(localStorage.getItem(k));
    });
    expect(log.at(-1).stage).toBe('Mufradat: Fruit');
  });
});
