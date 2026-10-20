# Ayo Membaca

An early reading game in Indonesian. Children go from vowels to letters, syllables, words and short sentences, then on to closed syllables, long words, gap-filling and short stories with questions, with every item read aloud. The UI and content are in Indonesian.

## Modes

- Petualangan: 28 stages in four levels, all open from the start, so a child who already reads can begin with sentences and stories and use the first two levels for revision. The stage that is suggested next (it bounces) goes first to sentences and stories, then words, then the basics. Each stage is a round of eight questions and gives one to three stars.

  | Level | Stages |
  | --- | --- |
  | 1 Dasar | Huruf Vokal, Huruf b–m, Huruf n–z, Suku Kata (three groups of consonants): hear a letter or syllable and pick it |
  | 2 Kata | Kata Pertama, Susun Kata, Kata Panjang, Huruf ng ny sy kh, Kata dengan ng dan ny, Suku Kata Tertutup, Kata Lebih Panjang: read a word and pick its picture, or build it from syllables |
  | 3 Kalimat | Kalimat, Kalimat Panjang, Kalimat Sangat Panjang, Lengkapi Kalimat, Susun Kalimat |
  | 4 Cerita | Ten stories |

  Details of the stages:

  | Stage | Question |
  | --- | --- |
  | Huruf Vokal, Huruf b–m, Huruf n–z | Hear a letter name and pick the letter |
  | Suku Kata (three groups) | Hear a syllable and pick it. Wrong options share the consonant or the vowel |
  | Kata Pertama, Kata Panjang | Read a word and pick its picture, or hear a word and pick it (two syllables, then three) |
  | Susun Kata | See a picture and tap the syllables in order |
  | Huruf ng ny sy kh | Hear a syllable made with a letter pair (nga, nyi, syu, kho ...) and pick it |
  | Kata dengan ng dan ny | Read a word such as bunga, tangan or monyet and pick its picture, or build it from syllables |
  | Suku Kata Tertutup | The same for words with closed syllables (pen-sil, bu-lan, se-mut) |
  | Kata Lebih Panjang | Words of three or four syllables (ke-lin-ci, he-li-kop-ter) |
  | Kalimat | Read a short sentence and pick its picture. Each word can be tapped, and the speaker reads along word by word |
  | Kalimat Panjang, Kalimat Sangat Panjang | Read a sentence of five to nine words and pick its picture. The wrong pictures belong to the sentences that share the most words with it, so the whole sentence has to be read |
  | Lengkapi Kalimat | A word is missing from a sentence. Pick the right word from three. The full sentence is read once it is filled in |
  | Susun Kalimat | See a picture and tap the words of the sentence in order. One extra word does not belong |
  | Cerita | Read a story of five or six pages, one sentence and picture each (tap any word to hear it, the speaker reads the page), then answer three or four questions about it. Three stars for no mistakes, two for one, one otherwise |

  The stories are Bola Merah Budi, Kucing yang Lapar, Hari Hujan, Semut dan Merpati, Pergi ke Pasar, Kancil dan Buaya, Kura-kura dan Kelinci, Hari Pertama di Sekolah, Menanam Biji Kacang and Pesta Ulang Tahun.
- Huruf A–Z: tap a letter to hear its name and an example word.
- Suku Kata: pick a consonant to see it joined with each vowel (b + a = ba).
- Kata Bergambar: tap a word card to hear it read syllable by syllable, then as a whole word.
- Stiker-ku: twelve animals of Indonesia that unlock as the total star count grows (`STICKERS` in `index.html`).

## Rewards

- Stars: three for at most one question missed on the first try, two for at most three, one otherwise. Stars add up across rounds.
- Combo: three or more first-try answers in a row show a flame counter and confetti.
- Learning days: the home screen counts consecutive days with at least one finished round.
- Kiki the owl coaches. A right answer gets a cheer in the speech bubble and a short chime, with no spoken praise (the `cheers` list). A wrong answer gets a spoken encouragement to try again. After two misses the right answer blinks. At the end of a round, and when a sticker is won, only a short fanfare and confetti play: nobody speaks.

Progress is kept in `localStorage` under `baca.v1`. "Mulai ulang petualangan" on the map clears the stage stars but keeps the total and the stickers.

## Content and sound

All words, sentences, stories and spoken phrases live in the `<script type="application/json" id="content">` block in `index.html`. Each phrase has a recording at `audio/<slug>.mp3`, where the slug is the lowercase text with every run of other characters replaced by `-` (for example `ini-bola.mp3`). If a file is missing, the game falls back to the device's Indonesian speech voice.

The recordings are made with the macOS Indonesian voice (Damayanti):

```bash
node tools/make-audio.mjs
```

It records only the missing files (`--force` records all of them again) and rewrites `audio/index.json`, the list the service worker precaches. It needs macOS `say` and `ffmpeg`. To improve pronunciation, replace any file with your own recording using the same name.

The voice reads some written syllables with the wrong vowel: "be", "me", "he", "ze" and "we" came out as "bi", "mi" and so on, and "nye" began with an a. The e of every Ce syllable was measured and the script now fixes these by writing them differently for the voice (`SAY_AS`, for example "bé") or, for "me" and "he" where no spelling worked, by joining the consonant of "ma" / "ha" to the vowel of "te" (`SPLICE`). After the fix every Ce syllable has a mid e, clearly apart from the i of the same consonant.

After adding content, run the script, then bump `CACHE` in `sw.js` so installed copies refresh.

## Offline and install

`sw.js` precaches the page, icons and every file in `audio/index.json`, and keeps Google Fonts in a separate cache. The manifest lets the game be installed to the home screen.
