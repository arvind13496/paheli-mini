# Paheli: project status (start here)

The single source of truth for every chat and Claude Code session working on Paheli. Read it before starting. Update it before finishing. If something here is wrong or out of date, fix it here rather than working around it.

Last updated: 25 Nov 2026, by the web Claude Code session (Midi and Mega week 3; references bank; grid filler in the repo).

## Where everything lives

| What | Where |
|---|---|
| Live web app | https://arvind13496.github.io/paheli-mini/ (GitHub Pages, from `main`) |
| Web repo (app, puzzles, tools, docs) | github.com/arvind13496/paheli-mini (public) |
| iOS repo | github.com/arvind13496/paheli-ios (private), worked on from `/Users/arvind/Paheli` on Arvind's Mac |
| Core design | `docs/designs/daily-puzzle-system.md` |
| Plan for Aasaan clue, nudge, three levels | `docs/designs/levels-and-aasaan-plan.md` |
| Clue style guide | `docs/clue-style.md` |
| Return hooks plan (share, reminders, streak freeze, themed days) | claude.ai doc "Paheli Mini: return hooks plan", https://claude.ai/artifact/Cray2N32pEX25jzTagmQPT (from a chat, 6 Nov) |
| Player flow with levels (Figma) | https://www.figma.com/design/qEv143gf5anTx4emrdnUjk |
| Playable previews (private, contain answers) | "Paheli Mini Preview" (all published puzzles), "Paheli Levels Samples" (Midi and Complex samples) in Arvind's artifacts |
| Other design work | "Paheli Mini colour prototypes" (design canvas, 12 Nov), "Paheli Mini Board" (5 Nov) in Arvind's artifacts |
| Analytics | Umami Cloud, account arv.experiments@gmail.com |
| Clue reports | arv.experiments@gmail.com |

## Who works on what

Each lane owns its files. Anything that crosses lanes goes through this file.

| Lane | Owns | Does not touch |
|---|---|---|
| Web session (Claude Code, cloud) | Web app, puzzle pipeline and batches, `puzzles/`, analytics events, this file | The iOS repo |
| iOS session (Claude Code, Arvind's Mac) | `paheli-ios`, its `AGENTS.md` | Web repo files, except this file's iOS section via a pull request |
| Chats in the "Paheli App" project | Ideas, copy, design thinking, plans as docs | Code. Decisions only count once they're added here |

Shared contracts (the puzzle feed format, `puzzles/manifest.json`, saved-data keys, share text, streak rules) change only in the web repo, through a pull request that also updates this file. The iOS app follows them.

## What's live

- Web app v1.9.0 (levels, arvind13496/paheli-mini#18, merged 14 Nov): daily 5x5 Mini, plus Midi (7x7) and Mega (9x9) behind a landing screen with per-level numbering, streaks, archive and stamps. Before that, v1.8.0 (7x7 and 9x9 grids can be drawn): daily 5x5 Mini at 00:00 IST, archive of every past Mini with a monthly stamp card (14 Nov), Aasaan clue button (back since 13 Nov), autocheck and check/reveal, streaks on the device, WhatsApp and copy share, report-a-clue, Umami events.
- Midi and Mega: first week, 18 to 24 Nov, published (arvind13496/paheli-mini#19, merged 14 Nov). Mega has 8 cryptic clues a day.
- Mini puzzles published through 2 Dec (batches b001 to b005). b005 went in late, on 25 Nov: the nightly check failed 22 to 25 Nov. Next Mini batch (b006, 3 to 9 Dec) must merge by 29 Nov.
- Midi and Mega published through 8 Dec once week 3 merges (this PR). Week 4 (9 to 15 Dec) must merge by 5 Dec.
- iOS app: runs on Arvind's iPhone only (free signing, reinstall every 7 days). Matches web v1.9.0: the Aasaan clue (paheli-ios `822d728`), the archive and stamp card (arvind13496/paheli-ios#2), and Midi and Mega with the landing (arvind13496/paheli-ios#3), all on paheli-ios `main`. Uses the web fonts (Young Serif, Libre Franklin, Source Serif 4) since arvind13496/paheli-ios#4. Play screen redesigned in Figma and ported (arvind13496/paheli-ios#5, #6): header with the timer centred and pause plus a "more" menu (check, reveal, clear, archive); the grid is pinned and fixed at the column width (361pt on iPhone 16), the same for every clue and on archive days; the clue bar is always two lines tall. The easier-clue button reads "Clue" on iOS (web still says "Aasaan clue"); the tag after use and the toast still say "Aasaan clue". Puzzle files are fetched fresh on each launch with an on-device copy for offline. 26 unit tests pass on the iPhone 16.

## In flight

| Work | Owner | Where | State |
|---|---|---|---|
| Player flow with levels | Web session | Figma file above | Landing screen, level cards, result with "Up next" and reminder: proposals, not built |

## Next up (in order)

1. Mini b006 (3 to 9 Dec) by 29 Nov. Then the weekly scheduled task that writes all three levels and opens the puzzle PR, so a batch can't be missed again.
2. Reconcile the two reminder plans (see "Needs a decision"), then build the opt-in nudge and return tracking (plan step 1b).
3. Weekly batches per level after week 2, each at least 7 days ahead.
4. iOS ports each new web feature after it merges (iOS is at web v1.9.0).

## Shared saved-data keys

The iOS `PlayerStore` mirrors these names and JSON shapes.

| Key | Holds | Since |
|---|---|---|
| `paheli:v1:settings` | `{ autocheck }` | launch |
| `paheli:v1:solves` | `{ "<date>": SolveStats }`, daily solves only; the only key `streaks()` reads | launch |
| `paheli:v1:progress` | One in-progress daily puzzle `{ date, hash, ... }` | launch |
| `paheli:v1:archive` | `{ "<date>": SolveStats }`, archive solves (past days played later), merged by date. Never counts toward streaks | 14 Nov 2026 (web v1.7.0; iOS since 14 Nov) |
| `paheli:v1:archive-progress` | One in-progress archive puzzle, same shape as `progress`; the last one played wins | 14 Nov 2026 (web v1.7.0; iOS since 14 Nov) |
| `paheli:v1:midi:solves`, `:progress`, `:archive`, `:archive-progress` | The same four, for Midi. Mini keeps the unprefixed keys | 14 Nov 2026 (web v1.9.0; iOS since 14 Nov) |
| `paheli:v1:mega:solves`, `:progress`, `:archive`, `:archive-progress` | The same four, for Mega | 14 Nov 2026 (web v1.9.0; iOS since 14 Nov) |

## Feed

- Mini: `puzzles/<date>.json`, manifest `{ launch, dates }` (unchanged, so older app builds keep working).
- Midi and Mega: `puzzles/midi/<date>.json`, `puzzles/mega/<date>.json`, manifest `levels: { midi: { launch, dates }, mega: { launch, dates } }`. Same record format; the grid has 7 or 9 rows; Mega may use the clue tag `C` (cryptic).
- A level is live when the manifest lists it and its launch date has arrived (IST). Taking it out of the manifest pauses it: the off switch, with no app release.

## Decisions (newest first)

- 25 Nov: `data/desi-references.md` is the references bank. Every batch reads it, uses a few entries, records `used` dates and adds new references. Arvind adds entries any time. It was first cross-checked with Grok and Google Antigravity (every item confirmed against major outlets). Items that touch the avoid list sit under "Needs Arvind's call" until he decides.
- 25 Nov: The grid filler lives in the repo (`tools/fill/`, Python + wordfreq), because session scratchpads get cleared.
- 25 Nov: Batches get a review by an "Indian newspaper crossword editor" agent (fairness, facts, freshness, desi tone, ready-to-use rewrites) on top of the checker, GK source check and blind test-solve. Asked for by Arvind; first used on b005.
- 15 Nov: Midi and Mega launch early, from 16 Nov, overriding the 7-days-first rule only in timing (Arvind). The launch PR adds 16 and 17 Nov puzzles and moves both levels' manifest `launch` to 16 Nov, so Midi #1 and Mega #1 are 16 Nov and the first week's puzzles become #3 to #9. 15 Nov was skipped: it was nearly over (IST) when the work started.
- 14 Nov: The 9x9 level is named **Mega** (was "Complex" in earlier notes and plans). Its id is `mega` everywhere: `?level=mega`, `puzzles/mega/`, manifest `levels.mega`, keys `paheli:v1:mega:*`. Nothing was live under the old name.
- 14 Nov: Midi and Mega go straight to the main link, as soon as each has 7 days of puzzles: no beta link, no design-doc gate, no accounts or transfer code (streaks stay per browser). Safeguards kept: the manifest off switch, one play-through by Arvind in a preview before launch, at least 7 days of puzzles ahead per level.
- 14 Nov: Levels in the app (v1.9.0). Address: `?level=mini|midi|mega` (plus `&play=<date>` for that level's archive). With more than one level live and no `level`, the first screen is the landing (three rows with today's status). Each level has its own numbering, streak, in-progress puzzle, archive and stamp card. Share text names the level ("Paheli Midi #4 · ..."). Analytics: `level` on every event, new `landing-open` and `level-pick`. Colours: Mini marigold, Midi azulejo blue, Mega red oxide.

- 14 Nov: Archive and monthly stamp card (reverses the "a missed day is gone" non-goal). Every past Mini from #1 to yesterday is playable at `?play=YYYY-MM-DD` and listed at `#archive` (header calendar icon, and an "Archive" link on the result card). Archive solves go to the new `paheli:v1:archive` key and never count toward streaks; a day already solved live shows its old result plus "Play again", which saves nothing. Archive share text: "(archive)" after the title, no streak, `utm_campaign=archive`, link to today's puzzle. Analytics: `mode` (`daily`/`archive`) on events, new `archive-open`, `streak: null` on archive solves. Stamp card: one per month in the archive, and this month's under the streak line on the result card; a stamp is the day's black-square pattern in marigold tiles, read from the puzzle file (no new key). iOS port: arvind13496/paheli-ios#2 (14 Nov).

- 13 Nov: First screen is a landing that waits until the player picks a level (no auto-advancing splash). Level colours: Mini marigold, Midi azulejo blue, Complex red oxide.
- 12 Nov: Three levels, all daily: Mini 5x5, Midi 7x7, Complex 9x9 with cryptic clues. Players choose any or all. Each level has its own streak and numbering.
- 12 Nov: Arvind no longer reviews every puzzle. Checks, a GK source check and a blind test-solve replace the review sheet; puzzles go out by pull request.
- 12 Nov: Nostalgia clues lean on pop culture (films, OTT, music titles, cricket, ads, memes); at most one family clue per puzzle.
- 12 Nov: Aasaan clue brought back (v1.6.0).
- 12 Nov: Repeat rule: no answer repeats within 14 days inside a level; across levels, no 4+ letter answer twice on the same day.
- 6 Nov (return hooks doc): one-to-one, no channels or community; no guilt copy; ask only after a win; plain-text emoji-grid share; reminders opt-in, at most one a day.
- 29 Oct: Launched. Free hosting only, public repo, answers lightly scrambled, byline "By Arvind Lakhani", release at 00:00 IST.

## Needs a decision (from Arvind)

- Reminders: the return hooks doc says web push (on iPhone only after "Add to Home Screen", plus a free sender service). The levels plan says start with a calendar reminder (no server) and add push later. Copy differs too: "Kal ka Mini ready hone par bataun?" / "Haan, batao" in the hooks doc, "Kal ki paheli ka reminder chahiye?" in the Figma flow. Pick one before building.
- From the return hooks doc, not in any build plan yet: streak freeze, themed days with a tomorrow teaser, emoji-grid share text, shared links landing on the friend's puzzle, add to home screen after the 3rd solve. (The monthly stamp card is decided and built; see 14 Nov.) Which come before levels?
- Combined "any level" streak on top of the per-level streaks? (v1.9.0 ships per-level only.)
- Domain (paheli.in?) or stay on GitHub Pages.

## How to use this file

Every session, chat or Claude Code:

1. **Start:** read this file. In a code session, also check open pull requests and `git log` since the "Last updated" date. If your task is already listed under "In flight" or "Decisions", build on it rather than redoing it.
2. **Claim:** before starting real work, add a row to "In flight" (owner, where, state).
3. **Conflict:** if what you're asked to do contradicts a decision here, or overlaps another lane's work, tell Arvind and ask before going ahead.
4. **Finish:** update "What's live", "In flight", "Decisions" and "Needs a decision", and bump "Last updated". Code sessions do this in the same pull request as the work.
5. **Chats** can't edit this file. End a working chat with a short "Status update" block (decisions, new work, open questions) for Arvind to hand to a code session, which adds it here.
