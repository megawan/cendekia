const { test, expect } = require('../support/fixtures');

const P = require('../../iqra/prayers.js');

test.describe('Iqra: prayers', () => {
  test('every prayer has its texts and a recording', async ({ request }) => {
    expect(P.LIST.length).toBeGreaterThan(0);
    for (const p of P.LIST) {
      for (const k of ['title', 'titleId', 'ar', 'read', 'meaningId', 'meaningEn']) expect(p[k], `${p.id} ${k}`).toBeTruthy();
      const res = await request.get(`/iqra/audio/${p.file}`);
      expect(res.status(), p.file).toBe(200);
      expect((await res.body()).length, p.file).toBeGreaterThan(500);
    }
  });

  test('the rain prayer shows the Arabic with both meanings and no quiz', async ({ page }) => {
    await page.goto('/iqra/');
    await page.getByRole('button', { name: /Prayers/ }).click();
    await expect(page.locator('#prayers')).toBeVisible();
    const card = page.locator('#prList .prayer').first();
    await expect(card.locator('.big')).toHaveText('اللَّهُمَّ صَيِّبًا نَافِعًا');
    await expect(card.locator('[lang=id]')).toContainText('hujan yang bermanfaat');
    await expect(card.locator('[lang=en]')).toContainText('beneficial rain');
    await expect(page.getByRole('button', { name: /Practise|Quiz/ })).toHaveCount(0);
    await page.locator('#prayers [data-home]').click();
    await expect(page.locator('#home')).toBeVisible();
  });
});
