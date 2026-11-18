# cendekia
A collection of simple, friendly learning apps for kids. The name cendekia means “scholar” or “learned person” in Indonesian.

The apps are static pages with no build step, served with GitHub Pages at https://megawan.github.io/cendekia/.

## Apps

| Folder | App |
| --- | --- |
| [`iqra/`](iqra) | Iqra: learn the 28 hijaiyah letters, their harakat and sounds, and a first prayer. Moved here from `megawan.github.io/games/hijaiyah/`; `hijaiyah/` redirects. |
| [`aksara/`](aksara) | Aksara: early reading in Indonesian, from letters and syllables to words, sentences and short stories with questions, in four levels, with stars and stickers. |
| [`lexica/`](lexica) | Lexica: English vocabulary for Indonesian speakers, in 24 themes (including body parts, organs and street furniture), with sound in both languages and the same stars, stickers and streaks. |
| [`logica/`](logica) | Logica: logical and computational thinking games in English, with Poka the beaver. Program a robot (with loops), find patterns, work out a machine's rule, read balances, fix a buggy program, pick items with AND, OR and NOT, crack codes in binary and letters, solve mini sudokus, work out who has which pet from clues, sort a train, slide cars out of a parking lot, and build robot maps to share. With animations, stars and stickers. |
| [`numeria/`](numeria) | Numeria: everyday math in English with Myria the squirrel, in nine places around town ordered from the easiest to the hardest: counting in the kitchen, a hands-on Number Lab (ten-frames, number lines, tens and ones blocks), adding at the market, money, the clock, sharing pizza and fractions, measuring and baking, sale prices and percent, and planning a trip. Six levels each, from counting five apples to discounts, speed and timetables. |
| [`omnia/`](omnia) | Omnia: general knowledge in English with Pacha the llama, starting with interactive maps. Find the cities of Indonesia (every provincial capital and other well-known cities, island by island) the countries and capitals of the world and their flags (continent by continent), the mountains, rivers, lakes, deserts, oceans and seas of the world, the houses, dances, foods and music of Indonesia, where the animals of the world live, the volcanoes and big disasters of Indonesia, its islands, straits and seas, and its peoples and their languages, the landmarks and foods of the world, and the rivers and lakes of Indonesia, the solar system, the water cycle, food chains, and a real spinning Earth with the seasons and the Moon, and the life cycles of a butterfly and a frog as animated scenes, and games on the map (a jigsaw, Who Am I?, Neighbours, Bigger or Farther? and Island Routes), or tap around the map to explore. Drag, pinch and zoom, with stars and stickers. |

`phonics/` (Phonics Fun) is paused: it is no longer linked from the home page or the parent page, and its address shows a closed notice. The full app is in git history (before the commit that closed it) and saved progress is kept.

Each app keeps its own README with details. The mascots and where their names come from are in [`MASCOTS.md`](MASCOTS.md). `shared/mascot.js` adds a one-line note about the mascot's name under the subtitle of a home screen whose `.hero` has `data-mascot="<app>"`; tapping it opens a bottom sheet with the story. A new app's service worker `CORE` list needs the script too.

The look comes from `shared/arc.css` (an Arc-style theme: soft accent-tinted gradient, frosted surfaces, hairline borders, pill buttons). Every page loads it after its own styles, and each app's service worker caches it, so add it to the `CORE` list of a new app.

Motion comes from `shared/motion.js`, which draws with [anime.js](https://animejs.com) (`shared/anime.esm.min.js`, MIT, loaded the first time something animates). `Cendekia.fx.confetti(n)` drops confetti (or emoji with `{ glyphs }`) and `Cendekia.fx.burst(element)` sparks around a right answer. `Cendekia.fx.reveal(starsElement, giftElement)` pops the earned stars (`.on`) in one by one and then drops in the new-sticker box on a result screen. `Cendekia.fx.flip(element)` turns an element over like a card (its parent needs CSS `perspective`; Lexica's word cards use it) and `Cendekia.fx.cascade(elements)` lets elements rise in one after another. `Cendekia.fx.count(element)` counts the number in an element up from 0 and `Cendekia.fx.flame(element)` flickers it (the home screens' stars, days in a row and streak flame use them on their own, through the ids `homeStars` and `homeDays`). `Cendekia.fx.pop(element)` swells an element that was just finished (the letter tracer uses it with `burst` when a letter is done). `Cendekia.fx.drag(element, { axis, step, onGrab, onDrag, onSettle })` lets an element be dragged along one axis in steps, with anime.js's draggable (Logica's parking lot uses it; the caller keeps the real place and the drag only shifts it by a transform; `range(min, max)` limits it, `reset()` zeroes the shift and `enable(false)` stops it). `Cendekia.fx.hop(element, left, top)` jumps an absolutely placed element to a new place (the frog in the Number Lab) and `Cendekia.fx.drop(element)` lets it fall into place (new blocks). `Cendekia.fx.mascot(svg)` makes a mascot blink and move (Pochi, Sada, Renjana, Myria, Pacha and Poka, whose ears move and whose coaches hop; the robot on the Logica board keeps its CSS animations; a mascot's `<symbol>` marks its parts with the classes `crest`, `wing-l`, `wing-r`, `ear-l`, `ear-r`, `tail`, `mane` and `eyes`, see `PARTS` in the script) and `Cendekia.fx.react(svg, 'cheer' | 'oops')` hops or shakes it. Screens need no call: once the page has loaded, every `<section>` in `<main>` that goes from `hidden` to shown has its children rise in one after another. Nothing is drawn when the device asks for reduced motion. Load the script after `shared/profile.js` and add both files to a new app's service worker `CORE` list.

`shared/whatsnew.js` is the "What's new" popup on the landing page. To announce a new week, change `RELEASE.id` and `items` at the top of the script: a device that has visited before sees the popup once for each new id (a first visit only records it), and the "What's new" link in the footer opens it again. The id is saved in `cendekia.whatsnew.v1`.

## Support

If Cendekia is useful to your family, you can [buy me a coffee](https://buymeacoffee.com/megawan). The same link is in the footer of the home page.

## Children and the parent page

Several children can share one device. `shared/profile.js` is loaded by every app and by the landing page. `shared/trace.js` (letter tracing, used by Aksara and Iqra) is loaded after it and must be in those apps' service worker `CORE` list too.

`shared/profile.js` gives:

- A chip at the top of each home screen shows the current child. Tapping it lets a child switch or add another one. Each child has their own stars, stickers and progress in every app (`<app key>.<child id>` in `localStorage`).
- The first time it runs it creates "Child 1" and copies the progress the apps saved before profiles existed into it, so nothing is lost.
- Every finished round is logged (app, stage, stars, right answers, time), and so is each question answered wrong on the first try.

[`parents/`](parents) is the page for parents, opened from "👪 For parents" and protected by a small sum so a young child does not open it by accident. For each child it shows the days in a row, stars, minutes this week, a seven-day chart, progress per app, the letters and words that most often went wrong, and the last rounds. It also sets a daily time limit (a new round cannot start once it is used up), renames, changes the picture of, adds and deletes children.

Everything stays in the browser of the device: nothing is sent anywhere, and clearing the browser's site data clears it. To add an app, add its storage key to `APP_KEYS` in `shared/profile.js` (or move the app's old saves itself, as Logica does) and to the list of app keys removed with a child in `remove()`, add a row to `APPS` in `parents/index.html`, and add `../shared/profile.js` to the app's service worker `CORE` list.

## Accessibility

Every home screen has an **Aa** button beside the child chip (`Cendekia.access()` opens the same panel). It sets, for the whole device and every child: text size (normal, large, extra large, by scaling the root font size), high contrast or night colours, easy-to-read letters (Verdana-style font with more spacing) and calm (no animation). The choices are saved in `cendekia.a11y.v1` and applied as `data-a11y-*` attributes on `<html>`, styled from `shared/profile.js`. Animation code should ask `Cendekia.calm()`, which is also true when the device asks for reduced motion.

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
| [`tests/regression/`](tests/regression) | One test per past bug or change |

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
- PR titles follow Conventional Commits, for example `feat(iqra): add a new prayer`. The `PR Title` workflow checks this.
- Fill in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

These rules match [gha-shared-workflows](https://github.com/megawan/gha-shared-workflows), which also provides the HTML, link and PR title checks.
