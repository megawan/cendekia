# Logica

Logical and computational thinking games for children, with Gbot the robot. Everything is in English, and there is no voice: prompts are shown in Gbot's speech bubble, with short sound effects.

## Children and difficulty

Logica uses the children shared by every Cendekia app (`shared/profile.js`): the same child plays here and in the other apps. The chip at the top left of the home screen switches children or adds one; renaming, the picture, the daily time limit and removing a child are also on the [parents' page](../orangtua/). The daily time limit applies here too: a level or random map cannot start once it is used up.

Each child picks a difficulty, stored per child: the badge at the top right (🌱 Easy, 🌿 Medium or 🌳 Hard) changes it at any time, and a child opening Logica for the first time is asked to choose. Stars are kept for every difficulty, so switching never loses progress.

| Difficulty | Ages | What changes |
| --- | --- | --- |
| Easy | 4–5 | 10 small robot maps, a repeat block only at the end, three choices, one question fewer per round, six items in the filter, simple number machines, 4×4 pictures, three bulbs and letters moved one step, 3×3 sudokus that grow to 4×4 |
| Medium | 6–7 | 14 robot maps with repeat blocks, a first function and a first if block; the original questions, 5×5 pictures, four bulbs, letters moved one or two steps, 4×4 and 6×6 sudokus |
| Hard | 8–10 | 10 bigger robot maps with repeat, function and if blocks; four choices, gaps in the middle of patterns, arrows turning by 45 degrees, two machine examples, up to five balls and chained balances, ten items from four colors and shapes in the filter, 6×6 pictures, five bulbs (up to 31) with no running total, letters moved up to three steps and five-letter words, 4×4 and 6×6 sudokus with more gaps |

## Worlds

Every world has its own levels. A level opens once the level before it has at least one star, and each level gives one to three stars.

| World | Skill | What the child does |
| --- | --- | --- |
| Robot Path | Algorithms | Builds a program from arrow blocks, then runs it and watches Gbot follow it step by step on a grid with rocks, water, gems, yellow tiles and a flag. Later levels add a repeat block (🔁 ×2 to ×9), a function (★, built once in its own tray and used again) and an if block (on a yellow tile Gbot takes the first arrow, anywhere else the second). A block limit makes the new block necessary. 🎲 Random map makes a new map every time, for practice without stars. |
| Patterns (8 levels) | Pattern recognition | Finds what comes next or what is missing: colors, shapes, repeating units, growing dot counts, turning arrows, and two rules at once. |
| Magic Machine (8 levels) | Abstraction | Watches items go in and out of a machine, works out the rule (change color, change shape, add one, turn, double, two changes, add two, number rules) and picks what comes out next. |
| Balance (6 levels) | Logical reasoning | Reads one to four balances and picks the heaviest or lightest ball, then finds how many small balls balance some big ones. |
| Fix the Code | Debugging | Runs a program with one wrong block, finds the block and fixes it. The bug is chosen at random each time and is checked to make the program fail. |
| Secret Code (7 levels) | Codes and binary | Reads a picture from rows of 0 and 1 and paints one from a code; writes a row as a short code (3 filled, 2 empty: run-length coding); reads a number from light bulbs worth 16, 8, 4, 2 and 1 and lights the bulbs for a number (binary); reads and writes words whose letters moved along the alphabet (a Caesar cipher). Pictures are random and mirrored, like little space invaders. |
| Mini Sudoku (7 levels) | Deduction | Fills the gaps so each shape is once in every row and column, and in every box of the 4×4 (2×2 boxes) and 6×6 (2×3 boxes) grids. Tap a gap, then a shape. Each puzzle is made fresh and checked to have exactly one solution, so it never needs guessing. After two wrong checks, one wrong square is filled in. |
| Logic Filter (7 levels) | Boolean logic | Picks every item that matches a rule: one property, AND, NOT, OR, BUT NOT, and rules about size. |

The first time a player opens a world, a short animated "How to play" appears; ❓ How on the world screen shows it again.

Hints: after a failed run, 💡 appears in Robot Path. The first hint shows numbered footprints along a working path, the second shows a working program. In Fix the Code, 💡 makes the wrong block glow. Using a hint keeps the stars at two at most.

Robot stars: three for a program with no more blocks than the solution and fewer than two failed runs, one less for each of those missed. Fixing stars: one less for more than one change, and one less for two or more failed runs after the first change. Quiz stars: three with every question right on the first try, two with up to two misses.

Stickers: twelve space stickers unlock as the player's total star count, over all difficulties, grows (`STICKERS` in `index.html`). Days in a row are counted as in the other apps. Each child's progress is kept in `localStorage` under `logika.v3.<child id>`. Logica's own players from before (`logika.v2`, or `logika.v1`) moved once to the shared children: a player with the same name as a child becomes that child, the player who was playing becomes the current child, and the others become new children.

## For parents

👪 For parents, at the bottom of the home screen, opens a summary after a small sum for grown-ups (a × b). For each child it shows:

- stars in all, days in a row, puzzles solved this week and the share right on the first try
- a chart of puzzles solved per day over the last 14 days (with a table for screen readers)
- every skill with its stars at the current difficulty and a status: Strong (80% or more right on the first try), Growing (50–79%), Needs practice (below 50%), or Just started (fewer than three tries)
- up to four levels with the most mistakes, worth practicing
- tips, such as moving up a difficulty when most answers are right, or playing a world together
- what each world trains

For the summary, every child keeps `log` (per difficulty, world and level: questions and how many were right on the first try, robot runs, wins, failed runs and hints) and `days` (puzzles solved per day, the last 60 days). This is counted from the first game after the summary was added; earlier stars are included. Nothing leaves the device.

Every finished level also goes to the shared log (`Cendekia.round`), and the first mistake of a question or the first failed run of a level to the shared list of things that went wrong (`Cendekia.weak`), so Logica shows on the [parents' page for all apps](../orangtua/) with time played, progress, mistakes and last rounds.

## Animations

Gbot walks, wobbles, bumps into rocks and dances at the flag, gems fly up when collected, the blocks light up as they run (inside repeats and the function too), the machine's gears spin while items feed in and shoot out, the balances tilt with a bounce, answers fly into place and matching items drop through the filter. With "reduce motion" turned on in the device settings, all animation is off.

## Content

Robot and fixing levels, for each difficulty, and Gbot's messages live in the `<script type="application/json" id="content">` block in `index.html`. Maps use `.` grass, `#` rock, `~` water, `*` gem, `y` yellow tile, `R` Gbot and `F` the flag. A program is written with `U D L R`; `4(RD)` repeats `R D` four times, `?DR` goes down on a yellow tile and right anywhere else, and `F` calls the function, which is written after `|` (`FFF|RRU`). `tools` lists the blocks a level offers besides the arrows (`loop`, `if`, `fn`) and `max` is the most blocks a program may use. Pattern, machine, balance and filter questions are generated each time.

After changing a level, check that every map can be solved:

```bash
node tools/check-levels.mjs
```

It runs each solution, checks the block limit and the blocks the level offers, checks that the limit cannot be met with arrows alone, and for levels without loops, ifs or functions checks that no shorter path exists. `--solve` also prints a shortest path for every map.

## Sound

There is no voice. Sound effects (taps, steps, bumps, gems, the machine, right and wrong answers) are made with the Web Audio API.

After changing the page, bump `CACHE` in `sw.js` so installed copies refresh.

## Offline and install

`sw.js` precaches the page and icons, and keeps Google Fonts in a separate cache. The manifest lets the game be installed to the home screen.
