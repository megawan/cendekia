# Hijaiyah

A small game for children to learn the 28 hijaiyah letters and their harakat.

## Modes

- Learn letters: tap a letter to see it and hear its name.
- Learn harakat: the Fathah, Kasrah and Dammah tabs show and play each letter with its vowel.
- Guess the sound, Guess the name, Guess the harakat: ten-question quizzes.
- Look-alikes: groups of letters that differ only by dots, with a short practice for each group.
- Letter shapes: shows each letter alone and at the beginning, middle and end of a word, with a quiz. Letters that do not join to the next one (alif, dal, dzal, ra, zai, wau) only show two shapes. Shapes are drawn with a zero-width joiner, so they depend on the font's joining rules.
- Match pairs: flip cards to match each letter with its name (easy, medium, hard).
- Read syllables: pick two letters and a vowel for each, then hear the two sounds together. The practice quiz asks you to read a written pair or pick the pair you heard. It reuses the existing letter and harakat recordings, so no new audio is needed.
- My stickers: 12 stickers unlock as the total star count grows (thresholds in the `STICKERS` constant). Stars are kept even when progress is reset.
- Progress map: shows how well each letter is known. Weak letters appear more often in quizzes.

## Sound

Recordings live in `audio/` (112 small mp3 files), generated with the macOS Arabic voice (Majed).

| File name pattern | Content |
| --- | --- |
| `NN-name.mp3`, for example `02-ba.mp3` | letter name, generated from the fully vowelled Arabic name (for example بَاءْ). Lam uses لَمْ so it is read as "lam" |
| `NN-fathah.mp3` | letter with fathah (ba) |
| `NN-kasrah.mp3` | letter with kasrah (bi) |
| `NN-dammah.mp3` | letter with dammah (bu) |

NN is the letter number from 01 to 28 (01 alif, 02 ba, 03 ta, and so on). To improve pronunciation, replace any file with your own recording using the same name.

If a file is missing, the game falls back to the device's Arabic speech voice.

## Look-alike groups

Groups are defined by the `GROUPS` and `DOTS` constants in `index.html`.

## Offline and install

The game works offline after the first visit. `sw.js` precaches the page, icons and all audio, and keeps fonts from Google Fonts in a separate cache. The page also has a web app manifest, so it can be installed to the home screen.

When files in the precache list change, bump the `CACHE` name in `sw.js` so existing installs refresh them.
