# Paheli: project status (start here)

The single source of truth for every chat and Claude Code session working on Paheli. Read it before starting. Update it before finishing. If something here is wrong or out of date, fix it here rather than working around it.

Last updated: 14 Nov 2026, by the iOS Claude Code session.

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

- Web app v1.6.0: daily 5x5 Mini at 00:00 IST, Aasaan clue button (back since 13 Nov), autocheck and check/reveal, streaks on the device, WhatsApp and copy share, report-a-clue, Umami events.
- Puzzles published through 18 Nov (batches b001 to b003). Next batch due: 19 Nov onward. The nightly check fails when fewer than 3 future days remain.
- iOS app: runs on Arvind's iPhone only (free signing, reinstall every 7 days). Matches web v1.6.0, including the Aasaan clue (ported 13 Nov, paheli-ios `822d728`). Puzzle files are now fetched fresh on each launch with an on-device copy for offline, so edits to published files (like the easier clues added to 13 to 18 Nov) reach the app.

## In flight

| Work | Owner | Where | State |
|---|---|---|---|
| 7x7 and 9x9 grid support, level-aware checker, Midi and Complex samples | Web session | PR #11 | Waiting for Arvind to merge; samples waiting for his play-test |
| Player flow with levels | Web session | Figma file above | Landing screen, level cards, result with "Up next" and reminder: proposals, not built |

## Next up (in order)

1. Batch b004 (Mini, 19 to 25 Nov) with the new clue style: more pop, fewer family jokes.
2. Reconcile the two reminder plans (see "Needs a decision"), then build the opt-in nudge and return tracking (plan step 1b).
3. Levels design doc and Goldfish review, informed by the samples and the Figma flow.
4. Build Midi, then Complex. The iOS app ports each piece after it ships on the web.

## Decisions (newest first)

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
- From the return hooks doc, not in any build plan yet: streak freeze, themed days with a tomorrow teaser, emoji-grid share text, shared links landing on the friend's puzzle, add to home screen after the 3rd solve, monthly stamp card. Which come before levels?
- Combined "any level" streak, or only per-level streaks?
- Domain (paheli.in?) or stay on GitHub Pages.

## How to use this file

Every session, chat or Claude Code:

1. **Start:** read this file. In a code session, also check open pull requests and `git log` since the "Last updated" date. If your task is already listed under "In flight" or "Decisions", build on it rather than redoing it.
2. **Claim:** before starting real work, add a row to "In flight" (owner, where, state).
3. **Conflict:** if what you're asked to do contradicts a decision here, or overlaps another lane's work, tell Arvind and ask before going ahead.
4. **Finish:** update "What's live", "In flight", "Decisions" and "Needs a decision", and bump "Last updated". Code sessions do this in the same pull request as the work.
5. **Chats** can't edit this file. End a working chat with a short "Status update" block (decisions, new work, open questions) for Arvind to hand to a code session, which adds it here.
