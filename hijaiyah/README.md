# Hijaiyah

A small game for children to learn the 28 hijaiyah letters and their harakat.

## Modes

- Learn letters: tap a letter to see it and hear its name.
- Learn harakat: the Fathah, Kasrah and Dammah tabs show and play each letter with its vowel.
- Guess the sound, Guess the name, Guess the harakat: ten-question quizzes.
- Look-alikes: groups of letters that differ only by dots, with a short practice for each group.
- Letter shapes: shows each letter alone and at the beginning, middle and end of a word, with a quiz. Letters that do not join to the next one (alif, dal, dzal, ra, zai, wau) only show two shapes. Shapes are drawn with a zero-width joiner, so they depend on the font's joining rules.
- Trace letters: draw over each of the 28 letters with a finger or mouse. Every separate part of the letter has to be touched, so the dots cannot be skipped. Scoring, stars and the shared code are described in [Aksara's README](../aksara/README.md#tracing) and live in `shared/trace.js`. The best stars for each letter are kept per child under `hijaiyah.trace.v1.<child>`, and only a better result adds stars. The letter is drawn from the Amiri font, so it is the isolated form; stroke order is not checked.
- More harakat: the second stage, with four lessons. Pick a lesson and a letter and tap each of the three forms to hear it. "Practise" is a ten-question round (hear it and pick the Arabic, or read it and pick the name) that records progress per letter and form, so weak ones come up more often.

  | Lesson | Forms | Example (ba) |
  | --- | --- | --- |
  | Tanwin | the vowel plus an n: fathatan, kasratan, dammatan | بً بٍ بٌ: ban, bin, bun |
  | Long vowels | vowel plus alif, ya or wau | بَا بِي بُو: baa, bii, buu |
  | Sukun | a closed syllable after a hamza-alif | أَبْ إِبْ أُبْ: ab, ib, ub |
  | Tasydid | a doubled letter | أَبَّ إِبِّ أُبُّ: abba, ibbi, ubbu |

  Sukun and tasydid leave out alif, since it has no consonant to close or double. Every form, its reading and its sound file are defined once in `more.js`, which the page, the service worker and the recording script all load.
- Match pairs: flip cards to match each letter with its name (easy, medium, hard).
- Read syllables: pick two letters and a vowel for each, then hear the two sounds together. The practice quiz asks you to read a written pair or pick the pair you heard. It reuses the existing letter and harakat recordings, so no new audio is needed.
- My stickers: 12 stickers unlock as the total star count grows (thresholds in the `STICKERS` constant). Stars are kept even when progress is reset.
- Progress map: shows how well each letter is known. Weak letters appear more often in quizzes.

## Sound

Recordings live in `audio/` (112 small mp3 files for the letters and the three short vowels, and 330 more for the second stage), generated with the macOS Arabic voice (Majed).

| File name pattern | Content |
| --- | --- |
| `NN-name.mp3`, for example `02-ba.mp3` | letter name, generated from the fully vowelled Arabic name (for example بَاءْ). Lam uses لَمْ so it is read as "lam" |
| `NN-fathah.mp3` | letter with fathah (ba) |
| `NN-kasrah.mp3` | letter with kasrah (bi) |
| `NN-dammah.mp3` | letter with dammah (bu) |

NN is the letter number from 01 to 28 (01 alif, 02 ba, 03 ta, and so on). To improve pronunciation, replace any file with your own recording using the same name.

The second stage has 330 more files, `NN-<tanwin|mad|sukun|tasydid>-<a|i|u>.mp3`, made with the same voice by `node tools/make-audio.mjs` (it records only the missing files; `--force` records all again; it needs macOS `say` and `ffmpeg`). They were not listened to by someone who reads Arabic: replace any of them with a teacher's recording of the same name.

If a file is missing, the game falls back to the device's Arabic speech voice.

## Look-alike groups

Groups are defined by the `GROUPS` and `DOTS` constants in `index.html`.

## Offline and install

The game works offline after the first visit. `sw.js` precaches the page, icons and all audio, and keeps fonts from Google Fonts in a separate cache. The page also has a web app manifest, so it can be installed to the home screen.

When files in the precache list change, bump the `CACHE` name in `sw.js` so existing installs refresh them.
