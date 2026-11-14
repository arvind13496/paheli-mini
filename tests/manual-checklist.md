# Manual checklist

Run on a phone (390 px wide) and on desktop. For local checks, run `python3 -m http.server` in the repo, then open `http://localhost:8000/?date=YYYY-MM-DD`.

## Every release
- [ ] The day before launch (`?date=2026-10-28`) shows "Paheli Mini starts Thursday, 29 October" with a countdown.
- [ ] Today's puzzle shows "Paheli Mini #N", the title, "By Arvind Lakhani" and "Shuru karo".
- [ ] The masthead shows the India date.
- [ ] Solving shows the result card with:
  - [ ] time, speed tag and help line
  - [ ] Streak N · Best N
  - [ ] "Saved on this browser"
  - [ ] the "Next paheli in" countdown
- [ ] Reloading after solving shows the result card again, with the grid filled in.
- [ ] Solving the next day's date shows streak 2.
- [ ] Reloading mid-solve offers Resume, with the time kept.
- [ ] A date that isn't published shows "running late". Typing on that screen does nothing and logs no console errors.
- [ ] In offline mode (devtools), Retry appears.
- [ ] Autocheck, check, reveal and clear all work. A revealed square shows the red corner.
- [ ] On a clue with an easier version, an "Aasaan clue" button sits at the top right of the clue bar. Tapping it swaps in the easier clue (marked "Aasaan clue" in red, in the bar and the clue list), hides the button for that clue, and the result card counts it as "1 easy clue". On the 12 Nov 2026 puzzle (no easier clues) the button never shows.
- [ ] On a phone (iOS Safari, Android Chrome, and WhatsApp's in-app browser): the on-screen keyboard sits under the clue bar, the phone's own keyboard never opens, and the grid stays full size. Keys flash marigold, quick double letters (WOOD) both register, Next moves to the next clue and Delete works (also on an empty square).
- [ ] A private window shows "Streaks can't be saved in this browser", and the share text has no streak.
- [ ] With two tabs open, solving in one tab doesn't erase the other's solve.

### Archive and stamp card (v1.7.0)
- [ ] The calendar icon in the header opens the Archive (`#archive`) before and after today's solve. A running timer pauses; Back returns to the puzzle with Resume, or to the result card if today is solved.
- [ ] The Archive shows one stamp card per month (newest first), then every past published day newest first: "No. N · Sat 31 Oct", the title, and a state (Unplayed, In progress, Solved on the day, Solved in archive · time). Today and future dates are not listed.
- [ ] Stamps: a day solved on the day is a full marigold stamp of its black-square pattern; a day solved in the archive is lighter with a dashed edge; a missed day is blank with no text; today is outlined; future and no-puzzle days are flat and can't be tapped.
- [ ] Tapping a stamp opens that day's result, a blank past day opens archive play, and today opens the daily game.
- [ ] Archive play (`?play=2026-10-31`) shows "#3 · Sat 31 Oct · Archive" under the masthead and "Archive · Sat 31 Oct" on the start card.
- [ ] Solving an archive day: the result card has no streak line, the sub-line ends "· Archive", the buttons are "Next unplayed day" and "Play today's paheli", and the share text reads "Paheli Mini #3 · <title> (archive)", has no streak and ends with `utm_campaign=archive`.
- [ ] After an archive solve, today's streak is unchanged, and the day shows "Solved in archive" in the list and a dashed stamp.
- [ ] Start today's puzzle, type a letter, open an archive day and type in it, then go back to today: today's letters and time are still there (and the archive day's letters are still there when reopened).
- [ ] A day solved on the day, opened from the archive, shows its old result with "Solved on the day" and "Play again". Play again starts an empty grid; solving it saves nothing (the old time stays).
- [ ] `?play=` with today's or a future date, or an unpublished date, opens today's puzzle and drops `play` from the address bar.
- [ ] After winning today, this month's stamp card shows under the streak line, with an "Archive" link.
- [ ] With a puzzle file blocked in devtools, its archive row shows "Couldn't load" with Retry; offline, unloaded rows grey out with "Needs a connection".
- [ ] Live: Umami shows `archive-open` (days, unsolved), and `puzzle-start` / `puzzle-solve` carry `mode` (`daily` or `archive`); archive solves send `streak` as null.

### Levels: Mini, Midi, Mega (v1.9.0)
To try levels locally before any are published, add a `levels` entry to `puzzles/manifest.json` and files under `puzzles/midi/` and `puzzles/mega/` (the records in `tests/fixtures/levels.json` work), and don't commit them.
- [ ] With no level in the manifest, the site behaves as before: no landing, no archive tabs, and `?level=midi` falls back to today's Mini.
- [ ] With a level live, the plain link opens the landing "Aaj ki paheli": one row per live level with its size and today's status (New, In progress, Solved · time, or Running late and not tappable). Nothing starts until a row is tapped.
- [ ] Tapping Midi opens `?level=midi`: the masthead says "Paheli MIDI", the grid is 7x7, and numbering starts at No. 1 on the Midi's launch day. Mega is 9x9, shows the "Cryptic" legend, and fits a 375px and a 320px phone with no sideways scroll (also with Autocheck on).
- [ ] Solving a Midi gives "Streak 1" on its own; the Mini streak is unchanged. Share text starts "Paheli Midi #N". The result card's band and stamp are blue (Mega: red oxide).
- [ ] The result card offers "Play today's Mini / Midi / Mega" for the levels not yet solved today.
- [ ] Start the Mini, type a letter, switch to the Midi and type, then go back: both keep their letters and time.
- [ ] The Archive shows Mini / Midi / Mega tabs. Each lists only that level's past days and its own stamp card; days before a level's launch are flat. Archive play at `?level=midi&play=<date>` saves under the Midi's own archive.
- [ ] Tapping "Paheli" in the masthead goes back to the landing.
- [ ] A level before its launch date, or one removed from the manifest, is not on the landing, and its link falls back to the start.
- [ ] Live: Umami events carry `level`; `landing-open` and `level-pick` appear.

- [ ] CUJ 4: in a tab left open on the result card past midnight, the countdown is replaced by "Play today's paheli".
- [ ] Midnight in an open tab: returning to an unstarted puzzle reloads it, and a started one shows the "A new paheli is out" toast.
- [ ] CUJ 5: with the device time zone set to London, the India date and puzzle still show.
- [ ] CUJ 6: the address Copy button copies arv.experiments@gmail.com.
- [ ] CUJ 7: the weekly routine in the README produces a sheet, and publishing only approved rows works.

## Live site only
- [ ] The WhatsApp and Copy share texts end with the site link.
- [ ] "Report a clue" opens an email to arv.experiments@gmail.com with the subject "Paheli Mini #N (date): clue report", and `report-clue` appears in Umami.
- [ ] Opening `?utm_source=whatsapp&utm_medium=share` gives exactly one visit in Umami with source "whatsapp", and the address bar is cleaned.
- [ ] `puzzle-start`, `puzzle-solve` and `share-whatsapp` appear in Umami Realtime within 10 minutes.
