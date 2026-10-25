// A `test` that keeps the suite offline and strict: external requests (Google Fonts, GoatCounter) are
// answered locally, and any script error on a page fails the test.
const base = require('@playwright/test');

const test = base.test.extend({
  page: async ({ page, baseURL }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(
      (url) => url.origin !== new URL(baseURL).origin,
      (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' })
    );
    await use(page);
    base.expect(errors, 'uncaught script errors').toEqual([]);
  },
});

module.exports = { test, expect: base.expect };
