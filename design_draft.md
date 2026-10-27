# Paheli Mini: Daily Puzzle System (v1)

*   **Author:** Arvind Lakhani
*   **Status:** Proposed
*   **Date:** 2026-10-27

--------------------------------------------------------------------------------

## Overview

Paheli Mini is a free web app with one 5x5 mini crossword a day for Indian millennials. Clues mix riddles, desi general knowledge, and nostalgia and internet culture. Answers are English or Hinglish words in Roman letters. Each puzzle carries the byline "By Arvind Lakhani".

Today the app is a single page holding three hardcoded sample puzzles and a switcher between them. This design turns it into a daily product, made of four parts:

*   **The app** picks today's puzzle by India date and releases a new one at 00:00 IST.
*   **A batch pipeline** has Claude write puzzles 30 at a time. Arvind approves them in one spreadsheet, and a checker script rejects broken grids before anything is published.
*   **Player state** keeps a streak per device and stays compatible with cross-device sync later.
*   **Free analytics** (Umami Cloud) measures whether the game is working.

Hosting is GitHub Pages on the public repo `arvind13496/paheli-mini`, served at `arvind13496.github.io/paheli-mini`.

## The Problem

**For players.** There is no Indian take on the daily mini crossword. The NYT Mini's clues lean on American culture: baseball, US TV, American slang. An Indian millennial gets the format but not the references. A puzzle built on chai, Doordarshan, Bollywood, cricket and WhatsApp-family-group humour fills that gap, and a two-minute daily habit is something people share.

**For Arvind.** A daily puzzle is a promise to show up 365 times a year. The real constraint isn't code, it's producing good puzzles every day as one person with no budget and limited time. A missed day, a wrong GK fact or a broken grid costs player trust more than any missing feature. Arvind won't playtest puzzles, so the system has to catch structural mistakes itself and keep his review to judging quality.

**What exists today falls short.** The prototype:

*   picks puzzles by a manual switcher, not by date
*   uses the phone's time zone instead of India time
*   saves progress under puzzle numbers that would clash with daily puzzles
*   looks clues up by the answer word, so a grid with a repeated word breaks
*   shares results without a link back to the game
*   has no way to measure players
*   shows a blank screen if a puzzle is missing

**Proposed solution in one line.** A date-driven static app reads one scrambled file per India date. The files are produced by a Claude-plus-checker batch pipeline and approved by Arvind in a spreadsheet, with streaks derived from a list of solved dates, and Umami events measuring what matters.

## Goals

*   **Daily release.** Each India date (UTC+5:30, whatever the phone's setting) shows exactly one puzzle, from 00:00:00 IST. Puzzle number = days since launch day + 1, so it never changes once assigned.
*   **Buffer.** At least 30 approved future puzzles at all times. 60 are approved before launch. An automatic email warning goes to Arvind when fewer than 14 remain.
*   **No broken puzzle reaches players.** Every published puzzle passes the automatic checker: grid shape, every slot has a clue, an easier clue and a "why" line, no answer inside its own clue, and no answer repeated within 30 days.
*   **Quick review.** One spreadsheet per batch with three statuses per puzzle: approved, fix clue, or replace puzzle. Approving a 30-puzzle batch should take Arvind under an hour.
*   **Streaks.** Shown on the result card as current and best streak. They are computed from the saved list of solved India dates, so they can be checked and later synced. A day with no published puzzle never breaks a streak.
*   **Growth loop.** Every shared result includes the puzzle number and a link back to the game, tagged so that visits from shares can be counted.
*   **Measurement.** Umami records the following for every puzzle, so success can be judged at 3 months:
    *   puzzle starts
    *   solves, with time, help used and streak
    *   WhatsApp and copy shares
    *   report-clue taps
*   **Answers not readable in one or two clicks.** Each puzzle file is scrambled. A determined person reading the code or the public repo can still decode it; that risk is accepted.
*   **Credit and contact.** The byline "By Arvind Lakhani" is read from each puzzle file. A "Report a clue" option opens an email to arv.experiments@gmail.com, with the puzzle number, date and clue already filled in, and also shows the address as text to copy.
*   **Zero running cost.** Everything uses free tiers: GitHub Pages, GitHub Actions and Umami Cloud Hobby.

## Non-Goals

*   Leaderboards, friends, or comparing scores in the app (WhatsApp sharing covers this).
*   Accounts, sign-in, or cross-device streaks. The solved-dates list keeps this possible later.
*   An archive of past puzzles. A missed day is gone.
*   Grids larger than 5x5, or a weekend special.
*   A difficulty selector or difficulty labels. One default difficulty only.
*   Hindi or other Indian scripts.
*   Editing a puzzle after it goes live.
*   Keeping future puzzles secret. The public repo exposes them, and that's accepted for v1.
*   Fully automatic generation without Arvind's approval. This needs the paid Claude API and comes later.
*   An admin interface. The spreadsheet, scripts and git are the tools.
*   Monetisation or ads.

## Open Questions

*   **Launch date.** Which India date is puzzle #1? It anchors all numbering and must be fixed before the first batch is written.
*   **Do reveals count toward a streak?** The brief proposed yes, since the share card already marks revealed solves "with a little madad". Arvind hasn't confirmed.
*   **Easier-clue button.** Keep the "Aasaan clue" hint in v1 as is? It adds a third text per answer to every review.
*   **Midnight rollover.** If a tab is left open across midnight, does it switch to the new puzzle when the player returns, or keep yesterday's until reload? Proposed: switch, unless a solve is in progress.

## Critical User Journeys (CUJs)

### CUJ 1: First-time player arrives from WhatsApp

*   **Given**: A friend shares a result in a WhatsApp group with a link. The recipient has never visited.
*   **When**: They tap the link.
*   **Then**:
    *   The start screen shows the puzzle number, today's India date and "By Arvind Lakhani".
    *   Tapping "Shuru karo" starts the timer.
    *   On solving, the result card shows the time, help used, streak 1, a "Next paheli in 7h 12m" countdown, and share buttons.
    *   Umami records the visit as coming from a share, plus a start and a solve event.

### CUJ 2: Returning player keeps a streak

*   **Given**: A player solved yesterday's puzzle on the same browser.
*   **When**: They open the site after 00:00 IST.
*   **Then**: Today's puzzle loads. After solving, the streak shows 2, and the best streak updates if it's beaten.

### CUJ 3: Player finishes across midnight

*   **Given**: A player starts a puzzle at 23:58 IST.
*   **When**: They finish at 00:03 IST.
*   **Then**: The solve counts for the puzzle they started (the earlier date), and the streak counts that date.

### CUJ 4: Player abroad, or with a wrong phone clock

*   **Given**: A player in London at 19:00 local time, which is 00:30 IST the next day.
*   **When**: They open the site.
*   **Then**: They get the new India-date puzzle. The date shown is the India date.

### CUJ 5: Player reports a wrong clue

*   **Given**: A player thinks a GK clue is factually wrong.
*   **When**: They tap "Report a clue" on the result card.
*   **Then**:
    *   An email opens to arv.experiments@gmail.com with the puzzle number, date, clue number and clue text filled in.
    *   The address is also shown as text to copy, in case no email app opens.
    *   Umami records a report-clue event for that puzzle.

### CUJ 6: Arvind approves a batch

*   **Given**: Claude has produced a batch of 30 puzzles, and the checker has passed them.
*   **When**: Arvind opens the review sheet.
*   **Then**:
    *   Each row shows the date, a picture of the grid, the answers, clues, easier clues, "why" lines and any checker warnings.
    *   He marks each row approved, fix clue (with a note) or replace puzzle.
    *   Only approved rows are converted into scrambled files and published.
    *   Flagged rows go back to Claude and return in the next sheet.

### CUJ 7: The buffer runs low, or a day is missing

*   **Given**: Approved puzzles cover fewer than 14 future days.
*   **When**: The daily GitHub check runs.
*   **Then**:
    *   The check fails and GitHub emails Arvind.
    *   If a day still ends up with no file, players see "Today's paheli is running late" with the next release time instead of a blank page.
    *   Nobody's streak breaks for that day.

## Technical Plan (Architecture)

The system has two halves that share one small piece of code:

*   **Production side.** Runs in a Claude session and on Arvind's machine or GitHub, never in the player's browser.
*   **Play side.** The static site players open.

The shared piece is the grid logic. It reads a 5x5 grid, works out every Across and Down slot, and numbers them. The app and the checker use the same file, so the checker validates exactly what players will see.

```text
PRODUCTION (monthly)                                   PLAY (daily)

Claude session                                         Player's browser
  writes 30 plaintext puzzles                            computes India date
        |                                                fetches puzzles/manifest.json
        v                                                fetches puzzles/<date>.json
tools/check.mjs  --fail--> back to Claude                unscrambles with lib/codec.js
        | pass                                           builds slots with lib/grid.js
        v                                                plays, saves to localStorage
review sheet (.xlsx)                                     sends events to Umami
  Arvind: approved / fix clue / replace                        ^
        |                                                      |
        v                                                GitHub Pages serves
tools/publish.mjs                                         index.html, lib/, puzzles/
  approved rows only -> scramble -> puzzles/<date>.json        ^
  update puzzles/manifest.json                                 |
        |                                                      |
        +---- git push to main ----> GitHub Actions: check.yml -+
                                     (blocks bad files)
                                     daily.yml at 00:10 IST
                                     (today's file present? buffer >= 14?)
                                     -> fails -> GitHub emails Arvind
```

### 1. Puzzle content and file format

**Plaintext puzzle (exists only during production, never committed).** One record per India date:

```text
{
  schema: 1,
  date: "2026-11-15",            // India date, the puzzle's identity
  constructor: "Arvind Lakhani",
  title: "Spill the Tea",        // shown on the start screen; never names an answer
  grid: ["##PCO", "#BEAT", "TOAST", "EACH#", "ATE##"],   // '#' = black square
  clues: {
    "1A": { tag: "N",  clue: "...", easy: "...", why: "..." },
    "4A": { ... }, "1D": { ... }, ...                       // keyed by slot, not by answer
  },
  batch: "b001",                 // which generation batch produced it
  source_note: "..."             // optional; for GK clues, where the fact comes from
}
```

**Published puzzle file**, at `puzzles/2026-11-15.json`:

```text
{ "schema": 1, "date": "2026-11-15", "enc": "x1", "hash": "<8 hex chars>", "data": "<scrambled text>" }
```

*   `data` holds the whole plaintext record (grid, clues, easier clues, "why" lines and title), scrambled with method `x1`: UTF-8 bytes, XOR with a fixed key string, then base64. This stops a reader in one or two clicks but doesn't stop a determined one, as agreed.
*   `enc` names the method, so a future method can be added without breaking old files.
*   `hash` is a short fingerprint of the grid. Saved progress records it, and if a grid ever changed, the app would discard progress for the old grid instead of putting letters in the wrong squares.

**Readable source stays out of the repo.** It lives only in the review sheet and the Claude session. The repo holds scrambled files only. A determined person can still decode them, but nobody can read next month's answers on github.com at a glance. This costs nothing, so it's included even though Arvind accepted a readable repo.

**Manifest**, at `puzzles/manifest.json`, lists only dates and contains no answers:

```text
{ "launch": "2026-11-15", "dates": ["2026-11-15", "2026-11-16", ...] }
```

The puzzle number is never stored in a file. It is always calculated as days since `launch` + 1, so the two can never disagree. The app uses the manifest for three things:

*   puzzle numbers
*   whether today's file should exist
*   working out streaks across any day with no puzzle

### 2. India date and release

*   `todayIST()` = current UTC time + 5h30m, read as a calendar date. It never uses the phone's time zone, and India has no daylight saving.
*   The app requests `puzzles/<todayIST>.json`. Each file name is unique to its date, so a stale cache can't serve yesterday's puzzle under today's name. GitHub Pages caches for 10 minutes. `index.html` and `manifest.json` are fetched with a cache-busting query (the current India date and hour), so a new day is picked up right at midnight.
*   **Changing the phone clock forward** can open a future puzzle early, because the files are already published. This is accepted under the "determined people can peek" decision.
*   **Midnight while the tab is open** (proposed answer to the open question): when the player returns to the tab, the app recalculates the date. If it changed and no solve is in progress, it loads the new puzzle. If a solve is in progress, that puzzle stays until it's finished, and the solve counts for its own date (CUJ 3).
*   **Missing file:** the app shows "Today's paheli is running late" with a countdown to the next midnight. It never crashes or shows a blank screen.

### 3. Player state and streaks

*   **One localStorage key:** `paheli:v1`.

```text
{
  settings: { autocheck: false },
  solves:   { "2026-11-15": { at: <timestamp>, sec: 72, hints: 1, checks: 0, reveals: 0, auto: false } },
  progress: { "2026-11-16": { hash, letters[25], elapsed, started, hints[], ok[], wrong[], rev[], checks, reveals } }
}
```

*   `solves` is kept forever. It's tiny: about 60 bytes a day, roughly 22 KB a year.
*   `progress` is dropped once a puzzle is solved or more than 2 days old.
*   **Streak calculation.** The app starts from today, or from yesterday if today isn't solved yet, and walks back through the manifest's dates. Each date with a solve adds 1. The first manifest date without a solve ends the streak. Dates not in the manifest (days with no puzzle) are skipped, so they never break a streak. The best streak is the longest run found the same way. No counter is stored, so nothing can drift.
*   **Reveals** count toward the streak (proposed default, pending Arvind's answer). The share card already labels revealed solves.
*   **Old prototype keys:** on first load, `paheli-1`, `paheli-2`, `paheli-3` and `paheli-last` are deleted. `paheli-auto` moves into `settings.autocheck`.
*   **Storage not available** (private mode, blocked): the game still plays. The result card says "Streaks can't be saved in this browser" instead of showing 0.
*   **A small note** under the streak, "Saved on this browser", sets expectations for the WhatsApp in-app browser case.

### 4. App changes (the play side)

**Removed:**

*   the `PUZZLES` array
*   the puzzle switcher
*   the `level` labels
*   the "Next puzzle" button
*   `paheli-last`
*   the prototype footer

**Start screen:**

*   "Paheli Mini #12 · Sunday, 15 November"
*   the puzzle title
*   "By Arvind Lakhani", from the file's `constructor`
*   the "Shuru karo" button

**Result card:**

*   time and speed tag
*   help used
*   current and best streak
*   "Next paheli in 7h 12m", counting down to 00:00 IST
*   Copy and WhatsApp buttons
*   "Report a clue"
*   the "Why these answers" list below the card, out of the screenshot area

**Share text:**

```text
Paheli Mini #12 · Spill the Tea
Solved in 1:12 · Shatabdi pace
Clean solve, no help · Streak 5
https://arvind13496.github.io/paheli-mini/?s=wa
```

The `?s=wa` tag lets Umami count visits from shares. The copied version uses `?s=copy`.

**Report a clue.** Report links are available on the result card and from each clue in the clue list. Each one is a `mailto:` link to arv.experiments@gmail.com with:

*   subject "Paheli #12 (2026-11-15) 4 Across"
*   the clue text in the body

The address is also shown as text with a Copy button, because `mailto:` often does nothing on Android.

**Analytics** through Umami, which is already installed. Every event carries `puzzle` (the number) and `v` (app version):

*   `puzzle-start`
*   `puzzle-solve`: `seconds`, `hints`, `checks`, `reveals`, `autocheck`, `streak`
*   `share-whatsapp`, `share-copy`
*   `report-clue`: `slot`
*   `puzzle-missing`: when today's file isn't found
*   `storage-unavailable`

**Code layout.** There is still no build step. `index.html` loads two small ES modules:

*   `lib/grid.js`: slots, numbering and the grid hash
*   `lib/codec.js`: scrambling and unscrambling

Node scripts in `tools/` import the same two files.

### 5. Production pipeline (Claude plus Arvind, monthly)

1.  **Generate.** In a Claude session, Arvind asks for the next 30 dates. Claude writes them in sub-runs of 10, given the answers used in the last 60 days so it avoids repeats. Claude follows a house style guide (`docs/clue-style.md`) covering:
    *   the clue mix: riddles, desi GK, nostalgia and internet culture
    *   the millennial focus
    *   Hinglish spellings from a house list
    *   topics to avoid: party politics, religion, caste
    *   GK clues must include a `source_note`
2.  **Check.** `tools/check.mjs` runs on the batch, and failures go straight back to Claude. It checks:
    *   shape: 5x5, only A to Z and `#`
    *   every white square is in both an Across and a Down slot
    *   slots are at least 3 letters
    *   every slot has a clue, an easier clue and a "why" line
    *   no answer appears in its own clue, easier clue or the title
    *   no answer was used in the previous 30 days
    *   Hinglish answers are on the house spelling list
    *   flagged topic words produce warnings, not failures
3.  **Self-solve pass (cheap substitute for playtesting).** A separate Claude session that hasn't seen the answers tries each puzzle from the clues alone. Entries it can't get are flagged in the sheet as "may be too hard or unclear".
4.  **Review sheet.** `tools/make-sheet` produces `review/batch-<id>.xlsx`, one row per puzzle, with:
    *   date and number
    *   the grid drawn as five monospace lines
    *   each slot's answer, clue, easier clue and "why"
    *   checker warnings
    *   self-solve flags
    *   a Status column: approved / fix clue / replace puzzle
    *   a Notes column

    Arvind fills in Status and Notes and sends the file back.
5.  **Fix loop.** "Fix clue" rows go back to Claude with the note, which rewrites only the named clue. "Replace puzzle" rows get a new grid for that date. Both return in a small follow-up sheet. Approval is per puzzle, so one bad puzzle never holds up 29 good ones.
6.  **Publish.** `tools/publish.mjs` reads the returned sheet and takes approved rows only. For each, it rebuilds the plaintext record, runs the checker again, scrambles it, writes `puzzles/<date>.json` and adds the date to `manifest.json`. The result is pushed to `main`.
7.  **Guards in GitHub Actions** (free, public repo):
    *   `check.yml` runs on every push. It unscrambles every file and runs the checker. It also fails if any already-published file (date on or before today) was changed or deleted, which enforces "never edit a live puzzle".
    *   `daily.yml` runs at 00:10 IST (18:40 UTC). It fails if today's file is missing or fewer than 14 future dates are published. GitHub emails Arvind on failure.
    *   GitHub turns off scheduled workflows after 60 days with no commits. Monthly batches keep the repo active. If a gap is planned, Arvind is reminded to push an empty commit.

## Alternatives Considered

### Alternative A: Publish each puzzle on its day with a scheduled job

A GitHub Action commits only that day's file at 00:00 IST, so future puzzles never appear on the site early.

*   **Pros**:
    *   Nobody can play ahead by changing their phone clock.
    *   The live site never holds future files.
*   **Cons**:
    *   GitHub's free scheduled jobs often start 10 to 30 or more minutes late, so "midnight" becomes "sometime after midnight".
    *   GitHub turns off schedules in public repos after 60 days with no commits.
    *   If the job fails, there is no puzzle at all that day.
    *   Future files still have to be stored somewhere. Storing them in the same public repo removes the benefit, and a private repo adds a second repo plus an access token to manage.
*   **Reason for Rejection**: It trades a leak Arvind already accepted for a reliability risk he didn't. The "everything published ahead" plan can't miss a midnight.

### Alternative B: A private repo on Cloudflare Pages

Source and future puzzles stay private, and Cloudflare builds and serves the site for free.

*   **Pros**:
    *   Future puzzles aren't browsable anywhere.
    *   There's no bandwidth cap.
*   **Cons**:
    *   It means a second platform account, with deploy settings to learn.
    *   The repo connected to this session would need to be private.
    *   The live site still serves future files by date, so clock-changers can still peek.
*   **Reason for Rejection**: Arvind chose a public GitHub repo for v1. The gain is small, because future files are fetchable from the live site in either case. Keeping readable source out of the repo gets most of the benefit for free. It stays a sensible move once there's a backend.

### Alternative C: A free serverless function that serves today's puzzle only

A Cloudflare Worker checks the India time on the server, so a phone clock can't unlock tomorrow.

*   **Pros**:
    *   Real secrecy for future puzzles.
    *   One place to fix a live puzzle later.
*   **Cons**:
    *   It's a second piece of infrastructure with its own deploys, logs and failure modes.
    *   It requires a Cloudflare account and storage for the puzzles.
    *   If it breaks, every player gets nothing.
*   **Reason for Rejection**: Over-built for a side project in which cheating only spoils the cheater's own game. It's the natural next step when accounts and leaderboards arrive, because leaderboards make cheating matter.

### Alternative D: Keep all puzzles inside index.html, as the prototype does

*   **Pros**: Simplest possible: one file and no fetching.
*   **Cons**:
    *   Every player downloads the whole buffer.
    *   Each daily release becomes a code change.
    *   A cached old page shows the wrong day.
    *   Answers are readable in view-source.
*   **Reason for Rejection**: It doesn't scale past a handful of puzzles, and it mixes content and code, which the "never edit a live puzzle" guard depends on keeping separate.

### Alternative E: Store the streak as a counter

Save `streak: 7` and `best: 12`, and add one on each solve.

*   **Pros**: Fewer lines of code.
*   **Cons**:
    *   A single bug or a missed day corrupts the count permanently, and nothing can rebuild it.
    *   It can't merge across devices later.
    *   It can't tell a missed day from a day with no puzzle.
*   **Reason for Rejection**: A list of solved dates is barely more code, can always be recounted, and is exactly what cross-device sync will need to upload.

### Alternative F: Review in Google Sheets instead of an .xlsx file

*   **Pros**:
    *   Arvind can review on his phone.
    *   No files are passed back and forth.
    *   A Google Drive connection is available in Claude sessions.
*   **Cons**:
    *   Claude would need write access to his Drive.
    *   A shared sheet can be edited after approval without anyone noticing.
    *   The grid drawing is harder to control.
*   **Reason for Rejection**: Not rejected outright. It's a reasonable switch if the .xlsx round-trip feels slow. v1 starts with a file, because the checker and publish script then always read a fixed copy of what was approved.

### Alternative G: GoatCounter or Cloudflare Web Analytics instead of Umami

*   **Pros**:
    *   Neither has a monthly event cap.
    *   Cloudflare's tool needs no script setup if the site moves there.
*   **Cons**:
    *   GoatCounter events carry no details, such as solve time or streak.
    *   Cloudflare Web Analytics has no custom events at all.
*   **Reason for Rejection**: The success metrics need solve details. Umami's free plan allows 100K events a month, enough for about 600 daily players, which is above the expected early audience. Switching later means changing about 10 lines.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Security & Privacy**:
    *   **No secrets anywhere.** The scrambling key is public by design.
    *   **Player data stays on the device.** Nothing personal leaves it. Umami is cookie-free and receives only page visits and the events listed, none of which identify the player.
    *   **Report emails** come from the player's own email app, and the game stores nothing about them.
    *   **No Umami login or token in the repo.** The tracking script needs only the public website ID.
*   **Performance**:
    *   A first visit loads `index.html` (about 40 KB), two small modules, the manifest and one puzzle file (about 3 KB). That's under 60 KB in total, plus the Google Fonts.
    *   No framework and no build step.
    *   The app must show the start screen within 2 seconds on a mid-range Android phone on 4G.
*   **Free-tier limits**:
    *   **GitHub Pages:** a soft limit of 100 GB a month. At about 60 KB a visit, that's over 1.5 million visits.
    *   **GitHub Actions:** unlimited minutes for public repos.
    *   **Umami Hobby:** 100K events a month, or about 600 daily players at 5 events each. The trigger to act is Umami's usage reaching 80%.
*   **Rollout & Rollback**:
    *   **Launch.** The prototype is replaced in one push. On first load, old prototype storage keys are removed, and `paheli-auto` is carried over into the new settings.
    *   **Rolling back** the app is a `git revert` of the app files. Puzzle files are never edited, so they're unaffected.
    *   **Storage changes only add.** A future storage version would add `paheli:v2` and leave `paheli:v1` in place for one release, so a rollback never meets data it can't read.
    *   **A broken live puzzle (emergency only).** The `check.yml` guard is bypassed with a commit message containing `[emergency-edit]`. That changes the grid's fingerprint, so players' saved progress for that day is discarded rather than corrupted.

--------------------------------------------------------------------------------

### Additional Resources

*   `concepts_brief.md`: EGM brainstorm brief with the six zero-context reviews
*   Umami Cloud website "Paheli Mini", account arv.experiments@gmail.com
*   Repo: `github.com/arvind13496/paheli-mini`

### Future Improvements

*   **Accounts and cross-device streaks**: upload the `solves` list and merge it by date. The format already supports this.
*   **Archive**: past puzzle files already exist. An archive needs a list page and a rule that archive solves don't count toward streaks.
*   **Server-side release** (Alternative C): add it when leaderboards make cheating matter.
*   **Automatic generation** through the paid Claude API, with Arvind approving by exception rather than row by row.
*   **Google Sheets review** (Alternative F), if the .xlsx round-trip feels slow.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Defaults are applied below for the four open questions. Anything Arvind changes before review only alters the line named.

*   **Launch date:** a constant `LAUNCH_DATE` in `lib/dates.js` and the `launch` field in the manifest.
*   **Reveals count toward the streak:** yes.
*   **Easier-clue button:** kept.
*   **Midnight:** the app switches to the new puzzle on return to the tab, unless a solve is in progress.

### Target Files to Create/Modify

#### 1. `lib/dates.js` (Create)

*   **Type / Scope**: Browser and Node ES module
*   **Proposed Changes**:
    *   `LAUNCH_DATE = "YYYY-MM-DD"`
    *   `todayIST(now = Date.now()) -> "YYYY-MM-DD"`: adds 330 minutes to UTC and reads the UTC date parts.
    *   `numberFor(date) -> int`: whole days between `LAUNCH_DATE` and `date`, plus 1.
    *   `msToNextMidnightIST(now) -> int`
    *   `formatIST(date) -> "Sunday, 15 November"`
    *   A test-only override: if the page URL has `?date=` and the host is `localhost` or `127.0.0.1`, use that date. It is ignored on the live site.

#### 2. `lib/grid.js` (Create)

*   **Type / Scope**: Browser and Node ES module, the shared grid logic
*   **Proposed Changes**: `buildSlots(grid: string[5]) -> { cells[25], slots[] }`. It carries over the prototype's `build()` numbering exactly, with these changes:
    *   Each slot has `id` ("1A"), `dir`, `num`, `cells[]` and `answer`.
    *   Clues are attached by `id`, not by answer.
    *   `gridHash(grid) -> 8 hex chars` (FNV-1a of the joined rows).
    *   `validateShape(grid) -> errors[]`: 5 rows of 5, only `A-Z#`, every white cell in both an Across and a Down slot, and every slot at least 3 letters.

#### 3. `lib/codec.js` (Create)

*   **Type / Scope**: Browser and Node ES module
*   **Proposed Changes**:
    *   `KEY = "paheli-mini-x1"`
    *   `encode(obj) -> string`: JSON, then UTF-8 bytes, XOR with the cycled KEY, then base64.
    *   `decode(str, enc) -> obj`: supports `enc === "x1"` and throws `UnknownEncoding` otherwise. The app catches that error and shows the "refresh the page" message.

#### 4. `lib/state.js` (Create)

*   **Type / Scope**: Browser ES module
*   **Proposed Changes**:
    *   `load()`: reads `paheli:v1`, runs `migrateLegacy()` once, and returns `{settings, solves, progress, available}`. `available` is false when storage throws.
    *   `migrateLegacy()`: deletes `paheli-1..3` and `paheli-last`, and moves `paheli-auto` into `settings.autocheck`.
    *   `saveProgress(date, hash, data)` and `getProgress(date, hash)`: returns null when the hash doesn't match.
    *   `recordSolve(date, stats)`: also deletes `progress[date]`, and prunes progress entries older than 2 days.
    *   `streaks(solves, manifestDates, today) -> {current, best}`: implements the backward walk from the Technical Plan section 3. Only dates up to today are considered.

#### 5. `index.html` (Modify)

*   **Type / Scope**: App shell
*   **Proposed Changes**:
    *   **Remove:**
        *   the `PUZZLES` array and `build()` (replaced by `lib/grid.js`)
        *   `renderSwitch()` and the `#switch` element
        *   the `level` fields and labels
        *   the "Next puzzle" button
        *   the `paheli-last` logic
        *   the prototype footer
        *   the `store` helper (replaced by `lib/state.js`)
    *   **Boot sequence:**
        1.  Compute `today` with `todayIST()`.
        2.  Fetch `puzzles/manifest.json?d=<today><hour>`.
        3.  If `today` is not in the manifest or the fetch fails, show the "running late" screen with a countdown and send `puzzle-missing`.
        4.  Otherwise fetch `puzzles/<today>.json`, `decode`, `buildSlots`, and restore any progress whose hash matches.
    *   **Start screen:** "Paheli Mini #N · <formatIST>", the title, "By <constructor>", and "Shuru karo".
    *   **Result card:**
        *   current and best streak, plus a "Saved on this browser" note, or "Streaks can't be saved in this browser" when storage is unavailable
        *   the countdown "Next paheli in Hh Mm", updated every 30 seconds
        *   Copy and WhatsApp buttons, using the share text from the Technical Plan with `?s=wa` or `?s=copy`
        *   a "Report a clue" button that opens a small picker of the 10 slots, followed by the `mailto:` link, the address as text and a Copy button
        *   the "Why these answers" list below the card
    *   **Clue list:** each clue gets a small "Report" link (same `mailto:` format).
    *   **Midnight handling:** in the existing `visibilitychange` handler, recompute `today`. If it differs from the loaded date and the puzzle is unstarted or solved, reload the puzzle.
    *   **Analytics:** keep `track()`. Add `v` (the app version constant `APP_VERSION = "1.0.0"`) and `puzzle` (the number) to every event. Add `streak` to `puzzle-solve`, plus the new events `report-clue`, `puzzle-missing` and `storage-unavailable`.
    *   **Stays as is:** the visual design, the newspaper styling, the Umami script and the check, reveal and autocheck features.

#### 6. `puzzles/manifest.json` and `puzzles/<date>.json` (Create, generated)

*   **Type / Scope**: Published content, written only by `tools/publish.mjs`
*   **Proposed Changes**: The formats are those in Technical Plan section 1. Launch publishes 60 files, from launch day to launch day + 59.

#### 7. `tools/check.mjs` (Create)

*   **Type / Scope**: Node CLI, imports `lib/grid.js` and `lib/codec.js`
*   **Proposed Changes**:
    *   `node tools/check.mjs <file.json | dir>` reads either plaintext batch files or published scrambled files.
    *   It runs every check in Technical Plan section 5, step 2, reading `data/hinglish.txt` and `data/sensitive.txt`.
    *   It also checks:
        *   the title doesn't contain an answer
        *   `constructor` is present
        *   `date` is unique and matches the file name
        *   manifest dates match the files present
    *   Errors exit with code 1. Warnings print but exit with 0.
    *   `--published-guard <base-ref>` fails if any `puzzles/<date>.json` with a date on or before today changed or was deleted since `<base-ref>`, unless the head commit message contains `[emergency-edit]`.
    *   `--buffer 14` fails if fewer than 14 dates after today are in the manifest, and fails if today is missing.
    *   `--used 60` prints the answers from the last 60 published days, for pasting into the next Claude generation request.

#### 8. `tools/make-sheet.mjs` (Create)

*   **Type / Scope**: Node CLI, uses `exceljs`
*   **Proposed Changes**:
    *   `node tools/make-sheet.mjs batch.json --out review/batch-b002.xlsx`
    *   It writes one row per puzzle with these columns: Date, #, Title, Grid (five lines in Courier), then for each slot "1A: ANSWER", clue, easy and why (wrapped text), Checker warnings, Self-solve flags, Status (dropdown: approved / fix clue / replace puzzle) and Notes.
    *   The header row is frozen. The `review/` folder is in `.gitignore` because it holds readable answers.

#### 9. `tools/publish.mjs` (Create)

*   **Type / Scope**: Node CLI
*   **Proposed Changes**:
    *   `node tools/publish.mjs review/batch-b002.xlsx batch.json`
    *   It joins the sheet's Status column to the plaintext batch by date and takes only `approved` rows.
    *   It refuses any date on or before today.
    *   It runs the checker on each approved record.
    *   It writes `{schema, date, enc:"x1", hash, data}` and merges the date into `manifest.json`, keeping it sorted.
    *   It prints a summary of published, skipped and failed dates.
    *   It never commits. Arvind or a Claude session reviews the diff and pushes.

#### 10. `data/hinglish.txt` and `data/sensitive.txt` (Create)

*   **Type / Scope**: Word lists for the checker
*   **Proposed Changes**:
    *   **`hinglish.txt`:** one house spelling per line, for example CHAI, ACCHA, YAAR, JUGAAD and MAGGI. Any answer not in a standard English word list must appear here.
    *   **`sensitive.txt`:** words that trigger a review warning, such as party names, religious terms and caste terms. A match is a warning, not a failure.

#### 11. `docs/clue-style.md` (Create)

*   **Type / Scope**: House style guide that Claude reads for every generation request
*   **Proposed Changes**:
    *   the audience (Indian millennials)
    *   the clue mix: about 4 riddles, 3 desi GK and 3 nostalgia or internet clues per puzzle
    *   tone examples taken from the three sample puzzles
    *   the easier-clue and "why" rules
    *   no answer in its own clue
    *   GK clues need a `source_note`
    *   avoid party politics, religion and caste
    *   use the house Hinglish spellings
    *   avoid answers in the `--used 60` list
    *   titles must not name an answer

#### 12. `docs/designs/daily-puzzle-system.md` (Create)

*   **Type / Scope**: Final design doc (this document)

#### 13. `.github/workflows/check.yml` (Create)

*   **Type / Scope**: GitHub Actions, on push and pull_request to `main`
*   **Proposed Changes**: set up Node 20, `npm ci`, `node --test`, `node tools/check.mjs puzzles/`, and `node tools/check.mjs --published-guard ${{ github.event.before }}`.

#### 14. `.github/workflows/daily.yml` (Create)

*   **Type / Scope**: GitHub Actions, `schedule: cron "40 18 * * *"` (00:10 IST) plus a manual trigger
*   **Proposed Changes**: `node tools/check.mjs --buffer 14`. A failure triggers GitHub's standard failure email to the repo owner.

#### 15. `package.json` and `.gitignore` (Create)

*   **Type / Scope**: Tooling config
*   **Proposed Changes**:
    *   `package.json`:
        *   `"type": "module"`
        *   dev dependency `exceljs`
        *   scripts: `test`, `check`, `sheet`, `publish`
    *   `.gitignore`: `node_modules/`, `review/` and `batches/`, so readable answers are never committed.

#### 16. `tests/*.test.mjs` (Create)

*   **Type / Scope**: Unit tests using Node's built-in `node:test`
*   **Proposed Changes**:
    *   `dates.test.mjs`:
        *   `todayIST` at 18:29:59 UTC returns the same India day, and at 18:30:00 UTC returns the next day
        *   `numberFor` gives 1 on launch day
        *   `msToNextMidnightIST` is correct
    *   `grid.test.mjs`:
        *   numbering matches the three sample puzzles
        *   a grid with the same word twice gets two separate slot ids
        *   bad shapes are rejected
    *   `codec.test.mjs`:
        *   encoding then decoding returns the original, including Hindi words in Roman script and special characters
        *   an unknown `enc` throws
    *   `state.test.mjs`:
        *   streaks across a day with no puzzle stay unbroken
        *   a missed published day breaks the streak
        *   today not yet solved still shows yesterday's streak
        *   best streak is correct
        *   legacy keys are migrated
        *   a hash mismatch discards progress
    *   `check.test.mjs`: fixture batches that should fail (answer in its clue, duplicate within 30 days, missing easy clue, short slot) each fail, and a clean batch passes.

#### 17. `tests/e2e.mjs` (Create)

*   **Type / Scope**: Playwright script run locally (not in CI)
*   **Proposed Changes**:
    *   Serve the repo on localhost with a fixture manifest and puzzles.
    *   Open `?date=<fixture-day-1>`, solve it, and check the result card shows streak 1, the countdown and share text containing the link.
    *   Open `?date=<fixture-day-2>`, solve it, and check streak 2.
    *   Open a date with no file and check the "running late" screen appears with no console errors.
    *   Run everything at 390x844 (phone size).

#### 18. `README.md` (Modify)

*   **Type / Scope**: Docs
*   **Proposed Changes**: Document the monthly routine: generate, check, make the sheet, review, publish and push. Document the `[emergency-edit]` rule and where Umami lives. Remove "prototype" wording at launch.

### Verification Plan

*   **Compilation/Build**: No build step. `node --check` on every `.mjs` and `.js` file.
*   **Unit Tests**: `npm test` (`node --test`). All cases in item 16 pass.
*   **Static Analysis**:
    *   `node tools/check.mjs puzzles/` passes on the 60 launch puzzles.
    *   The published guard is tested by editing a past file on a branch, which must fail.
*   **Test Coverage Requirement**: Every function in `lib/dates.js`, `lib/grid.js`, `lib/codec.js` and `lib/state.js` has at least one passing test. The streak logic covers all of the cases listed in item 16.
*   **E2E/Integration**:
    *   `node tests/e2e.mjs` passes at phone size.
    *   After deploy, open the live URL on a phone, solve, and confirm `puzzle-start`, `puzzle-solve` and `share-whatsapp` appear in Umami's Events view within a few minutes.
    *   Trigger `daily.yml` manually once and confirm it passes.
*   **Success metrics to read at 3 months (Umami)**:
    *   daily unique visitors
    *   solves per visitor
    *   median solve time
    *   share taps per solve
    *   visits tagged `s=wa`
    *   distribution of the `streak` value
    *   reveal rate and report-clue count per puzzle, as the quality signal

--------------------------------------------------------------------------------

*Drafted with EGM*
