# Paheli Mini: Daily Puzzle System (v1)

*   **Author:** Arvind Lakhani
*   **Status:** Approved for build (revision 3, after the Goldfish review and the Stage 9 re-audit)
*   **Date:** 2026-10-27
*   **Review:** [consolidated review report](../reviews/consolidated_review_report.md)

--------------------------------------------------------------------------------

## Overview

Paheli Mini is a free web app with one 5x5 mini crossword a day for Indian millennials. Clues mix three types: riddles (R), desi general knowledge (GK) and nostalgia or internet culture (N). Answers are English or Hinglish words in Roman letters. Each puzzle is credited "By Arvind Lakhani".

Today the app is one page holding three sample puzzles and a switcher. This design turns it into a daily product:

*   **The app** shows today's puzzle by India date, released at 00:00 IST.
*   **A weekly batch routine** has Claude write 7 puzzles at a time and Arvind approve them in a short spreadsheet. A checker script rejects broken grids before anything is published.
*   **Player state** keeps a streak per device in a form that can sync across devices later.
*   **Umami Cloud** (free, no cookies) measures starts, solves, shares and clue reports.

v1 is scoped to its **first month**. After four weekly batches, Arvind reviews the numbers and decides what comes next.

**Hosting:**
*   Repo: [arvind13496/paheli-mini](https://github.com/arvind13496/paheli-mini), public, on GitHub Pages.
*   Live address: [arvind13496.github.io/paheli-mini](https://arvind13496.github.io/paheli-mini/).
*   **Launch:** puzzle #1 is **Thursday 29 October 2026**.

## The Problem

**For players.** We found no widely known daily mini crossword written for Indian references. The NYT Mini leans on American culture, so Indian players get the format but not the jokes. Paheli Mini uses chai, Doordarshan, Bollywood, cricket and family-WhatsApp humour.

**For Arvind.** Production is the main constraint, not code. A daily puzzle needs a steady supply of good puzzles from one person with no budget. A missed day, a wrong GK fact or a broken grid costs player trust. No manual playtesting is planned, so the system must catch structural mistakes itself. Arvind's review then only needs to judge quality.

**What the prototype lacks:**
*   It picks puzzles by switcher, not by date.
*   It uses the phone's time zone.
*   It saves progress under numbers that would clash with daily puzzles.
*   It looks clues up by answer word, which breaks when a grid uses a word twice.
*   Shares carry no link back to the game.
*   It measures solves, but not streaks, visits from shares, or clue reports.
*   It has no screen for a missing puzzle.

## Goals

*   **Daily release.**
    *   Each India date (UTC+5:30, whatever the phone's setting) shows one puzzle from 00:00 IST.
    *   Puzzle number = days since launch + 1, so it never changes once assigned.
    *   Numbers skip a day only if that day had no puzzle.
*   **Buffer.**
    *   Batches of 7. The target is 7 to 14 approved days ahead.
    *   Hard floor: an email alert goes to Arvind when fewer than 3 future days are published.
    *   The first batch (29 Oct to 4 Nov) is published before launch.
*   **No broken puzzle reaches players.** Every puzzle passes the checker rules in [Technical Plan §5](#5-weekly-batch-routine-claude-plus-arvind).
*   **Review in about 30 minutes a week.**
    *   One sheet per batch of 7, with every text shown.
    *   Each puzzle gets one status: approved, fix clue, or replace puzzle.
*   **Streaks.**
    *   The result card shows the current and best streak.
    *   Both are counted from the saved list of solved India dates.
    *   A day with no puzzle never breaks a streak.
*   **Growth loop.** Every shared result includes the puzzle number and a link back to the game, tagged so Umami can count visits from shares.
*   **Measurement.** Umami records page visits, starts, solves (time, help used, streak), shares and clue-report taps.
*   **Answers not readable in view-source or the raw file without decoding.**
    *   Puzzle files are scrambled.
    *   A determined person can still decode them (see [Accepted Risks](#accepted-risks)).
*   **Credit and contact.**
    *   The byline is read from each puzzle file.
    *   "Report a clue" opens an email to arv.experiments@gmail.com with the puzzle number and date filled in, and shows the address as copyable text.
*   **No running cost.** Uses free tiers only: GitHub Pages, GitHub Actions and Umami Cloud Hobby.

### Success at the end of month one (proposed, for Arvind to adjust)

*   **Daily players:** 25 or more on an average day in week 4.
*   **Shares:** 1 in 4 solves is shared.
*   **Quality:**
    *   Fewer than 1 clue report per puzzle on average.
    *   Reveal rate under 30%.
*   **Supply:** Every one of the 30 days had a puzzle.

Cookie-free Umami can't track individual returning players. The `streak` value sent with each solve is the stand-in for retention.

## Non-Goals

*   Leaderboards or in-app friends. Sharing to WhatsApp is the v1 substitute.
*   Accounts, sign-in or cross-device streaks. The solved-dates list keeps this possible later.
*   An archive of past puzzles. A missed day is gone.
*   Grids larger than 5x5, or a weekend special.
*   A difficulty selector or difficulty labels.
*   Hindi or other Indian scripts.
*   Editing a puzzle after it goes live. Mistakes are reported and fixed in future batches.
*   Publishing a missed day late.
*   Fully automatic generation (needs the paid Claude API), and an admin interface.
*   Monetisation or ads.

## Accepted Risks

These are known and accepted for v1 by Arvind:

1.  **Future puzzles are public.** Scrambled puzzle files sit in the public repo up to 14 days ahead, and the scrambling key is in the public code.
2.  **Clock peeking.** Moving a phone's clock forward opens a future puzzle. Cheating only spoils the cheater's own game, since there are no leaderboards.
3.  **Storage loss.** Streaks live in one browser. Clearing data, private mode, iOS clearing a site's data after 7 days without a visit, or WhatsApp's in-app browser can each reset a streak. The app says "Saved on this browser".
4.  **Byline.** Puzzles are generated with Claude and edited and approved by Arvind. The credit "By Arvind Lakhani" stays. Reviewers raised a disclosure concern, which Arvind declined for v1.
5.  **Wrong GK fact.** Every GK clue carries a source that Arvind checks. A mistake that still gets through stays live that day and is fixed by not repeating it.
6.  **Free-tier limits.**
    *   Umami Hobby allows 100,000 events a month, about 600 daily players at roughly 6 events each including the page visit, and keeps data for 6 months.
    *   GitHub Pages has a soft limit of 100 GB a month.
7.  **Service outages.** If GitHub Pages or Umami is down, the game or the stats pause. No mitigation in v1.

## Critical User Journeys (CUJs)

### CUJ 1: First-time player arrives from WhatsApp

*   **Given**: A friend shares a result with a link. The recipient has never visited.
*   **When**: They tap the link.
*   **Then**:
    *   The start screen shows "Paheli Mini #N", today's India date, the puzzle title and "By Arvind Lakhani".
    *   On solving, the result card shows:
        *   time
        *   help used
        *   streak 1
        *   "Next paheli in 7h 12m"
        *   share buttons
        *   "Report a clue"
    *   Umami records the visit as coming from WhatsApp, plus a start event and a solve event.

### CUJ 2: Returning player keeps a streak

*   **Given**: The player solved yesterday's puzzle in the same browser.
*   **When**: They open the site after 00:00 IST and solve today's puzzle.
*   **Then**: The streak shows 2, and the best streak updates if beaten.

### CUJ 3: Player reopens a puzzle they already solved

*   **Given**: The player solved today's puzzle earlier.
*   **When**: They reload the page.
*   **Then**: The result card shows their saved time and help, over the completed grid. Nothing can be typed.

### CUJ 4: Player finishes across midnight in an open tab

*   **Given**: A player starts at 23:58 IST and keeps the tab open.
*   **When**: They finish at 00:03 IST.
*   **Then**:
    *   The solve counts for the puzzle they started, and the streak counts that date.
    *   The result card offers "Play today's paheli", which loads the new puzzle.
    *   A reload always loads today's puzzle.

### CUJ 5: Player outside India

*   **Given**: A player in London at 19:00 local time, which is 00:30 IST the next day.
*   **When**: They open the site.
*   **Then**: They get the new India-date puzzle, and the masthead shows the India date.

### CUJ 6: Player reports a wrong clue

*   **Given**: A player thinks a clue is wrong.
*   **When**: They tap "Report a clue" on the result card.
*   **Then**:
    *   An email opens to arv.experiments@gmail.com with the subject "Paheli Mini #N (29 Oct 2026): clue report".
    *   The body asks which clue and what's wrong.
    *   The address is also shown with a Copy button, for phones where no email app opens.
    *   Umami records `report-clue`.

### CUJ 7: Arvind approves a weekly batch

*   **Given**: Claude has written 7 puzzles, and the checker has passed them.
*   **When**: Arvind opens the review sheet on his laptop.
*   **Then**:
    *   He sees each puzzle's grid and every clue, easier clue, "why" line, GK source and checker warning.
    *   He marks each puzzle approved, fix clue (with a note) or replace puzzle.
    *   Only approved puzzles are published.
    *   Flagged ones come back in a follow-up sheet.

### CUJ 8: The buffer runs low, or a day is missed

*   **Given**: Fewer than 3 future days are published.
*   **When**: The nightly check runs at 00:10 IST.
*   **Then**:
    *   The check fails, and GitHub emails Arvind.
    *   If a day still ends up with no puzzle, players see "Today's paheli is running late. Next one in 7h 12m" instead of a blank page.
    *   That date is never in the manifest, so nobody's streak breaks.
    *   It is never published late.

### CUJ 9: Player is offline

*   **Given**: The phone has no connection.
*   **When**: The page loads, or the puzzle fetch fails.
*   **Then**: "You're offline. Check your connection and tap Retry." This is shown instead of "running late".

## Technical Plan (Architecture)

Two halves share two small modules: the grid logic (`lib/grid.js`) and the scrambler (`lib/codec.js`). The app and the tools import the same files, so the checker validates exactly what players see.

```text
WEEKLY, on Arvind's laptop                                 DAILY, in the player's browser

Claude session writes batches/b001.json (7 puzzles)        today = India date
        |                                                   fetch manifest.json + puzzles/<today>.json (in parallel)
        v                                                   decode (lib/codec.js) -> build slots (lib/grid.js)
tools/check.mjs --fail--> back to Claude                    play; save to localStorage (lib/state.js)
        | pass                                              send events to Umami
        v                                                            ^
tools/make-sheet.mjs -> review/b001.xlsx                             |
  Arvind marks approved / fix clue / replace                  GitHub Pages serves the repo
        |                                                            ^
        v                                                            |
tools/publish.mjs (approved only) -> puzzles/<date>.json   git push -+-> check.yml (tests + checker)
                                     + manifest.json                     daily.yml 00:10 IST (buffer >= 3?)
```

### 1. Files and formats

**Batch file** `batches/<id>.json` lives only on Arvind's laptop, inside his clone of the repo, and git ignores it.

```json
{
  "batch": "b001",
  "records": [
    {
      "date": "2026-10-29",
      "title": "Chai Break",
      "constructor": "Arvind Lakhani",
      "grid": ["##PCO", "#BEAT", "TOAST", "EACH#", "ATE##"],
      "clues": {
        "1A": { "tag": "N",  "clue": "...", "easy": "...", "why": "...", "source": "" },
        "1D": { "tag": "GK", "clue": "...", "easy": "...", "why": "...", "source": "https://..." }
      },
      "warnings": [],
      "selfsolve": []
    }
  ]
}
```

*   `clues` is keyed by slot id: number plus A for Across or D for Down.
*   `source` is required for `GK` clues.
*   `warnings` and `selfsolve` are filled in by the checker and the self-solve pass.

**Published puzzle file**, `puzzles/<date>.json`:

```json
{ "schema": 1, "date": "2026-10-29", "data": "<scrambled>" }
```

*   `data` is the record with only the fields players need: `title`, `constructor`, `grid`, and `clues` with `tag`, `clue`, `easy` and `why`.
*   `source`, `warnings`, `selfsolve` and `batch` are removed before scrambling.
*   Scrambling (`x1`) works like this: JSON is converted to UTF-8 bytes, XORed with a fixed key and base64-encoded. A future change of method means bumping `schema`.

**Manifest**, `puzzles/manifest.json`:

```json
{ "launch": "2026-10-29", "dates": ["2026-10-29", "2026-10-30"] }
```

*   This is the only place the launch date is stored.
*   The app computes puzzle number = days between `launch` and the date, plus 1.
*   The manifest also decides whether today has a puzzle and which dates count for streaks.

### 2. India date, loading and failure screens

*   **India date.** `todayIST()` adds 5h30m to UTC time and reads the date. It never uses the phone's time zone.
*   **Loading.**
    *   The app fetches the manifest and today's file at the same time.
    *   The manifest URL carries `?h=<YYYYMMDDHH in IST>`, so a cached copy from yesterday isn't used after midnight.
    *   Puzzle file names are unique per date, so they can't go stale.
*   **App code caching.**
    *   Module imports carry `?v=<APP_VERSION>`, so a fresh `index.html` never pairs with old `lib/` files.
    *   `index.html` itself follows GitHub Pages' 10-minute cache.
*   **Input is ignored until the puzzle has loaded.**
*   **Screens:**

| Situation | Screen | Umami event |
|---|---|---|
| Today in manifest, file loads and decodes | Start screen | (none until start) |
| Today is before `manifest.launch` | "Paheli Mini starts Thursday, 29 October. First one in Hh Mm." | none |
| Today not in manifest (on or after launch) | "Today's paheli is running late. Next one in Hh Mm." | `puzzle-missing` |
| A `fetch()` call rejects (no connection) | "You're offline. Check your connection." + Retry | none |
| Any other failure: an HTTP error status (including 404 for a listed date), bad base64 or JSON, `PuzzleFormatError` | "Something went wrong. Refresh the page." | `puzzle-error` |

The countdown screens reload the page when they reach zero.

*   **Midnight in an open tab.**
    *   When the tab becomes visible again and the India date has changed:
        *   An unstarted puzzle reloads to today's.
        *   A started or solved puzzle shows "A new paheli is out. Play it."
    *   A started puzzle keeps going in that tab and counts for its own date.
    *   A reload always loads today's puzzle.

### 3. Player state and streaks

Three localStorage keys, each re-read before every write so two tabs can't overwrite each other:

| Key | Holds |
|---|---|
| `paheli:v1:settings` | `{ "autocheck": false }` |
| `paheli:v1:solves` | `{ "<date>": { at, sec, hints, checks, reveals, auto } }`, kept forever (about 60 bytes a day) |
| `paheli:v1:progress` | One in-progress puzzle: `{ date, hash, letters[25], elapsedMs, started, hints[], ok[], wrong[], rev[], checks, reveals, usedAuto }` |

*   `hash` is computed by the app with `gridHash(grid)`. Progress for a different grid is thrown away.
*   **Progress belongs to one date.** These rules stop a stale tab from wiping or overwriting another tab's newer puzzle:
    *   `saveProgress` writes only when the stored progress is empty, has the same date, or has an older date.
    *   `recordSolve` and `clearProgress` clear progress only when the stored `progress.date` equals the solved date.
*   **Solved puzzles.** A solve is written to `solves`, and `progress` is cleared. Reopening a solved date shows the result card and fills the grid from the answers.
*   **Streaks.**
    *   Start at today if it's solved, otherwise yesterday.
    *   Walk back through the manifest dates. Each solved date adds 1, and the first unsolved manifest date stops the count.
    *   Dates not in the manifest are skipped.
    *   Best streak is the longest such run.
    *   Reveals count toward the streak; the share card already labels them.
*   **Old prototype keys.** On first load, `paheli-1`, `paheli-2`, `paheli-3` and `paheli-last` are deleted, and `paheli-auto` moves into settings. A `paheli:v1:migrated` flag stops this running again.
*   **Storage detection.** Checked by writing and removing a test key.
    *   If storage doesn't work, the game still plays.
    *   The result card says "Streaks can't be saved in this browser".
    *   Umami gets `storage-unavailable` once per page load.

### 4. App changes

*   **Removed:**
    *   the `PUZZLES` array and `build()`
    *   `renderSwitch()`, including its call in `solve()`, the `#switch` element and `.switch` CSS
    *   the `level` field and labels in the eyebrow
    *   the `#nextPuzzle` button and its handler
    *   the `paheli-last` and "fresh puzzle" boot logic
    *   the `store` helper
    *   the prototype footer
*   **Masthead.** The dateline uses the India date: "Thursday, 29 October 2026".
*   **Start screen:**
    *   eyebrow: "Paheli Mini #N"
    *   title: the puzzle title
    *   body: "By <constructor>", replacing the old blurb
    *   button: "Shuru karo" ("let's start")
    *   On pause, the body reads "Paused at m:ss" with "Resume".
*   **Result card (the screenshot area):**
    *   time and speed tag (for example "Shatabdi pace", named after the express train)
    *   help line
    *   current and best streak
    *   "Saved on this browser"
*   **Below the card:**
    *   Copy and WhatsApp buttons
    *   "Next paheli in Hh Mm", counting down to 00:00 IST, updated every 30 seconds
    *   "Report a clue"
    *   "Why these answers"
*   **Terms used throughout:**
    *   **Easier clue:** the `easy` field, shown when the player taps "Aasaan clue" ("easy clue").
    *   **Hint:** one use of the easier clue.
    *   **Help:** hints plus checks plus reveals.
*   **Share text:**

```text
Paheli Mini #1 · Chai Break
Solved in 1:12 · Shatabdi pace
Clean solve, no help · Streak 5
https://arvind13496.github.io/paheli-mini/?utm_source=whatsapp&utm_medium=share
```

*   The Copy version uses `utm_source=copy`.
*   If storage is unavailable, " · Streak N" is left out.
*   **Counting share visits exactly once:**
    *   The Umami tag gets `data-auto-track="false"`.
    *   At boot, the app saves `location.pathname + location.search`.
    *   It calls `umami.track(p => ({ ...p, url: saved }))`, so the visit is recorded with its `utm_*` source.
    *   Only then does it remove `utm_*` from the address bar with `history.replaceState`.
    *   Reloads and the history change aren't counted twice.
*   **Report a clue.** One entry point, on the result card. It is a `mailto:` link with:
    *   subject "Paheli Mini #N (DD Mon YYYY): clue report"
    *   body "Which clue (e.g. 4 Across)?\n\nWhat's wrong?\n"
    *   both URL-encoded
*   **Analytics events**, all with `puzzle` (number) and `v` (`APP_VERSION`):
    *   `puzzle-start`
    *   `puzzle-solve`, with `seconds`, `hints`, `checks`, `reveals`, `autocheck` and `streak`
    *   `share-whatsapp` and `share-copy`
    *   `report-clue`
    *   `puzzle-missing`, `puzzle-error` and `storage-unavailable`
*   **Safety.** Text from puzzle files is inserted with `textContent` or the existing `esc()` function, never as raw HTML.
*   **Unchanged:**
    *   the newspaper look
    *   the timer and pause
    *   the easier clue
    *   check, reveal and autocheck
    *   the on-screen keyboard and the legend

### 5. Weekly batch routine (Claude plus Arvind)

1.  **Generate.** Arvind asks a Claude session for the next 7 dates.
    *   Claude follows `docs/clue-style.md`.
    *   It gets the answer list from `node tools/check.mjs --used`, so it doesn't repeat recent answers.
    *   It writes `batches/<id>.json`.
2.  **Check.** Run `node tools/check.mjs batches/<id>.json`. Failures go back to Claude.
    *   **Shape:**
        *   5 rows of 5 characters, only `A-Z` or `#`.
        *   Every white square sits in both an Across and a Down slot.
        *   Every slot is at least 3 letters.
        *   No word appears twice in the same grid.
    *   **Content:**
        *   Every slot has `tag` (R, GK or N), `clue`, `easy` and `why`.
        *   GK clues have a `source`.
        *   `title` and `constructor` are present and are strings.
    *   **Answer leaks.** No answer appears as a whole word, ignoring case, in its own clue, its easier clue or the puzzle title.
    *   **Repeats.** No answer appears within 14 days either side, across published puzzles and the whole batch.
    *   **Dates.** Dates are unique, after today, and not already published.
    *   **Warnings only (never block publishing):**
        *   An answer matches a known misspelling in `data/misspellings.txt` (for example CHAY instead of CHAI).
        *   The clue mix is lopsided: more than half of the clues share one tag.
3.  **Self-solve (optional).** A separate Claude session solves each puzzle from the clues alone. Any clue it can't get is listed in that record's `selfsolve`.
4.  **Sheet.** Run `node tools/make-sheet.mjs batches/<id>.json` to write `review/<id>.xlsx`.
    *   One row per clue: Date, #, Title, Grid (first row of each puzzle, five lines in Courier), Slot, Answer, Tag, Clue, Easier clue, Why, Source, Warnings, Self-solve.
    *   Status (a dropdown) and Notes sit on each puzzle's first row.
5.  **Review.** Arvind marks each puzzle approved, fix clue or replace puzzle, adds notes, and saves the sheet.
6.  **Fix loop.**
    *   "Fix clue" and "replace puzzle" go back to Claude with the notes.
    *   Claude edits `batches/<id>.json`, then steps 2 to 5 repeat for those puzzles only.
    *   Approval is per puzzle, so good ones are never held back.
7.  **Publish.** Run `node tools/publish.mjs batches/<id>.json review/<id>.xlsx`.
    *   It reads only Status and Notes from the sheet. Text typed into other cells is ignored; content always comes from the batch file.
    *   It refuses past dates and already-published dates.
    *   It re-runs the checker, scrambles, writes `puzzles/<date>.json`, and adds the date to the manifest.
    *   On the first run it creates the manifest, with `launch` set to the earliest published date.
    *   Gaps between dates are allowed; they become days with no puzzle.
8.  **Push.** Arvind runs `npm test` and pushes.
    *   `check.yml` runs the tests and checks every published file.
    *   It also checks that the manifest and the files match exactly.
    *   Puzzle files go live days before their date, so a failed check leaves time to fix them.
9.  **Nightly guard.** `daily.yml` runs at 00:10 IST.
    *   It fails if today's file is missing or fewer than 3 future days are published.
    *   GitHub emails the account that last changed the workflow, which is Arvind.
    *   Weekly pushes keep the repo active, well inside GitHub's 60-day limit before scheduled jobs are switched off.
    *   Capping the buffer at 14 days means the alarm fires long before that limit.

## Alternatives Considered

### Alternative A: Publish each puzzle on its day with a scheduled job

*   **Pros**:
    *   Nobody can peek ahead.
    *   The live site never holds future files.
*   **Cons**:
    *   GitHub's free scheduled jobs can start late. Delays of 10 to 30 minutes or more are commonly reported.
    *   GitHub turns schedules off after 60 days without commits.
    *   A failed run means no puzzle that day.
    *   Future files still have to be stored somewhere.
*   **Reason for Rejection**: It trades an accepted risk for a reliability risk. Publishing ahead doesn't depend on any job running at midnight. A day is missed only if the buffer runs out.

### Alternative B: Private repo on Cloudflare Pages

*   **Pros**:
    *   Future puzzles aren't browsable on GitHub.
    *   No bandwidth cap.
*   **Cons**:
    *   A second platform account.
    *   The live site still serves future files by date.
*   **Reason for Rejection**: Arvind chose a public GitHub repo for v1, and the gain is small. Revisit when a backend arrives.

### Alternative C: A server function that serves only today's puzzle

*   **Pros**:
    *   Real secrecy.
    *   One place to fix a live puzzle.
*   **Cons**:
    *   Second piece of infrastructure.
    *   Its own failure modes.
    *   An account and storage to manage.
*   **Reason for Rejection**: The infrastructure is out of proportion to a risk that only affects the cheater. It's the natural step once leaderboards make cheating matter.

### Alternative D: Keep puzzles inside index.html

*   **Pros**: Simplest option, with no fetching.
*   **Cons**:
    *   The page grows with every buffered puzzle.
    *   Every release is a code change.
    *   Answers can be read in view-source.
*   **Reason for Rejection**: It mixes content with code, and a cached page shows the wrong day.

### Alternative E: Store the streak as a counter

*   **Pros**: Less code.
*   **Cons**:
    *   A bug corrupts the count with no way to rebuild it.
    *   It can't tell a missed day from a day with no puzzle.
    *   It can't merge across devices.
*   **Reason for Rejection**: The solved-dates list costs barely more code and is what sync will need.

### Alternative F: Google Sheets for review (deferred)

*   **Pros**:
    *   Review on the phone.
    *   No file round-trip.
*   **Cons**:
    *   Needs Drive write access.
    *   The sheet can change after approval.
*   **Reason for Deferral**: The .xlsx file is a fixed copy of what was approved. Switch if the weekly round-trip feels slow.

### Alternative G: GoatCounter or Cloudflare Web Analytics

*   **Pros**: No monthly event cap.
*   **Cons**:
    *   GoatCounter events carry no details.
    *   Cloudflare's tool has no custom events.
*   **Reason for Rejection**: Solve time and streak need event details. Switching later only changes the tracking snippet and the `track()` helper.

### Alternative H: Read every review comment as a must-fix (from the review)

*   **Rejected:**
    *   an outside uptime monitor
    *   a published-file git guard with an `[emergency-edit]` rule
    *   a gated GitHub Actions deploy
    *   byte-level specs in this doc
    *   a full Playwright suite
    *   a "test every function" rule
*   **Reason for Rejection**: Each adds more moving parts than its risk justifies for a one-person project. The buffer, the checker and a manual phone checklist cover the same risks.

## Non-Functional Requirements

*   **Security & Privacy.**
    *   The scrambling key is public by design, and no other secrets exist.
    *   The app sends no player identifier. Umami receives page visits and the events listed, without cookies, though like any website it sees the IP address and browser type.
    *   A report email shows the player's own address to Arvind.
    *   Puzzle text is never inserted as HTML.
*   **Performance.**
    *   A first visit loads `index.html` (about 40 KB), four small modules, the manifest and one puzzle file (about 3 KB): under 60 KB plus fonts.
    *   Fonts load with `display=swap`, so they never block the start screen.
    *   Target: the start screen in under 2 seconds on Lighthouse's mobile preset.
*   **Rollout & Rollback.**
    *   Launch is one push containing the new app, the first batch of 7 puzzles and the manifest.
    *   Rolling back the app is a `git revert` of the app files, with the puzzle files left in place.
    *   A bad future puzzle is fixed by Arvind deleting its file and manifest entry before its date. That day becomes a no-puzzle day. Live puzzles are never edited.

## Additional Resources

*   [Concepts brief](../../concepts_brief.md): the EGM brainstorm, with six zero-context reviews.
*   [Consolidated review report](../reviews/consolidated_review_report.md) and the five stage reports.
*   Umami Cloud: website "Paheli Mini", account arv.experiments@gmail.com.

## Future Improvements

*   **Accounts and cross-device streaks:** upload `paheli:v1:solves` and merge by date.
*   **Archive:** past files already exist. An archive needs a list page, and its solves must not count toward streaks.
*   **Server-side release (Alternative C):** once leaderboards arrive.
*   **Automatic generation:** through the paid Claude API, with approval only for flagged puzzles.
*   **Google Sheets review (Alternative F).**

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Built in five phases. Each phase leaves the repo working and has an exit check. The live site keeps showing the prototype until Phase 4 is pushed.

### Phase 1: Shared modules and unit tests

#### 1. `lib/dates.js` (Create)

*   **Type / Scope**: ES module, works in the browser and in Node.
*   **Proposed Changes**:
    *   `todayIST(now = Date.now())` returns `"YYYY-MM-DD"`.
    *   `istHourStamp(now)` returns `"YYYYMMDDHH"`.
    *   `addDays(date, n)`.
    *   `numberFor(date, launch)` returns whole days between `launch` and `date`, plus 1.
    *   `msToNextMidnightIST(now)`.
    *   `formatIST(date)` returns "Thursday, 29 October 2026".
    *   `formatShort(date)` returns "29 Oct 2026".
    *   `countdownText(ms)` returns "7h 12m", or "12m" under an hour.
    *   **Test-date override.** `appNow()` returns `Date.now()`, or, only when `globalThis.location?.hostname` is `localhost` or `127.0.0.1` and the URL has `?date=YYYY-MM-DD`, 06:00 IST on that date.
    *   **The override clock keeps running.** It returns the override start plus `Date.now() - pageLoadTime`, so countdowns still move during local testing.
    *   **Where `appNow()` is used:** for the India date, the countdowns and the midnight check. The solve timer keeps using `Date.now()`. Tools and tests pass `now` explicitly.

#### 2. `lib/grid.js` (Create)

*   **Type / Scope**: ES module, browser and Node.
*   **Proposed Changes**:
    *   `buildPuzzle(grid, clues)` returns `{ cells, slots, cellSlots }`. It carries over the prototype's `build()` numbering and Across-first sort.
        *   `cells[i]`: `{ block, answer, num }`.
        *   `slots[]`: `{ id: "1A", dir: "A", num, cells[], answer, tag, clue, easy, why }`.
        *   `cellSlots[i]`: `{ A: slot, D: slot }`. This replaces the prototype's `cellEnt`.
    *   `validateShape(grid)` returns `errors[]`.
    *   `gridHash(grid)` returns an FNV-1a 32-bit hash of `grid.join("")`, as 8 lowercase hex characters.

#### 3. `lib/codec.js` (Create)

*   **Type / Scope**: ES module, browser and Node.
*   **Proposed Changes**:
    *   `encode(obj)` and `decode(str)` use the `x1` method.
        *   The key `"paheli-mini-x1"` is UTF-8 encoded, then cycled.
        *   Standard base64 with padding.
        *   In the browser: `btoa` / `atob` over a byte string, plus `TextEncoder` / `TextDecoder`. In Node: `Buffer`.
    *   `readPuzzleFile(file)` checks `schema === 1` and throws `Error` with `name = "PuzzleFormatError"` otherwise, then returns the decoded record.

#### 4. `lib/state.js` (Create)

*   **Type / Scope**: ES module.
*   **Proposed Changes**: `createState(storage = globalThis.localStorage)` returns the functions below. Passing `storage` in lets tests supply a stand-in.
    *   `available`: true if writing and removing a test key works.
    *   `migrateLegacy()`: runs once, guarded by the `paheli:v1:migrated` flag.
    *   `getSettings()` / `setSettings(patch)`.
    *   `getProgress(date, hash)`: returns null if the date or hash differs.
    *   `saveProgress(record)`.
    *   `clearProgress()`.
    *   `getSolve(date)`.
    *   `recordSolve(date, stats)`: re-reads solves, merges by date, writes, then clears progress.
    *   `streaks(manifestDates, today)` returns `{ current, best }`, following the Technical Plan §3 rules. Manifest dates are already sorted strings, so no date arithmetic is needed.
    *   The progress ownership rules from Technical Plan §3 apply to `saveProgress`, `recordSolve` and `clearProgress`.
    *   **No cross-imports.** No module in `lib/` imports another. This keeps cache-busting to the imports in `index.html`.

#### 5. `tests/fixtures/samples.json` (Create)

*   **Type / Scope**: Test data.
*   **Proposed Changes**: The three prototype puzzles converted to the new record format (clues keyed by slot id), plus expected slot ids and numbers. They are fixtures only, never published.
    *   The conversion adds `constructor: "Arvind Lakhani"`.
    *   It adds a reference URL as `source` for each GK clue (RAO, IDIOT, ONION, SRI, HILL, ANIL).
    *   Dates are set 20 days apart (2026-01-01, 2026-01-21 and 2026-02-10), so SRI in samples 2 and 3 doesn't trigger the repeat rule.
    *   Sample 1 keeps its title "Spill the Tea" as the **known title-leak fixture** (TEA is an answer). Samples 2 and 3 are the **clean fixtures**.

#### 6. `tests/dates.test.mjs`, `grid.test.mjs`, `codec.test.mjs`, `state.test.mjs` (Create)

*   **Type / Scope**: `node:test` unit tests.
*   **Proposed Changes**:
    *   **dates:**
        *   `todayIST(Date.UTC(2026,9,28,18,29,59))` returns `"2026-10-28"`.
        *   `todayIST(Date.UTC(2026,9,28,18,30,0))` returns `"2026-10-29"`.
        *   `numberFor("2026-10-29","2026-10-29")` returns `1`.
        *   `numberFor("2026-11-04","2026-10-29")` returns `7`.
        *   `msToNextMidnightIST(Date.UTC(2026,9,28,18,0,0))` returns `1800000`.
        *   `formatIST("2026-10-29")` returns `"Thursday, 29 October 2026"`.
        *   `countdownText(43320000)` returns `"12h 2m"`, and `countdownText(720000)` returns `"12m"`.
    *   **grid:**
        *   The three sample puzzles produce the slot ids and numbers listed in the fixtures.
        *   `validateShape` returns errors for each of these:
            *   a 4-letter row
            *   a lowercase letter
            *   a 2-letter slot
            *   a white square in only one direction
        *   `gridHash` is stable, and different for a changed grid.
    *   **codec:**
        *   Round-trip a sample record that contains "ā", "₹" and an emoji.
        *   A file with `schema: 2` throws `PuzzleFormatError`.
    *   **state** (with an in-memory storage stand-in):
        *   Streak walks:
            *   a no-puzzle day doesn't break the streak
            *   a missed manifest day does break it
            *   if today is unsolved, the streak counts from yesterday
            *   best streak over a 2-1-3 pattern is 3
        *   Migration moves `paheli-auto` into settings and runs only once.
        *   A progress hash mismatch returns null.
        *   `recordSolve` from a stale tab keeps the other tab's solve.
        *   A storage stand-in that throws on write gives `available === false`.
        *   Progress ownership:
            *   `saveProgress` for an older date doesn't overwrite a newer date's progress.
            *   `recordSolve` for yesterday doesn't clear today's progress.
        *   `getSettings` and `setSettings` round-trip correctly.
        *   `getSolve` returns the recorded entry.
    *   **dates extras:**
        *   `istHourStamp(Date.UTC(2026,9,28,18,30,0))` returns `"2026102900"`.
        *   `addDays("2026-10-31", 1)` returns `"2026-11-01"`.
        *   `formatShort("2026-10-29")` returns `"29 Oct 2026"`.

*   **Phase 1 exit check:** `npm test` passes.

### Phase 2: Tools, data and style guide

#### 7. `tools/check.mjs` (Create)

*   **Type / Scope**: Node CLI, using built-ins only.
*   **Exports** (used by the tests):
    *   `checkBatch(records, published, today)`
    *   `checkPublished(dir, { today, buffer })`
*   **Proposed Changes**: The CLI passes `todayIST()` as `today`. Tests pass a fixed date, so results never depend on the real clock.
    *   **Batch mode:** `node tools/check.mjs batches/<id>.json`.
        *   Records whose date is already in the manifest are skipped, with "already published, skipped".
        *   The rest get every rule in Technical Plan §5 step 2.
        *   Repeats are checked against published puzzles and the other records in the batch.
        *   Dates must be after `today` and not yet published.
        *   Warnings are written into each record's `warnings` field.
    *   **Published mode:** `node tools/check.mjs puzzles/`.
        *   Decodes every `<date>.json`.
        *   Runs the shape, content and answer-leak rules on each file.
        *   Runs the repeat rule between files with different dates only.
        *   Does not run date rules.
        *   Also checks:
            *   The manifest and the files match exactly.
            *   `launch` equals the earliest manifest date.
            *   The date inside each file matches its file name.
    *   **`--buffer 3`** (published mode): fails if fewer than 3 dates after `today` are listed, or if `today` is missing. Before `launch`, only the count after `today` is checked.
    *   **`--used`**: prints answers within 14 days either side of `today`, from published files.
    *   **Exit codes:** 1 on any error, 0 if only warnings.

#### 8. `tools/make-sheet.mjs` (Create)

*   **Type / Scope**: Node CLI, using `exceljs`.
*   **Proposed Changes**: Writes `review/<id>.xlsx` with the column layout from Technical Plan §5 step 4.
    *   **Already-published records are skipped**, so a follow-up sheet contains only the puzzles still in the fix loop.
    *   **Overwriting is safe.** The sheet file is overwritten each run; approved puzzles are already published by then.
    *   Status is a dropdown with three values.
    *   The header row is frozen and long text wraps.

#### 9. `tools/publish.mjs` (Create)

*   **Type / Scope**: Node CLI, using `exceljs`.
*   **Proposed Changes**: Follows the rules in Technical Plan §5 step 7.
    *   It matches sheet rows to records by Date.
    *   It skips records whose dates are already in the manifest, with a note rather than an error.
    *   It removes the production-only fields, encodes, writes the files and updates the manifest.
    *   It prints which dates were published, skipped (not approved) or refused.
    *   It never commits or pushes.

#### 10. `tests/check.test.mjs` (Create)

*   **Type / Scope**: `node:test`.
*   **Proposed Changes**: `checkBatch` (with `today = "2025-12-01"`) fails on each of these:
    *   an answer in its own clue ("TEA" in "Spill the tea", ignoring case)
    *   an answer in the title
    *   the same word twice in one grid
    *   a repeat 10 days apart
    *   a missing `easy` field
    *   a GK clue with no source
    *   a 2-letter slot

    It also checks:
    *   the substring "ATE" inside "later" passes, because matching is whole-word only
    *   samples 2 and 3 pass
    *   sample 1 fails only on its title
    *   `checkPublished` on a temporary folder:
        *   fails when the manifest and files don't match
        *   passes with matching files dated in the past
        *   with `buffer: 3`, fails when only 2 future dates exist

#### 11. `data/misspellings.txt` (Create)

*   **Type / Scope**: Word list.
*   **Proposed Changes**: Lines of `WRONG=RIGHT` (for example `CHAY=CHAI`, `ACHA=ACCHA`, `MAGI=MAGGI`). A match produces a warning, not an error.

#### 12. `docs/clue-style.md` (Create)

*   **Type / Scope**: House style guide, read at every generation.
*   **Proposed Changes**:
    *   The audience: Indian millennials, with Gen Z welcome.
    *   About 4 R, 3 GK and 3 N clues per 10-clue puzzle, keeping those proportions for other counts.
    *   Tone examples from the samples.
    *   Rules for easier clues and "why" lines.
    *   Whole-word answer leaks are banned.
    *   Every GK clue needs a source.
    *   Avoid party politics, religion and caste.
    *   Titles never contain an answer.
    *   Use the `--used` list.
    *   Spellings follow `data/misspellings.txt`.

#### 13. `package.json`, `package-lock.json` and `.gitignore` (Create)

*   **Type / Scope**: Config.
*   **Proposed Changes**:
    *   `package.json`:
        *   `"type": "module"`
        *   dev dependency `exceljs`
        *   scripts:
            *   `"test": "node --test tests/*.test.mjs"`
        *   `"engines": { "node": ">=22" }`
            *   `"check": "node tools/check.mjs puzzles/"`
            *   `"sheet": "node tools/make-sheet.mjs"`
            *   `"publish": "node tools/publish.mjs"`
    *   `package-lock.json`: generated by `npm install` and committed.
    *   `.gitignore`: `node_modules/`, `batches/`, `review/`.

*   **Phase 2 exit check:** `npm test` passes. Running `check.mjs` and `make-sheet.mjs` on the converted samples produces a readable sheet.

### Phase 3: First batch (29 Oct to 4 Nov)

#### 14. `puzzles/manifest.json` and `puzzles/2026-10-29.json` … `2026-11-04.json` (Create, generated)

*   **Type / Scope**: Published content.
*   **Proposed Changes**: Claude writes `batches/b001.json` with 7 puzzles, which go through check, sheet, Arvind's review and publish. All 7 must be approved before Phase 4 is pushed.

*   **Phase 3 exit check:** `npm run check` passes with 7 dates, and `launch` is `2026-10-29`.

### Phase 4: App switch-over

#### 15. `index.html` (Modify)

*   **Type / Scope**: App shell.
*   **Proposed Changes**:
    *   Change the inline `<script>` to `<script type="module">`.
        *   Import the four `lib/` modules with **literal** specifiers, such as `"./lib/grid.js?v=1.0.0"`, since import paths can't be built from a variable.
        *   Add the constant `APP_VERSION = "1.0.0"`. Each release changes the constant and the four import strings together. The README states this.
        *   Rename the local `load` to `loadPuzzle` and `save` to `persist`, to avoid clashing with imports.
        *   Add `data-auto-track="false"` to the Umami tag (see Technical Plan §4).
    *   **Removals:** everything in Technical Plan §4 "Removed".
    *   **Renames:**
        *   slot fields `t/c/e/w` become `tag/clue/easy/why`
        *   the slot's `ans` and the cell's `cells[i].ans` both become `answer`
        *   `cellEnt` becomes `cellSlots`
        *   hint keys use slot ids ("1A") instead of "A1"
        *   `S.elapsed` becomes `S.elapsedMs`
        *   `AUTO` reads and writes `getSettings().autocheck` and `setSettings()` in place of `store`
        *   `renderSwitch()` calls are removed from both `load()` and `solve()`
    *   **Solved state:**
        *   `S.solved` is derived as `getSolve(P.date) !== null`. It is never stored in progress.
        *   For a reopened solved puzzle, the result card and the help line read the solve entry: `sec`, `hints` (a count), `checks`, `reveals` and `auto`.
        *   `helpLine()` and `tagFor()` take a stats object `{ sec, hints, checks, reveals, auto }`. `solve()` builds that object from `S`.
    *   **Boot:**
        1.  Set `ready = false`. Grid, keyboard and help-menu input do nothing while `ready` is false. Result-card buttons (Copy, WhatsApp, Report, Back) are never blocked.
        2.  Run `migrateLegacy()`.
        3.  Remove `utm_*` from the address bar.
        4.  Compute `today`.
        5.  Fetch the manifest and the puzzle together.
        6.  Pick a screen from the table in Technical Plan §2.
        7.  If today is already solved, show the result card over the filled grid.
        8.  Otherwise restore progress if the hash matches, show the start screen, and set `ready = true`.
    *   **Running late and offline screens.** Use the existing veil card with new text. The offline variant has a Retry button that re-runs the boot. The "running late" countdown reloads the page when it reaches zero.
    *   **Midnight.** Add a `!document.hidden` branch to the existing `visibilitychange` handler, as specified in Technical Plan §2.
        *   When the India date has changed and the puzzle is unstarted, call `location.reload()`.
        *   When it is started or solved, show the toast "A new paheli is out" with a **Play** button that calls `location.reload()`.
    *   **CUJ 4 (finishing across midnight).** In `solve()`, and when a solved puzzle is reopened, check whether `P.date !== todayIST(appNow())`. If so:
        *   Hide the "Next paheli in" countdown.
        *   Show a **Play today's paheli** button (id `playToday`) that calls `location.reload()`.
        *   `recordSolve` always uses `P.date`, never today.
    *   **New element ids:** `streakLine`, `storageNote`, `countdown`, `playToday`, `reportClue`, `reportAddress`, `copyAddress`, `newPuzzleToast`.
    *   **Masthead and screens.** Masthead uses `formatIST(today)`. The start screen, result card, share text, report link and analytics events follow Technical Plan §4.
        *   `track()` adds `puzzle` and `v` to every event.
        *   `puzzle-solve` adds `streak`.
    *   **Text insertion.** Every text from puzzle files goes in through `textContent` or `esc()`.

*   **Phase 4 exit check:** Serve locally with `python3 -m http.server`, open `/?date=2026-10-29`, then work through the manual checklist (item 18).

### Phase 5: CI, docs and launch

#### 16. `.github/workflows/check.yml` (Create)

*   **Type / Scope**: GitHub Actions, triggered on `push` to `main`.
*   **Proposed Changes**:
    *   `actions/checkout@v4`
    *   `actions/setup-node@v4` with Node 22
    *   `node --test tests/*.test.mjs`
    *   `node tools/check.mjs puzzles/`
    *   No `npm install` is needed, because tests and the checker use built-ins only.

#### 17. `.github/workflows/daily.yml` (Create)

*   **Type / Scope**: GitHub Actions. Runs on `schedule: "40 18 * * *"` (00:10 IST), and can also be run by hand (`workflow_dispatch`).
*   **Proposed Changes**:
    *   `actions/checkout@v4`
    *   `actions/setup-node@v4` with Node 22
    *   `node tools/check.mjs puzzles/ --buffer 3`

#### 18. `tests/manual-checklist.md` (Create)

*   **Type / Scope**: Manual test script, run on a phone (390px wide) and on desktop.
*   **Proposed Changes**: Checks for each of these:
    *   CUJs 1-9
    *   a reload after solving
    *   two tabs open at once
    *   a blocked-storage (private) window
    *   autocheck, reveal and check
    *   that WhatsApp and Copy share text include the link
    *   that the report email opens with the right subject
    *   that events appear in Umami's Realtime view within 10 minutes of a live solve
    *   opening `?utm_source=whatsapp&utm_medium=share` on the live site gives exactly one visit in Umami, with source "whatsapp"
    *   the pre-launch screen on 28 October

#### 19. `README.md` (Modify)

*   **Type / Scope**: Docs.
*   **Proposed Changes**:
    *   Point to this design doc.
    *   Document the weekly routine: generate, check, sheet, review, publish, test, push.
    *   Document the local test command and where Umami lives.
    *   Remove the "prototype" wording.

*   **Phase 5 exit check:** `check.yml` passes on GitHub, and a manual run of `daily.yml` passes. GitHub Pages is switched on, and the live URL opens puzzle #1 at 00:00 IST on 29 Oct.

### Verification Plan

*   **Build**: No build step. Run `node --check` on every `.js` and `.mjs` file.
*   **Unit Tests**: `npm test`. Every case in items 6 and 10 passes.
*   **Content**: `npm run check` passes for all published dates.
*   **Coverage**: Every case listed in items 6 and 10 passes. `appNow()` and the UI are covered by the manual checklist rather than automated tests.
*   **Node**: version 22 or later, both locally and in CI.
*   **Live check after launch**:
    *   Solve on a phone.
    *   Confirm `puzzle-start`, `puzzle-solve` and `share-whatsapp` appear in Umami within 10 minutes.
    *   Confirm the next morning's `daily.yml` run passes.
