# cendekia
A collection of simple, friendly learning apps for kids. The name cendekia means “scholar” or “learned person” in Indonesian.

The apps are static pages with no build step, served with GitHub Pages at https://megawan.github.io/cendekia/.

## Apps

| Folder | App |
| --- | --- |
| [`hijaiyah/`](hijaiyah) | Learn the 28 hijaiyah letters, their harakat and sounds. Moved here from `megawan.github.io/games/hijaiyah/`. |
| [`baca/`](baca) | Ayo Membaca: early reading in Indonesian, from letters and syllables to words, sentences and short stories with questions, in four levels, with stars and stickers. |
| [`phonics/`](phonics) | Phonics Fun: English letter sounds, blending, spelling and first sentences, with the same adventure map and rewards. |
| [`kosakata/`](kosakata) | Kosakata: English vocabulary for Indonesian speakers, in 24 themes (including body parts, organs and street furniture), with sound in both languages and the same stars, stickers and streaks. |

Each app keeps its own README with details.

## Running locally

Any static file server works, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Contributing

Every change goes through its own branch and pull request.

- Branch names use the change type as a prefix: `feat/…`, `fix/…`, `docs/…`, `refactor/…`, `chore/…`.
- PR titles follow Conventional Commits, for example `feat(hijaiyah): add a new quiz`. The `PR Title` workflow checks this.
- Fill in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

These rules match [gha-shared-workflows](https://github.com/megawan/gha-shared-workflows), which also provides the HTML, link and PR title checks.
