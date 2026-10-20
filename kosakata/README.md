# Kosakata

An Indonesian–English vocabulary game. Children learn about a hundred everyday English words in ten themes, hearing every word in both languages. The UI and spoken prompts are in Indonesian, the words being learned are in English.

## Modes

- Petualangan (adventure map): thirteen stages in order. Each stage is a round of eight questions and gives one to three stars. A stage opens once the stage before it has at least one star.

  | Stage | Question |
  | --- | --- |
  | Hewan, Buah, Makanan, Tubuh, Rumah, Pakaian, Kendaraan, Alam, Warna, Keluarga | Hear an English word and pick its picture, or see a picture with its Indonesian word and pick the English word |
  | Tebak Arti | See an Indonesian word and pick the English word, or hear and read an English word and pick the Indonesian one. Words from every theme |
  | Eja Kata | See a picture and tap the letters of the English word in order. Words of three to five letters |
  | Juara Kosakata | All the question types, words from every theme |

  After a right answer, the English word and then the Indonesian word are played, so both sounds stay tied to the same picture.
- Kartu Kata: pick a theme, tap a card to see the picture and hear the English and Indonesian word. The two buttons play each language again.
- Stiker-ku: twelve birds that unlock as the total star count grows (`STICKERS` in `index.html`).

Wrong options never repeat the English text, the Indonesian text or the picture of the answer, so "orange" the fruit and "orange" the colour are never offered together.

## Rewards

Same as the other apps: one to three stars per round, a combo counter with confetti for three or more first-try answers in a row, and a count of learning days in a row. A right answer gets a chime and a cheer in Kiki's speech bubble, with no spoken praise. A wrong answer gets a spoken "Ayo coba lagi" and, after two misses, the right answer blinks.

Progress is kept in `localStorage` under `kosakata.v1`.

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
