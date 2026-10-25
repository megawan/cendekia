# Numeria

Everyday math for children, in English, with Ollie the owl. Every question comes from daily life: eggs in a basket, coins at the shop, the bus timetable, a pizza to share, a recipe to change, a sale price to work out.

## Places and levels

The home screen is a small town of nine places, ordered from the easiest (counting apples, ages 4–6) to the hardest (planning a trip, ages 10–12). Each place has six levels, also from easy to hard (🌱 Easy, 🌿 Medium, 🌳 Hard). A level opens once the level before it has at least one star; every place can be opened from the start, so an older child can go straight to the harder places.

| # | Place | Skill | Ages | Levels |
| --- | --- | --- | --- | --- |
| 1 | 🧺 Kitchen Counting | Counting | 4–6 | Count to 5, Count to 10, More or fewer, One more one less, Count by 2s and 5s, Tens and ones |
| 2 | 🧪 Number Lab | Hands-on numbers | 4–8 | Fill the frame, Make ten, Two ten-frames, Number line to 10, Number line to 20, Tens and ones |
| 3 | 🛒 Market Add & Take | Adding and taking away | 5–8 | Add to 5, Take away to 5, Within 10, Within 20, Two-digit numbers, Two steps |
| 4 | 🪙 Coin Shop | Money | 5–9 | Count the coins, Coins and notes, Is it enough?, Shopping list, Change, Dollars and cents |
| 5 | ⏰ Daily Clock | Telling time | 5–10 | O'clock, Half past, Quarter hours, Every 5 minutes, How long?, Times and days |
| 6 | 🍕 Pizza Party | Sharing and fractions | 6–10 | Share fairly, Equal groups, Times tables, Dividing, Pizza fractions, Fraction of a number |
| 7 | 📏 Measure & Bake | Measuring | 6–11 | Longer or shorter, Use a ruler, Read the scale (ruler not from 0, measuring jug), Recipes, Changing units, Area and perimeter |
| 8 | 🏷️ Big Sale | Percent and best buys | 9–12 | Half price, 10% off, Discounts, Best buy, Saving up, Many steps |
| 9 | 🚌 Trip Planner | Data, speed and planning | 10–12 | Read a chart, Averages, Timetables, Speed and distance, Maps and fuel, Grand challenge |

The easiest question is counting up to five apples on a table; the hardest are multi-step ones such as a 25% discount paid with a note, or when a bus driving 150 km at 60 km an hour arrives.

Questions are made fresh every round (`WORLDS` in `index.html`; each level is a name and a function returning one question), with pictures drawn for them: emoji groups, plates, coins and notes, price tags, an analog clock, a pizza, a ruler, a measuring jug, a garden on squared paper, a bar chart and a bus timetable. Easier levels have two to four answers to choose from; harder ones use a number pad (with a decimal point where cents or half kilometers are needed). A round has six questions in levels 1–3 and five in levels 4–6.

In the Number Lab a question is answered with a hands-on tool instead of buttons or the number pad: the child works the tool and presses Check.

- Ten-frame: tap squares to show a number, or to fill a frame that already has some dots (make 10, make 20). One frame up to 10, two frames up to 20.
- Number line: tap a number on the line, or where the frog lands after hopping forward or back. A line to 10, then to 20 (in two rows).
- Tens and ones: build a number with tens rods and ones cubes (plus and minus buttons), or build how many there are after adding two stacks of blocks. The blocks are shown only for the numbers in the question; the total is never shown, so place value has to be worked out.

A wrong answer gets a second try. A second miss shows the answer with a short explanation of how to get it (count on, add the tens first, 10% is dividing by 10, and so on).

## Trace numbers

✏️ "Trace numbers" on the home screen, under the nine places, lets a child draw over the numbers 0 to 10, each with the matching number of apples and its word. The scoring, three stars for a neat line and the `shared/trace.js` code are described in [Aksara's README](../aksara/README.md#tracing). Numbers are drawn in the Andika font. The best stars for each number are kept in `traced` in the child's save, each traced number goes to the shared log as a round called "Tracing", and the daily time limit applies. These stars are shown on the tracing screen only and do not count toward the town stars, so the town stickers still mean that the levels were played.

## Stars and stickers

Three stars for every question right on the first try, two for up to two misses, one for finishing. Twelve town stickers unlock as the total star count grows (162 stars at most). Days in a row are counted as in the other apps.

## Children and parents

Numeria uses the children shared by every Cendekia app (`shared/profile.js`). Each child's stars and days in a row are kept in `localStorage` under `numeria.v1.<child id>` (`best` holds the stars of each level as `"<place>.<level>"`). Every finished round goes to the shared log (`Cendekia.round`) and every first miss to the shared list of things that went wrong (`Cendekia.weak`, labeled with the place and level), so Numeria shows on the [parents' page](../parents/) with time played, progress, the levels that went wrong most and the last rounds. The daily time limit set there applies here too.

## Sound, motion and offline

Sound effects are made with the Web Audio API; there is no voice. With "reduce motion" turned on in the device settings, all animation is off.

`sw.js` precaches the page, the icons, `../shared/profile.js` and `../shared/trace.js`. After changing the page, bump `CACHE` in `sw.js` so installed copies refresh.
