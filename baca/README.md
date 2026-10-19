# Ayo Membaca

An early reading game in Indonesian. Children go from vowels to letters, syllables, words and short sentences, with every item read aloud. The UI and content are in Indonesian.

## Modes

- Petualangan (adventure map): ten stages in order. Each stage is a round of eight questions and gives one to three stars. A stage opens once the stage before it has at least one star.

  | Stage | Question |
  | --- | --- |
  | Huruf Vokal, Huruf b–m, Huruf n–z | Hear a letter name, pick the letter |
  | Suku Kata (three groups of consonants) | Hear a syllable, pick it. Wrong options share the consonant or the vowel |
  | Kata Pertama | Read a two-syllable word and pick its picture, or hear a word and pick it |
  | Susun Kata | See a picture, tap the syllables in order |
  | Kata Panjang | Three-syllable words, reading and building |
  | Kalimat | Read a short sentence and pick its picture. Each word can be tapped, and the speaker reads along word by word |

- Huruf A–Z: tap a letter to hear its name and an example word.
- Suku Kata: pick a consonant to see it joined with each vowel (b + a = ba).
- Kata Bergambar: tap a word card to hear it read syllable by syllable, then as a whole word.
- Stiker-ku: twelve animals of Indonesia that unlock as the total star count grows (`STICKERS` in `index.html`).

## Rewards

- Stars: three for at most one question missed on the first try, two for at most three, one otherwise. Stars add up across rounds.
- Combo: three or more first-try answers in a row show a flame counter and confetti.
- Learning days: the home screen counts consecutive days with at least one finished round.
- Kiki the owl cheers, or encourages another try. After two misses the right answer blinks.

Progress is kept in `localStorage` under `baca.v1`. "Mulai ulang petualangan" on the map clears the stage stars but keeps the total and the stickers.

## Content and sound

All words, sentences and spoken phrases live in the `<script type="application/json" id="content">` block in `index.html`. Each phrase has a recording at `audio/<slug>.mp3`, where the slug is the lowercase text with every run of other characters replaced by `-` (for example `ini-bola.mp3`). If a file is missing, the game falls back to the device's Indonesian speech voice.

The recordings are made with the macOS Indonesian voice (Damayanti):

```bash
node tools/make-audio.mjs
```

It records only the missing files (`--force` records all of them again) and rewrites `audio/index.json`, the list the service worker precaches. It needs macOS `say` and `ffmpeg`. To improve pronunciation, replace any file with your own recording using the same name.

After adding content, run the script, then bump `CACHE` in `sw.js` so installed copies refresh.

## Offline and install

`sw.js` precaches the page, icons and every file in `audio/index.json`, and keeps Google Fonts in a separate cache. The manifest lets the game be installed to the home screen.
