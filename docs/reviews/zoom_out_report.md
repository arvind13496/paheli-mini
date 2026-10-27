# Stage 5: Initial Zoom Out Report

**Target:** `docs/designs/daily-puzzle-system.md` (full file) · **Reviewer:** egm-zoom-out · **Standard:** zoom-out-standard

There is enough context to judge the objective, and the root problem is clear: one person must ship a daily puzzle without breaking players' trust. The design reuses what the prototype already has and rejects heavier infrastructure. No blockers.

## Major

1. **Unpublished work has no permanent home.** Plaintext batches and review sheets are excluded from git and "live only in the sheet and the Claude session", but sessions can be wiped. The fix loop and publishing need these files across days and sessions. *Fix:* name one durable location, such as a private Drive folder, and state that the repo becomes the source of truth once a puzzle is published.
2. **The review-load goal isn't credible.** Each batch has about 900 texts to check (clue, easier clue and "why" for every answer). Reviewing them in under an hour means under 4 seconds per text, and nothing in the pipeline reduces reading. *Fix:* settle the easier-clue question, or review by exception: Arvind reads clues and GK sources, and easier clues and "why" lines are approved by default unless flagged. Then restate the goal.
3. **Open questions affect more than the plan admits.** The plan says changing an open question "only alters the line named", but dropping easier clues touches the file format, checker, tests, sheet, style guide and UI. The reveal rule also touches `state.js` and its tests. *Fix:* answer them before building, or list everything each one affects.
4. **The Hinglish check needs an English dictionary that isn't specified.** Acronyms and names (PCO, OTT, STD, VHS, RAO, SRI, ANIL) would fail it. *Fix:* name the word list and add a list of allowed non-dictionary answers, or simplify to a blocklist of known misspellings that only warns.
5. **There are two ways to report a clue.** The result card with a clue picker covers the goal and CUJ 5. Per-clue Report links also clutter the newspaper layout. *Fix:* keep only the result card.
6. **The published-file guard breaks on pull requests and first pushes.** On those events GitHub provides no previous commit to compare against (`github.event.before`). *Fix:* run the guard on push only with a fallback, or compare each published file's fingerprint against the manifest, which needs no git history.
7. **Self-solve flags have no way into the review sheet.** *Fix:* add a `selfsolve` field to the batch record, or mark the self-solve pass as manual and optional.

## Nits

1. The launch date is stored in two places: `LAUNCH_DATE` and `manifest.launch`. Keep only the manifest one.
2. "Has no way to measure players" understates the current app, which already sends Umami events.
3. The app can't cache-bust `index.html` itself, so drop that claim. Only the manifest fetch needs busting.
4. The Technical Plan says two modules and the Detailed Plan says four. Make them match.
5. Keeping progress for 2 days is speculative, since a reload after midnight can't reach it anyway. Keep one progress entry.
6. Puzzle files carry two version fields (`schema` and `enc`), and there's a pre-planned v2 storage policy. `schema` alone is enough.
7. The buffer goal says 30, but only 14 is checked. Call 30 the target and 14 the hard floor.
8. CI installs `exceljs` and needs a lockfile that isn't listed. Skip the install in CI, since the checker uses only Node built-ins.
9. CUJ 6 says "picture of the grid" but the plan says five monospace lines. Make them match.
10. The `storage-unavailable` event could eat into the Umami cap. Send it once per session, and include page visits in the cap maths.
11. The Technical Plan contains some low-level detail, such as the XOR mechanics and storage fields. This is acceptable at this size.
12. Item 12 lists this doc itself as a file to create, and Alternative B mentions "this session". Remove both.
