# Robo Logika

Logical and computational thinking games for children, with Robi the robot. The UI and spoken prompts are in Indonesian.

## Worlds

Every world has its own levels. A level opens once the level before it has at least one star, and each level gives one to three stars.

| World | Skill | What the child does |
| --- | --- | --- |
| Jalan Robot (12 levels) | Algorithms | Builds a program from arrow blocks, then runs it and watches Robi follow it step by step on a grid with rocks, water, gems and a flag. From level 7 a repeat block (🔁 ×2 to ×5) is needed to fit the block limit. |
| Tebak Pola (8 levels) | Pattern recognition | Finds what comes next or what is missing: colors, shapes, repeating units, growing dot counts, turning arrows, and two rules at once. |
| Mesin Ajaib (8 levels) | Abstraction | Watches items go in and out of a machine, works out the rule (change color, change shape, add one, turn, double, two changes, add two, number rules) and picks what comes out next. |
| Timbangan (6 levels) | Logical reasoning | Reads one to three balances and picks the heaviest or lightest ball, then finds how many small balls balance some big ones. |
| Perbaiki Kode (8 levels) | Debugging | Runs a program with one wrong block, finds the block and fixes it. The bug is chosen at random each time and is checked to make the program fail. |
| Saringan Logika (7 levels) | Boolean logic | Picks every item that matches a rule: one property, DAN, BUKAN, ATAU, "tapi bukan" (and not), and rules about size. |

Robot stars: three for a program with no more blocks than the solution and fewer than two failed runs, one less for each of those missed. Fixing stars: one less for more than one change, and one less for two or more failed runs after the first change. Quiz stars: three with every question right on the first try, two with up to two misses.

Stickers: twelve space stickers unlock as the total star count grows (`STICKERS` in `index.html`). Days in a row are counted as in the other apps. Progress is kept in `localStorage` under `logika.v1`.

## Animations

Robi walks, wobbles, bumps into rocks and dances at the flag, gems fly up when collected, the blocks light up as they run, the machine's gears spin while items feed in and shoot out, the balances tilt with a bounce, answers fly into place and matching items drop through the filter. With "reduce motion" turned on in the device settings, all animation is off.

## Content

Robot and fixing levels, spoken phrases and the words for the filter rules live in the `<script type="application/json" id="content">` block in `index.html`. Maps use `.` grass, `#` rock, `~` water, `*` gem, `R` Robi and `F` the flag. A program is written with `U D L R`, and `4(RD)` repeats `R D` four times. Pattern, machine, balance and filter questions are generated each time.

After changing a level, check that every map can be solved:

```bash
node tools/check-levels.mjs
```

It runs each solution, checks the block limit, and for levels without loops checks that no shorter path exists.

## Sound

Each phrase plays `audio/<slug>.mp3`, recorded with the macOS voice Damayanti:

```bash
node tools/make-audio.mjs
```

It records only missing files (`--force` records all of them again) and rewrites `audio/index.json`, the list the service worker precaches. It needs macOS `say` and `ffmpeg`. Without a recording, the device's Indonesian voice reads the phrase. A filter rule is spoken as a sequence of words, for example "Pilih semua yang" + "merah" + "dan" + "lingkaran". Sound effects are made with the Web Audio API.

After changing content or the page, bump `CACHE` in `sw.js` so installed copies refresh.

## Offline and install

`sw.js` precaches the page, icons and every file in `audio/index.json`, and keeps Google Fonts in a separate cache. The manifest lets the game be installed to the home screen.
