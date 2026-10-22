# cendekia
A collection of simple, friendly learning apps for kids. The name cendekia means “scholar” or “learned person” in Indonesian.

The apps are static pages with no build step, served with GitHub Pages at https://megawan.github.io/cendekia/.

## Apps

| Folder | App |
| --- | --- |
| [`hijaiyah/`](hijaiyah) | Learn the 28 hijaiyah letters, their harakat and sounds. Moved here from `megawan.github.io/games/hijaiyah/`. |
| [`baca/`](baca) | Ayo Membaca: early reading in Indonesian, from letters and syllables to words, sentences and short stories with questions, in four levels, with stars and stickers. |
| [`phonics/`](phonics) | Phonics Fun: English letter sounds, blending, spelling and first sentences, with the same adventure map and rewards. |
| [`kosakata/`](kosakata) | Kosakata: English vocabulary for Indonesian speakers, in 24 themes (including body parts, organs and street furniture), with sound in both languages and the same stars, stickers and streaks. |
| [`logika/`](logika) | Robo Logic: logical and computational thinking games in English, with Gbot the robot. Program a robot (with loops), find patterns, work out a machine's rule, read balances, fix a buggy program and pick items with AND, OR and NOT. With animations, stars and stickers. |
| [`numeria/`](numeria) | Numeria: everyday math in English with Ollie the owl, in eight places around town ordered from the easiest to the hardest: counting in the kitchen, adding at the market, money, the clock, sharing pizza and fractions, measuring and baking, sale prices and percent, and planning a trip. Six levels each, from counting five apples to discounts, speed and timetables. |

Each app keeps its own README with details.

## Children and the parent page

Several children can share one device. `shared/profile.js` is loaded by every app and by the landing page:

- A chip at the top of each home screen shows the current child. Tapping it lets a child switch or add another one. Each child has their own stars, stickers and progress in every app (`<app key>.<child id>` in `localStorage`).
- The first time it runs it creates "Anak 1" and copies the progress the apps saved before profiles existed into it, so nothing is lost.
- Every finished round is logged (app, stage, stars, right answers, time), and so is each question answered wrong on the first try.

[`orangtua/`](orangtua) is the page for parents, opened from "👪 Orang tua" and protected by a small sum so a young child does not open it by accident. For each child it shows the days in a row, stars, minutes this week, a seven-day chart, progress per app, the letters and words that most often went wrong, and the last rounds. It also sets a daily time limit (a new round cannot start once it is used up), renames, changes the picture of, adds and deletes children.

Everything stays in the browser of the device: nothing is sent anywhere, and clearing the browser's site data clears it. To add an app, add its storage key to `APP_KEYS` in `shared/profile.js` (or move the app's old saves itself, as Robo Logic does) and to the list of app keys removed with a child in `remove()`, add a row to `APPS` in `orangtua/index.html`, and add `../shared/profile.js` to the app's service worker `CORE` list.

## Running locally

Any static file server works, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Contributing

Every change goes through its own branch and pull request.

- Branch names use the change type as a prefix: `feat/…`, `fix/…`, `docs/…`, `refactor/…`, `chore/…`.
- PR titles follow Conventional Commits, for example `feat(hijaiyah): add a new quiz`. The `PR Title` workflow checks this.
- Fill in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

These rules match [gha-shared-workflows](https://github.com/megawan/gha-shared-workflows), which also provides the HTML, link and PR title checks.
