# Plan: Aasaan clue, three levels, iOS follow-on

Status: plan, agreed 12 Nov 2026. Update 14 Nov 2026: Arvind chose to build levels straight away, without the step 3 design doc and review, and to launch on the main link. The levels code shipped as web v1.9.0 and follows "Feed", "Rules per level" and "App (web)" below; `docs/STATUS.md` records what was built. Still open from this plan: the reminder (step 1b), return tracking, and a scheduled weekly batch.

This plan reverses two earlier decisions in `daily-puzzle-system.md`:
- the Aasaan easier clue, removed in v1.1.0 on 2 Nov, comes back;
- "a difficulty selector or difficulty labels" is no longer a non-goal.

Both documents (this repo's design doc and the iOS repo's `AGENTS.md`) get updated as each piece ships.

## Decisions (Arvind, 12 Nov)

| Question | Decision |
|---|---|
| Grid sizes | Mini 5x5, Midi 7x7, Complex 9x9 |
| How often | All three come out every day at 00:00 IST (changed from weekly Midi and Complex, 12 Nov) |
| Who plays what | Everyone on the web or the iOS app can play any one, two or all three each day |
| What makes Complex harder | Bigger grid plus cryptic-style clues |
| Easier clues for puzzles already published (13 to 18 Nov) | Yes, add them |
| Review | Arvind no longer reviews every puzzle. Checks and a blind test solve replace the sheet (see "Quality without a full review") |
| Nostalgia clues | Less family and shaadi cliché, more pop culture (see `docs/clue-style.md`) |

## What the numbers say (Umami, 29 Oct to 12 Nov)

- 22 solves. Leaving out one 0-second solve (a full reveal), the median solve is about 2 minutes: half are between about 1.5 and 4 minutes. 5 of 21 finished under 90 seconds, and nobody under 45 seconds. These numbers include Arvind's own solves, which can't be separated out.
- 20 of 22 solves used no reveals, and 19 used no checks. So "easy to crack" shows up as almost everyone finishing without help, not as very fast times.
- Takeaway: the Mini works as the warm-up. The challenge should come from the Midi and the Complex, not from making the Mini harder.
- Play has slowed down: no one started the 10 or 11 Nov puzzles, and there have been only 3 solves since 9 Nov.

## Step 1. Aasaan clue back (this week)

Pipeline
- Batch format: every clue has `easy` again (required).
- `tools/check.mjs`: `easy` is required for batches and for published puzzles dated from 13 Nov onward. Only the 12 Nov puzzle has no easier clues (the 5 to 11 Nov batch was published before the removal and kept them), and it stays valid without them because it is already live. The rules that an easier clue can't contain the answer word, and that clues and answers are whole-word checked, still apply.
- `tools/make-sheet.mjs`: the "Easier clue" column comes back.
- `tools/publish.mjs`: publishes `easy`.

Backfill
- Claude writes easier clues for the 6 puzzles from 13 to 18 Nov and sends you a sheet to approve. The files are edited in place and re-checked. Today's live puzzle (12 Nov) is not touched.
- The batch file for b003 isn't in this workspace, so the backfill works from the published files (decode, add `easy`, re-encode).
- Safe for iOS: the app keeps published files forever once it has downloaded them, but so far it's only on Arvind's phone. A stale copy just means the button stays hidden on those days.

App (web)
- An "Aasaan clue" button on the clue bar, visible on every clue that has an easier version and hidden on clues that don't. In the first 4 days it existed it got 0 uses, so it must be easy to see and not hidden in a menu.
- Tapping it swaps the clue text for the easier one and marks that clue as helped. The saved `hints` count (kept in saved data since v1.1.0) starts counting again.
- The share text says "1 easy clue" or "N easy clues", as it did before. Speed tags don't change.
- Analytics: `puzzle-solve` already carries `hints`. Add a `hint-used` event (puzzle, slot) to see which clues need it.
- Bump APP_VERSION and the four `?v=` imports together; tests; manual checklist.

## Step 1b. Opt-in daily nudge and return tracking (right after step 1)

Why: about 12 friends have played and 1 came back the next day. Nothing reminds people that a new paheli is out.

Rules
- Opt-in only, offered on the result card after a solve ("Kal ki paheli ka reminder chahiye?"), never on first load and never as a pop-up before playing.
- At most one nudge a day, at a time the player picks (default 8 a.m. IST). Easy to turn off from the same place.
- Warm, playful copy in the game's voice, changing day to day. Never guilt ("You broke your streak!").

Web (no server, stays on free hosting)
- First version: "Remind me daily" adds a repeating calendar event with the link (an `.ics` file, plus a Google Calendar link). It works on every phone and needs no backend.
- Later, only if calendar uptake is low: web push. On iPhone that only works after "Add to Home Screen", and it needs a small free sender (for example a Cloudflare Worker on its free tier) plus storage for subscriptions. The design doc decides.

iOS
- A local notification scheduled on the phone: no server needed. This is already backlog item 5 in the iOS `AGENTS.md`.

Return tracking (Umami, no cookies, per device)
- `puzzle-start` and `puzzle-solve` carry `daysPlayed` (distinct dates solved on this device) and `daysSinceFirst` (days since this device's first solve), worked out from saved data.
- New events: `nudge-offered`, `nudge-on`, `nudge-off`, and a `utm_source=reminder` on the reminder link so the visits it brings back can be counted.
- What to watch: the share of solves from devices with `daysPlayed` of 2 or more, and visits from `utm_source=reminder`.

## Step 2. Play-test samples before building levels

Before any pipeline work, Claude makes 1 sample Midi (7x7) and 1 sample Complex (9x9, with cryptic clues) and puts them in a preview Arvind can play on his phone. What we learn decides the details in step 3:
- whether 7x7 and 9x9 fit a phone screen together with the on-screen keys;
- how many cryptic clues a Complex should have (proposal: about a third, the rest written in the harder R/GK/N style);
- whether cryptic wordplay works with Hinglish answers written in Roman letters.

## Step 3. Levels design doc and Goldfish review

The design doc covers what's below. A zero-context review follows (zoom-out, comprehension, critics, readiness), as with the first design.

Feed (backward compatible)
- Mini keeps `puzzles/<date>.json` and the manifest fields `launch` and `dates`, so the live site and the current iOS build keep working without changes.
- New: `puzzles/midi/<date>.json`, `puzzles/complex/<date>.json`, and a manifest field `levels: { midi: { launch, dates }, complex: { launch, dates } }`. Old clients ignore unknown fields.
- The record format stays the same. `grid` has 7 or 9 rows. Complex clues can use a new tag `C` (cryptic), and its `why` explains the wordplay.

Rules per level (all three daily)
- Each level follows today's Mini rules on its own: one puzzle per India date, out at 00:00 IST, and "running late" if that level's date is missing from the manifest. If one level is missing, the other levels can still be played.
- Numbering: Midi #1 and Complex #1 count from each level's own launch date.
- Streaks: each level has its own streak, using the same rule as Mini today. Playing Mini doesn't keep a Complex streak alive. Whether there should also be an "any level" streak is a question for the design doc.
- Saved data: Mini keeps the existing `paheli:v1:*` keys, so current streaks carry over. Midi and Complex get their own keys (`paheli:v1:midi:*`, `paheli:v1:complex:*`), because each date now has three puzzles. Each level keeps its own in-progress puzzle, so you can leave a Complex halfway, solve the Mini, and come back to it.

Pipeline
- `lib/grid.js`: size comes from the grid (5, 7 or 9), and the rules become 180° symmetry, every answer at least 3 letters, all white squares connected, and every square in both an Across and a Down answer.
- Filler for bigger grids; a level field in batches; a level column in the sheet; preview lets you pick a level; the nightly buffer check runs per level (each at least 3 days ahead).
- Volume: about 70 Mini clues + about 125 Midi + about 225 Complex, roughly 420 clues a week. Each level is checked and published on its own, so a problem in one Complex never holds up the Mini.

Quality without a full review
1. `tools/check.mjs` runs as today (shape, repeats, answer-in-clue, tag mix, spellings).
2. Every GK clue's fact is checked against its source by a web lookup before publishing.
3. A blind solve: a separate agent that has never seen the answers solves each puzzle from the clues alone. Any clue it gets wrong, finds ambiguous, or can only solve from crossings is rewritten and solved blind again. For cryptic clues, it must also explain the wordplay, and that explanation has to match the `why`.
4. The puzzle is published through a pull request, with a short report (flagged clues and what changed). Arvind merges it, and can play the preview first if he wants. The sheet becomes optional.
5. After launch, the report-a-clue email stays the safety net.
Open for the design doc: whether the weekly batch runs as a scheduled task that opens the pull request by itself.

App (web)
- A home screen showing today's Mini, Midi and Complex, each with its status (new, in progress, solved) and a Play button. Players pick one, two or all three, in any order. After solving one, the result card offers the others still unplayed today. Grid and key sizes adjust to the grid.
- Share text names the level: "Paheli Midi #2 · ...".
- Every analytics event carries `level`. Return tracking from the retention discussion lands here too: `puzzle-start` carries days played and days since first visit, per device.

## Step 4. Build and ship

Midi first (no new clue type), then Complex. Each ships on the web first, then gets ported to iOS.

## Step 5. iOS (in the Claude Code session on Arvind's Mac)

That session owns the iOS repo; nothing here edits it. As each web step ships, hand it this:

> The web app changed. Read `docs/designs/levels-and-aasaan-plan.md` and the commits since `ef31c15` in arvind13496/paheli-mini. In `AGENTS.md`, drop "Do not add back" for the Aasaan clue and remove "difficulty levels" from the non-goals. Port: (1) the Aasaan clue button on the clue bar, the `easy` field on `ClueRecord`, `hints` counting again, share text "N easy clues"; (2) when levels ship, the manifest `levels` field, per-level file paths, per-level `UserDefaults` keys, streaks and in-progress puzzles, a home screen listing today's three puzzles, and grid layouts for 7x7 and 9x9 above the keyboard (the 9x9 grid is the hardest fit, see AGENTS.md section 3). Add tests for each.

Also worth knowing: putting the app on friends' phones (TestFlight or App Store) requires the paid Apple Developer Program. Until then, free signing means reinstalling every 7 days.

## Risks

- With no human reading every clue, a wrong fact or a clumsy clue can go live. The GK source check and the blind solve reduce this, but don't remove it. The report-a-clue email is how it gets caught afterwards, and live puzzles are never edited, so a bad clue stays for that day.
- If a batch is late, the nightly alarm catches it for each level. A missing Midi or Complex only shows "running late" for that level.
- Cryptic clues are the biggest jump. They are hard to write well and hard to check automatically. The checker can enforce structure (tag, `why` present, answer not in clue), but only a person can judge whether the wordplay is fair. The step 2 samples are there to catch this early.
- A 9x9 grid on a phone with keys showing is tight. On iOS the native keyboard is already the main squeeze.
- Engagement: about 12 friends have played and 1 came back the next day. More levels give regulars more to do, but they don't bring people back by themselves, which is why the nudge (step 1b) comes before the levels.
