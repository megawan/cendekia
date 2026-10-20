# Phonics Fun

An English phonics game. Children learn letter sounds in the usual synthetic phonics order (s a t p i n first), then blend sounds into words, spell words from sounds, and read short sentences. The UI and spoken prompts are in English.

## Modes

- Adventure: eleven stages in order. Each stage is a round of eight questions and gives one to three stars. A stage opens once the stage before it has at least one star.

  | Stage | Question |
  | --- | --- |
  | s a t p i n, m d g o c k, e u r h b f l, j v w x y z qu | Hear a sound and pick its letters, or see a picture and pick the sound it starts with |
  | First words, More words | Read a word and pick its picture, or hear a word and pick it from words that look alike |
  | Spell it | See a picture, tap the sounds in order |
  | sh ch th ck | Sounds made by two letters |
  | Two letters, one sound | Words with sh, ch, th and ck, reading and spelling |
  | ee and oo | Words with long vowels, reading and spelling |
  | Sentences | Read a short sentence and pick its picture. Each word can be tapped, and the speaker reads along |

  c, k and ck make the same sound, so they never appear together as options (`SAME` in `index.html`).
- Sounds: tap a sound to hear it, its picture word, and the sound again ("sss, sun, sss").
- Blending: tap a word card to hear it sounded out ("c, a, t, cat"). Two letters that make one sound are underlined.
- My Stickers: twelve sea animals that unlock as the total star count grows (`STICKERS` in `index.html`).

## Rewards

Same as Ayo Membaca: one to three stars per round, a combo counter with confetti for three or more first-try answers in a row, and a count of learning days in a row. A right answer gets a chime and a cheer in Kiki's speech bubble, with no spoken praise. A wrong answer gets a spoken "Try again" and, after two misses, the right answer blinks. At the end of a round, and when a sticker is won, only a short fanfare and confetti play: nobody speaks.

Progress is kept in `localStorage` under `phonics.v1`.

## Content and sound

All sounds, words, sentences and spoken phrases live in the `<script type="application/json" id="content">` block in `index.html`.

| File | Content |
| --- | --- |
| `audio/sound-<letters>.mp3`, for example `sound-sh.mp3` | a letter sound |
| `audio/<slug>.mp3`, for example `the-sun-is-hot.mp3` | a word, sentence or phrase. The slug is the lowercase text with every run of other characters replaced by `-` |

If a file is missing, the game falls back to the device's English speech voice.

The recordings are made with the macOS voice Samantha:

```bash
node tools/make-audio.mjs
```

It records only the missing files (`--force` records all of them again) and rewrites `audio/index.json`, the list the service worker precaches. It needs macOS `say` and `ffmpeg`.

A speech voice cannot say a letter sound on its own: "mmm" is read as "em em em". So most sounds are cut out of a recorded word, as set by `cut` and `from` for each sound:

| `cut` | Takes | Example |
| --- | --- | --- |
| `vowel` | the start of the word, up to the closure of the next consonant | a from "apple" |
| `fric` | the hiss at the start, found by its high zero-crossing rate | s from "sun" |
| `son` | the hum at the start, up to where the vowel begins | m from "mat" |
| `final` | the end of the word, after its vowel | x from "box" |

Short hums and hisses are stretched so they can be heard. Sounds that cannot be said without a vowel (t, p, b, d, g, k, h, j, w, y, ch, qu) use a short spelled syllable in `say`, such as "tuh". These are approximations: to improve a sound, replace its file with a real recording of the same name.

After changing content, run the script, then bump `CACHE` in `sw.js` so installed copies refresh.

## Offline and install

`sw.js` precaches the page, icons and every file in `audio/index.json`, and keeps Google Fonts in a separate cache. The manifest lets the game be installed to the home screen.
