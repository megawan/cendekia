# Lexica

An Indonesian–English vocabulary game. Children learn about 300 English words in 24 themes, hearing every word in both languages. Buttons, headings, theme names and messages are in English; Kiki's spoken instructions stay in Indonesian, the children's own language, and every word is shown and read in both languages.

## Themes

Farm animals, Wild animals, Sea animals, Insects & reptiles, Birds, Fruit, Vegetables, Food & drinks, **The face** (12 parts, from hair to chin), **The body** (19 parts, from head to toe), **Inside the body** (brain, heart, lungs, liver, stomach, kidneys, intestines ...), The house, The kitchen, School, Clothes, Vehicles, **On the street** (zebra crossing, bollard, traffic cone, speed bump, sidewalk, crossroads, manhole, traffic light, bus stop ...), Weather, Nature, Colors, Family, Jobs, Places in town, Toys & music.

## Modes

- Adventure: pick a theme from the grid (all open, so a child can start with what interests them). Each theme is a round of eight questions and gives one to three stars. Three more stages mix every theme.

  | Stage | Question |
  | --- | --- |
  | Each theme | Hear an English word and pick its picture, or see a picture with its Indonesian word and pick the English word. Wrong options come from the same theme first |
  | The face, The body, Inside the body | The picture is a figure with the part marked. Word options only, since marked pictures look too alike to choose between |
  | Guess the meaning | See an Indonesian word and pick the English word, or hear and read an English word and pick the Indonesian one. Words from every theme |
  | Spell it | See a picture and tap the letters of the English word in order. Words of three to five letters |
  | Word champion | All the question types, words from every theme |

  After a right answer, the English word and then the Indonesian word are played, so both sounds stay tied to the same picture.
- Word cards: pick a theme, tap a card to see the picture and hear the English and Indonesian word. The two buttons play each language again.
- My stickers: twelve birds that unlock as the total star count grows (`STICKERS` in `index.html`).

Wrong options never repeat the English text, the Indonesian text or the picture of the answer, so "orange" the fruit and "orange" the colour are never offered together.

## Pictures

A word's third value is its picture:

| Value | Picture |
| --- | --- |
| an emoji, for example `🐱` | the emoji |
| `art:<name>`, for example `art:bollard` | a small drawing from `ART` in `index.html`, for things that have no emoji (zebra crossing, bollard, traffic cone, speed bump, sidewalk, crossroads, manhole) |
| `fig:<figure>:<part>`, for example `fig:face:eye` | a figure (`face`, `body` or `back`) with the part marked. The marks are ellipses in `HL`, as `[cx, cy, rx, ry, rotation]` in the figure's own units, so a new part is one line |

## Rewards

Same as the other apps: one to three stars per round, a combo counter with confetti for three or more first-try answers in a row, and a count of learning days in a row. A right answer gets a cheer in Kiki's speech bubble, a wrong answer gets "Ayo coba lagi" there and the word is played again, and after two misses the right answer blinks. Nothing is said or sounded to praise the child: no chime on a right answer, no fanfare at the end of a round or when a sticker is won, only confetti.

Progress is kept in `localStorage` under `kosakata.v1.<child>`, one save per child (see the main README).

## Content and sound

All themes, words and spoken phrases live in the `<script type="application/json" id="content">` block in `index.html`. A word is `[indonesian, english, emoji]`. To add a word, add a row, then record it.

Each word has two recordings, `audio/id-<slug>.mp3` and `audio/en-<slug>.mp3`, where the slug is the lowercase text with every run of other characters replaced by `-` (for example `en-ice-cream.mp3`). Prompts are Indonesian, `audio/id-<slug>.mp3`. If a file is missing, the game falls back to the device's voice for that language.

The recordings are made with the macOS voices Damayanti (Indonesian) and Samantha (English):

```bash
node tools/make-audio.mjs
```

It records only the missing files (`--force` records all of them again) and rewrites `audio/index.json`, the list the service worker precaches. It needs macOS `say` and `ffmpeg`. To improve pronunciation, replace any file with your own recording using the same name.

After changing content, run the script, then bump `CACHE` in `sw.js` so installed copies refresh.

## Offline and install

`sw.js` precaches the page, icons and every file in `audio/index.json`, and keeps Google Fonts in a separate cache. The manifest lets the game be installed to the home screen.
