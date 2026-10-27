# Paheli Mini: Daily Puzzle System (v1)

* **Author:** Arvind Lakhani
* **Date:** 2026-10-27

## Overview

Paheli Mini is a free web app that releases one 5x5 mini crossword every day at 00:00 IST, credited to Arvind Lakhani, written for Indian millennials. Clues mix riddles, desi general knowledge, and nostalgia and internet culture, with English or Hinglish answers in Roman letters.

Claude generates puzzles in batches of 30. Arvind reviews each batch in one spreadsheet and marks each puzzle approved or flagged. Approved puzzles are published to a free static host. Players get a timer, check and reveal tools, easier-clue hints, a streak saved on their device, a WhatsApp share card, and a way to report a wrong clue by email.

The core value is a two-minute daily ritual that feels made for this audience, not translated from an American one.

## Analysis

Six reviewers with no access to our conversation read this concept and the current app code. They agreed that hosting cost and traffic are not real risks: a static site of about 40 KB per load fits free tiers for millions of visits a month. The real risks are below, most severe first.

### 1. The public repo leaks future puzzles (all six reviewers)

A 30-day buffer in a public GitHub repo lets anyone read next month's answers on github.com. Scrambling answers inside the app does not help with that. The current code also exposes answers in three more places: the clue list is keyed by the answer word itself, the "why" explanations name the answer, and the easier clues often hint at it directly.

There are two release designs, and both have a cost:

* **Publish ahead.** All approved days are deployed in advance as separate date-named files, and the app opens today's file based on the IST date. This is reliable. The cost is that someone who changes their phone date, or guesses tomorrow's file address, can play early.
* **Publish daily.** A scheduled GitHub job publishes each day's file at midnight. Free scheduled jobs often run 10 to 30 or more minutes late. GitHub also turns them off silently in public repos after 60 days with no commits. One missed run means no puzzle that day.

Reviewers favoured publish ahead. Two of them noted that Cloudflare Pages can deploy for free from a **private** repo. That keeps the spreadsheet, raw generations and readable puzzle files private, and only scrambled per-day files go online. That fits Arvind's stated tolerance: determined people can peek, but nothing is readable in one or two clicks.

### 2. Success cannot be measured yet (five reviewers)

Daily players, streak length and WhatsApp shares are all invisible on a static site that stores data only on each phone. Without measurement, the 3-month review is guesswork.

A free, cookie-free analytics tool (Cloudflare Web Analytics or GoatCounter) can count a few events: puzzle started, puzzle solved (time bucket, help used, streak length), share tapped and report tapped. Puzzle quality can be judged indirectly from solve rate, reveal rate and easier-clue use per clue, plus report emails per puzzle.

### 3. Shares don't lead anywhere (five reviewers)

The current share text has the time and help used but no link. Every forwarded result is a dead end, and WhatsApp is the whole growth plan. The share text needs the site address, with a tag such as `?s=wa` so visits from shares can be counted. It also needs the puzzle number or date, so someone who opens the link the next day understands why they see a different puzzle.

### 4. "Today" and the streak are not defined (all six reviewers)

The app takes the date from the phone's own time zone. Indians abroad, wrong phone clocks and players solving around midnight would get the wrong puzzle or lose their streak. The rules need to be fixed:

* Today's date is always computed in India time (UTC+5:30), whatever the phone's setting.
* The puzzle number is days since launch plus one, tied to the date, so it never shifts.
* A puzzle started at 23:58 and finished at 00:03 counts for the day it belongs to.
* A streak is a run of consecutive IST dates on which that day's puzzle was solved. Solves with reveals still count, since the share card already labels them "with a little madad".
* Streaks are worked out from a saved list of solved dates, not stored as a single number. A list can be checked, repaired and later synced across devices. A stored number cannot.
* A day with no puzzle, which is the publisher's fault, does not break anyone's streak.

### 5. Nobody playtests, so code must catch what a player would (all six reviewers)

The spreadsheet review catches clue tone and facts. It cannot reliably catch structural errors, and reviewing about 900 short texts per batch (30 puzzles, 10 entries, three texts each) causes fatigue. An automatic checker should run on every batch before Arvind sees it, and again before publishing:

* the grid is 5x5 and uses only A to Z and black squares
* every white square belongs to both an Across and a Down answer, and no answer is under 3 letters
* every answer has a clue, an easier clue and a "why" line
* no answer appears inside its own clue or easier clue
* no answer repeats within the last 30 days (the three sample puzzles already reuse SRI)
* Hinglish answers use one agreed spelling from a house list (CHAI, not CHAY)
* topics on a sensitive list are flagged: politics, religion and caste

A cheap stand-in for playtesting is to have a separate Claude session try to solve each puzzle from the clues alone and flag entries it can't get.

General-knowledge claims are the biggest risk with AI-written clues. The current ONION clue already makes a party-political claim. GK clues should carry a source the reviewer can spot-check.

### 6. The data format needs to change before launch (four reviewers)

Several current choices will cause bugs at scale:

* **Clue keys.** Clues are looked up by answer word, so two identical answers in one grid would overwrite each other. Clues should be keyed by position, such as 1A or 4D.
* **Saved progress.** Progress is saved as `paheli-1`, `paheli-2` and so on. Anyone who played the samples would open daily puzzle #1 already marked solved with the wrong letters. Saved progress should be keyed by date under a new versioned name, with the old keys cleaned up.
* **Fingerprints.** Each puzzle file should carry a format version, a date, a fingerprint of its grid, the byline and the scrambling method used. If a grid ever changes, saved progress for the old grid is thrown away rather than shown in the wrong squares.
* **Scrambling.** The whole puzzle file is scrambled and unscrambled by one shared piece of code, not answer by answer, so check and reveal keep working.

### 7. Running out of puzzles (five reviewers)

A single owner with a 30-day buffer and no fixed review schedule is the main operational risk. Four safeguards cover it:

* Generate 60 puzzles before launch, so the 30-day buffer is real from day one.
* Approve puzzle by puzzle, so one bad puzzle never holds back 29 good ones.
* Add a third review status, "replace puzzle", for a bad grid that a clue rewrite can't fix.
* An automatic check emails Arvind when fewer than 14 approved days remain.

If today's file is missing, the app shows a friendly "today's paheli is late" screen instead of a blank page or a crash.

### 8. Streaks get lost in WhatsApp's in-app browser (four reviewers)

A link tapped inside WhatsApp often opens in its own browser, which keeps separate storage from Chrome or Safari. iPhones can also clear a site's storage after 7 days without a visit. The result is streaks that seem to vanish, which hurts the streak metric directly. v1 should accept this openly and soften it:

* a small "Streaks are saved on this browser" note
* an "Add to Home Screen" nudge for regular players
* optionally, a short copy-paste code to move a streak to another browser

### 9. The byline credits a person for AI-generated puzzles (three reviewers)

"By Arvind Lakhani" on puzzles generated by Claude is easy to call out, especially if any part of the pipeline is public and the audience is very online. NYT itself credits an editor separately from the constructor. Options include "Edited by Arvind Lakhani" or "By Arvind Lakhani with Claude". The name should be stored in each puzzle file rather than written into the page, which also prepares for guest constructors.

### 10. "Fully automatic later" will not be free (one reviewer)

Unattended generation needs the paid Claude API. Free generation means Arvind driving the Claude app by hand. v1 generation is manual, in smaller runs of 5 to 10 puzzles with the recent-answers list passed in to avoid repeats. Later automation is a small but real cost.

### 11. Smaller fixes

* **No "Next puzzle" button.** Replace it with a countdown: "Next paheli in 7h 12m".
* **Midnight rollover.** A tab left open across midnight checks the date again when the player returns to it.
* **Report a clue.** The email link pre-fills the puzzle number, date and clue. The address is also shown as text to copy, because email links often do nothing on Android.
* **Cleanup.** Remove the prototype footer, the difficulty labels and the puzzle switcher completely, not just hide them.
* **Caching.** Hosts and browsers cache files, so a single "today" file could serve yesterday's puzzle after midnight. Date-named files, with the address worked out by the app, avoid this.
* **Blocked storage.** When the browser blocks storage (private mode), say "streaks unavailable in this browser" rather than showing a streak of 0.
* **Spoilers.** The result card stays spoiler-free. The "Why these answers" list sits below it, out of the screenshot area.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * one puzzle a day at 00:00 IST, numbered from launch day
  * a byline read from each puzzle file
  * one default difficulty
  * a batch generation and spreadsheet review pipeline with an automatic checker
  * scrambled per-day puzzle files on free hosting
  * streaks per device, computed from a solved-dates list
  * a WhatsApp share with a link
  * report-a-clue by email with puzzle details filled in
  * free cookie-free analytics
  * a missing-puzzle screen and a low-buffer email alert
* **Out-of-Scope Non-Goals:**
  * leaderboards
  * accounts and cross-device sync (the solved-dates list keeps the door open)
  * an archive of past puzzles
  * bigger grids
  * a difficulty selector
  * monetisation
  * Hindi script
  * editing live puzzles
  * an admin interface
  * fully automatic generation

## Key Decisions & Staging for Next Steps

**Decisions made by Arvind (2026-10-27):**

1. **Release design: publish ahead from a public repo.** Readable future puzzle files are acceptable for v1, and the risk is accepted knowingly. Per-day files are still scrambled, so nothing is readable in one or two clicks on the live site. A private repo or backend can come later. Because future files are public anyway, the "no answers in plain text in commits" check from the reviewers is dropped.
2. **Byline: "By Arvind Lakhani"**, stored as a `constructor` field in each puzzle file. The reviewers' disclosure concern is noted and declined for v1.
3. **Analytics: Umami Cloud Hobby plan** (pending Arvind's final pick). It's free and cookie-free, covers 1 site and 100K events a month, keeps data for 6 months, and supports custom events with properties. The fallback if traffic outgrows it is GoatCounter: free for reasonable use with no hard cap, but with simpler event tracking. Cloudflare Web Analytics is ruled out because it has no custom events, so it can't count solves or shares.
4. **Report email: arv.experiments@gmail.com**, used in a pre-filled email link and also shown as copyable text.

**Carried into `/egm-draft` as settled:**

* India-time date logic
* the streak rule above
* the per-date versioned puzzle file format with position-keyed clues
* the automatic checker
* 60 puzzles before launch
* the missing-day screen
* a share link with a tag
* the countdown in place of "Next puzzle"
* the storage-loss note
* removal of the prototype leftovers
