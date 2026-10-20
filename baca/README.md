# Ayo Membaca

An early reading game in Indonesian. Children go from vowels to letters, syllables, words and short sentences, then on to closed syllables, long words, gap-filling and short stories with questions, with every item read aloud. The UI and content are in Indonesian.

## Modes

- Petualangan (adventure map): twenty-two stages in order, the first ten for beginners and twelve advanced stages. Each stage is a round of eight questions and gives one to three stars. A stage opens once the stage before it has at least one star.

  | Stage | Question |
  | --- | --- |
  | Huruf Vokal, Huruf b–m, Huruf n–z | Hear a letter name, pick the letter |
  | Suku Kata (three groups of consonants) | Hear a syllable, pick it. Wrong options share the consonant or the vowel |
  | Kata Pertama | Read a two-syllable word and pick its picture, or hear a word and pick it |
  | Susun Kata | See a picture, tap the syllables in order |
  | Kata Panjang | Three-syllable words, reading and building |
  | Kalimat | Read a short sentence and pick its picture. Each word can be tapped, and the speaker reads along word by word |

  Advanced stages, after Kalimat:

  | Stage | Question |
  | --- | --- |
  | Huruf ng ny sy kh | Hear a syllable made with a letter pair (nga, nyi, syu, kho ...) and pick it. Wrong options keep the pair or the vowel |
  | Kata dengan ng dan ny | Read a word such as bunga, tangan or monyet and pick its picture, or build it from syllables |
  | Suku Kata Tertutup | The same for words with closed syllables (pen-sil, bu-lan, se-mut) |
  | Kata Lebih Panjang | Words of three or four syllables (ke-lin-ci, he-li-kop-ter) |
  | Kalimat Panjang | Read a sentence of five or six words and pick its picture. The wrong pictures belong to the sentences that share the most words with it, so the whole sentence has to be read |
  | Lengkapi Kalimat | A word is missing from a sentence. Pick the right word from three. The full sentence is read once it is filled in |
  | Cerita: Bola Merah Budi, Kucing yang Lapar, Hari Hujan, Semut dan Merpati, Pergi ke Pasar, Kancil dan Buaya | Read a story of five pages, one sentence and picture each (tap any word to hear it, the speaker reads the page), then answer three questions about it. Three stars for no mistakes, two for one, one otherwise |

- Huruf A–Z: tap a letter to hear its name and an example word.
- Suku Kata: pick a consonant to see it joined with each vowel (b + a = ba).
- Kata Bergambar: tap a word card to hear it read syllable by syllable, then as a whole word.
- Stiker-ku: twelve animals of Indonesia that unlock as the total star count grows (`STICKERS` in `index.html`).

## Rewards

- Stars: three for at most one question missed on the first try, two for at most three, one otherwise. Stars add up across rounds.
- Combo: three or more first-try answers in a row show a flame counter and confetti.
- Learning days: the home screen counts consecutive days with at least one finished round.
- Kiki the owl coaches. A right answer gets a cheer in the speech bubble and a short chime, with no spoken praise (the `cheers` list). A wrong answer gets a spoken encouragement to try again. After two misses the right answer blinks.

Progress is kept in `localStorage` under `baca.v1`. "Mulai ulang petualangan" on the map clears the stage stars but keeps the total and the stickers.

## Content and sound

All words, sentences, stories and spoken phrases live in the `<script type="application/json" id="content">` block in `index.html`. Each phrase has a recording at `audio/<slug>.mp3`, where the slug is the lowercase text with every run of other characters replaced by `-` (for example `ini-bola.mp3`). If a file is missing, the game falls back to the device's Indonesian speech voice.

The recordings are made with the macOS Indonesian voice (Damayanti):

```bash
node tools/make-audio.mjs
```

It records only the missing files (`--force` records all of them again) and rewrites `audio/index.json`, the list the service worker precaches. It needs macOS `say` and `ffmpeg`. To improve pronunciation, replace any file with your own recording using the same name.

After adding content, run the script, then bump `CACHE` in `sw.js` so installed copies refresh.

## Offline and install

`sw.js` precaches the page, icons and every file in `audio/index.json`, and keeps Google Fonts in a separate cache. The manifest lets the game be installed to the home screen.
