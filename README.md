# cendekia
A collection of simple, friendly learning apps for kids. The name cendekia means “scholar” or “learned person” in Indonesian.

The apps are static pages with no build step, served with GitHub Pages at https://megawan.github.io/cendekia/.

## Apps

| Folder | App |
| --- | --- |
| [`hijaiyah/`](hijaiyah) | Learn the 28 hijaiyah letters, their harakat and sounds. Moved here from `megawan.github.io/games/hijaiyah/`. |
| [`aksara/`](aksara) | Aksara: early reading in Indonesian, from letters and syllables to words, sentences and short stories with questions, in four levels, with stars and stickers. |
| [`lexica/`](lexica) | Lexica: English vocabulary for Indonesian speakers, in 24 themes (including body parts, organs and street furniture), with sound in both languages and the same stars, stickers and streaks. |
| [`logica/`](logica) | Logica: logical and computational thinking games in English, with Gbot the robot. Program a robot (with loops), find patterns, work out a machine's rule, read balances, fix a buggy program, pick items with AND, OR and NOT, crack codes in binary and letters, solve mini sudokus, work out who has which pet from clues, sort a train, and build robot maps to share. With animations, stars and stickers. |
| [`numeria/`](numeria) | Numeria: everyday math in English with Ollie the owl, in eight places around town ordered from the easiest to the hardest: counting in the kitchen, adding at the market, money, the clock, sharing pizza and fractions, measuring and baking, sale prices and percent, and planning a trip. Six levels each, from counting five apples to discounts, speed and timetables. |

`phonics/` (Phonics Fun) is paused: it is no longer linked from the home page or the parent page, and its address shows a closed notice. The full app is in git history (before the commit that closed it) and saved progress is kept.

Each app keeps its own README with details.

## Children and the parent page

Several children can share one device. `shared/profile.js` is loaded by every app and by the landing page:

- A chip at the top of each home screen shows the current child. Tapping it lets a child switch or add another one. Each child has their own stars, stickers and progress in every app (`<app key>.<child id>` in `localStorage`).
- The first time it runs it creates "Child 1" and copies the progress the apps saved before profiles existed into it, so nothing is lost.
- Every finished round is logged (app, stage, stars, right answers, time), and so is each question answered wrong on the first try.

[`parents/`](parents) is the page for parents, opened from "👪 For parents" and protected by a small sum so a young child does not open it by accident. For each child it shows the days in a row, stars, minutes this week, a seven-day chart, progress per app, the letters and words that most often went wrong, and the last rounds. It also sets a daily time limit (a new round cannot start once it is used up), renames, changes the picture of, adds and deletes children.

Everything stays in the browser of the device: nothing is sent anywhere, and clearing the browser's site data clears it. To add an app, add its storage key to `APP_KEYS` in `shared/profile.js` (or move the app's old saves itself, as Logica does) and to the list of app keys removed with a child in `remove()`, add a row to `APPS` in `parents/index.html`, and add `../shared/profile.js` to the app's service worker `CORE` list.

## Running locally

Any static file server works, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Tests

[Playwright](https://playwright.dev) tests live in [`tests/`](tests). They run against the static files, served locally, on a desktop and a phone-sized Chromium, with the service workers off and external requests (fonts, analytics) answered locally.

| Folder | What it covers |
| --- | --- |
| [`tests/smoke/`](tests/smoke) | Landing page links, every app opens, manifests, icons and service workers exist |
| [`tests/functional/`](tests/functional) | Child profiles (add, switch, persist), the parent page gate, the daily time limit |
| [`tests/regression/`](tests/regression) | One test per past bug or change, such as the old `baca/` and `kosakata/` addresses |

```bash
npm ci
npx playwright install chromium
npm test                  # or test:smoke, test:functional, test:regression
```

Any uncaught script error on a page fails the test. The `Tests` workflow runs the suite on every pull request.

### When the checks run

Checks run on pull requests, not again after a merge to `main`, and `Links` and `Lighthouse` also run weekly. `Tests` and `Smoke` are skipped for pull requests titled `docs`, `style` or `chore` (except `chore(deps)`). Add the `run-tests` label to force them, or run them by hand from the Actions tab. `HTML`, `Links` and `Lighthouse` only run when the files they check change.

Three more workflows run on every pull request: `Smoke` (pages, manifests and service workers answer 200) and `Lighthouse` (performance, accessibility and best-practices scores) both come from [gha-shared-workflows](https://github.com/megawan/gha-shared-workflows), and `Tests` runs the Playwright suite. [Dependabot](.github/dependabot.yml) keeps the actions and Playwright up to date.

## Contributing

Every change goes through its own branch and pull request.

- Branch names use the change type as a prefix: `feat/…`, `fix/…`, `docs/…`, `refactor/…`, `chore/…`.
- PR titles follow Conventional Commits, for example `feat(hijaiyah): add a new quiz`. The `PR Title` workflow checks this.
- Fill in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

These rules match [gha-shared-workflows](https://github.com/megawan/gha-shared-workflows), which also provides the HTML, link and PR title checks.
