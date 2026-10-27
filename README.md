# Paheli Mini

A daily desi mini crossword: a 5x5 grid of riddles, desi GK and millennial nostalgia. A new puzzle every day at midnight IST. By Arvind Lakhani.

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
4. **Review.** Set Status to *approved*, *fix clue* or *replace puzzle*, and add notes.
5. **Publish.** Run `node tools/publish.mjs batches/<id>.json review/<id>.xlsx`. Only approved puzzles are published, and their content comes from the batch file.
6. **Test and push.** Run `npm test`, then commit `puzzles/` and push.

`batches/` and `review/` contain readable answers and are git-ignored. Keep them on your laptop.

## Releasing app changes

When `index.html` or `lib/` changes, bump `APP_VERSION` and all four `?v=` import strings in `index.html` together.

## Local testing

Run `python3 -m http.server`, then open `http://localhost:8000/?date=2026-10-29`. The `?date=` override only works on localhost. Work through [tests/manual-checklist.md](tests/manual-checklist.md).

## Automation

* `check.yml`: runs the tests and the published-puzzle check on every push.
* `daily.yml`: runs at 00:10 IST. It fails, and GitHub emails you, if today's puzzle is missing or fewer than 3 future days are published.
