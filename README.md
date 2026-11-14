# Paheli Mini

A daily desi mini crossword: a 5x5 grid of riddles, desi GK and millennial nostalgia. A new puzzle every day at midnight IST. By Arvind Lakhani.

The app also supports two bigger daily levels, Midi (7x7) and Complex (9x9, with some cryptic clues). A batch record with `"level": "midi"` or `"complex"` is published to `puzzles/<level>/` and listed in the manifest under `levels`; a level shows in the app from its first date. See `docs/STATUS.md` ("Feed").

Live: https://arvind13496.github.io/paheli-mini/

* Design: [docs/designs/daily-puzzle-system.md](docs/designs/daily-puzzle-system.md)
* Reviews: [docs/reviews/](docs/reviews/)
* Clue style guide: [docs/clue-style.md](docs/clue-style.md)
* Report a clue: arv.experiments@gmail.com
* Analytics: Umami Cloud, website "Paheli Mini" (account arv.experiments@gmail.com)

## Requirements

Node 22 or later. Run `npm install` once (it installs `exceljs` for the review sheet).

## Weekly routine (7 puzzles)

1. **Generate.** Ask Claude for the next 7 dates, following `docs/clue-style.md`. Give it the output of `node tools/check.mjs --used`. It writes `batches/<id>.json`.
2. **Check.** Run `node tools/check.mjs batches/<id>.json`. Errors go back to Claude.
3. **Sheet.** Run `node tools/make-sheet.mjs batches/<id>.json`. This writes `review/<id>.xlsx`.
4. **Play-test (optional).** Run `node tools/preview.mjs batches/<id>.json` and open `review/<id>-preview.html` in a browser. Every puzzle in the batch is playable. Nothing is saved, and nothing is sent to analytics.

To let friends play every published puzzle, past and upcoming, run `node tools/preview.mjs puzzles/`. It writes `review/all-preview.html` with all of them unlocked. It contains readable answers, so share it only with testers.
5. **Review.** Set Status to *approved*, *fix clue* or *replace puzzle*, and add notes.
6. **Publish.** Run `node tools/publish.mjs batches/<id>.json review/<id>.xlsx`. Only approved puzzles are published, and their content comes from the batch file. Without a review sheet (checks and a blind test-solve instead), run `node tools/publish.mjs batches/<id>.json --checked`: every record that passes the checker is published.
7. **Test and push.** Run `npm test`, then commit `puzzles/` and push.

`batches/` and `review/` contain readable answers and are git-ignored. Keep them on your laptop.

## Releasing app changes

When `index.html` or `lib/` changes, bump `APP_VERSION` and all four `?v=` import strings in `index.html` together.

## Local testing

Run `python3 -m http.server`, then open `http://localhost:8000/?date=2026-10-29`. The `?date=` override only works on localhost. Work through [tests/manual-checklist.md](tests/manual-checklist.md).

## Automation

* `check.yml`: runs the tests and the published-puzzle check on every push.
* `daily.yml`: runs at 00:10 IST. It fails, and GitHub emails you, if today's puzzle is missing or fewer than 3 future days are published. This is checked for each live level on its own.
