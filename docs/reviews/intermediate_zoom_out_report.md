# Stage 8: Intermediate Zoom Out Report

**Target:** `docs/designs/daily-puzzle-system.md` (full file), plus the recommendations from Stages 5 to 7 · **Reviewer:** egm-zoom-out

The doc understands its root problem: one person, no budget, producing a trustworthy puzzle every day. Stages 5 to 7 together propose about 90 changes. Most are cheap wording fixes, but some would turn a static site and a monthly script into a small operations platform.

Test used for each change: does it protect Arvind's time, or protect players' trust on a given day? If it does neither, it's YAGNI.

## Blocker

1. **The review load decides everything else, and it's still open.** The "under an hour" goal isn't credible. Keeping easier clues by default leaves the load at its maximum, and that choice ripples into the file format, checker, sheet, style guide, UI and tests.
   * **Fix:** Arvind reviews clues and GK sources only.
   * Easier clues and "why" lines are approved by default unless the checker or the self-solve pass flags them.
   * Set an honest time budget.
   * Self-solve is optional, stored in one `selfsolve` field.

## Major

2. **Unpublished work needs one durable home.** Stage 5 said Drive, and Stage 7 said a local git-ignored folder. A git-ignored folder inside a Claude session doesn't survive the session.
   * **Fix:** one backed-up folder on Arvind's machine or in Drive, holding each batch's JSON and its sheet.
   * `publish.mjs` reads only Status and Notes from the sheet and takes all content from the JSON. Edits typed into the sheet are ignored, and fixes go through Notes.
   * This removes the autocorrect risk with no sheet-versus-JSON comparison step.
3. **The checker needs product rules, not byte-level specs.** The app and the tools import the same `lib/` files, so they can't drift apart, and round-trip tests pin the behaviour. The rules the doc does need to state:
   * **Matching:** whole word, ignoring case.
   * **Example title:** fix it, since "Spill the Tea" contains TEA.
   * **Same word twice in one grid:** state whether it's allowed.
   * **Repeats:** one window that looks both ways and covers the buffer and the current batch.
   * **Hinglish:** a warning-only list of known misspellings, with no English dictionary.
   * **Batch record:** shown as real JSON.
4. **The safety plumbing is heavier than the risk.** `publish.mjs` is the only writer and already refuses past dates, and live editing is a non-goal.
   * **Fix:**
     * Drop the published-file guard and `[emergency-edit]`. `git revert` covers accidents.
     * Drop the stored `hash` and `enc` fields. The fingerprint can be computed at runtime.
     * Drop the v2 storage policy.
     * Keep one launch date.
     * **Add** a check that the manifest and the files match exactly.
5. **The gated deploy matters less than Stage 7 claimed** (downgraded from Blocker). Puzzle files go live 30 or more days before their date, so a failed check leaves weeks to fix them. Only app code goes live instantly.
   * **Fix:** `publish.mjs` runs the checker and tests before Arvind pushes.
   * A deploy through Actions that waits for the checks is optional, not required.
6. **A missed day needs one simple rule.**
   * A date that misses midnight is skipped and removed from the manifest, so streaks are safe. It's never published late.
   * Add a separate "You're offline" message.
   * No polling.
7. **The screen for an already-solved puzzle is undefined.**
   * **Fix:** show the result card, built from `solves[date]`, with the grid filled from the puzzle file.
8. **Sharing and reporting should each have one path.**
   * Use `utm_source` and `utm_medium` in share links, which Umami reads natively.
   * Report a clue lives on the result card only, as one `mailto:` with no clue picker.

## Recommendations rejected as over-building

* **Outside uptime monitor or keep-alive commits.** Cap the buffer at about 60 days instead. With a floor of 14, the alarm then fires before GitHub's 60-day inactivity cutoff.
* **Full multi-tab merge.** It's enough for `recordSolve` to re-read storage before writing.
* **Midnight cutoff rules.** Carry-over only applies within an open tab, and a reload always loads today.
* **A full Risks & Mitigations section.** Use a short Accepted Risks list plus 1 or 2 success thresholds instead.
* **Heavy test effort.** Replace the Playwright e2e script with a manual phone checklist, and drop the "every function tested" rule. Keep `node:test` for dates, grid, state and the checker.
* **`sensitive.txt` and `storage-unavailable`.** Both are optional. If the event stays, send it at most once per session.

## Consistency fixes, done in one editing pass

* Add a version query to module imports.
* Say four modules everywhere.
* Make Additional Resources and Future Improvements level-two headings.
* Settle the terms for easier clue and help.
* Render clue text as text, not HTML.
* Narrow CUJ 4 to time zones.
* Point the README at the design doc.

## The minimum set of changes, in priority order

1. Review by exception, with an honest time budget.
2. A durable batch home, with `publish.mjs` reading only Status and Notes.
3. Matching rule, one repeat window, warning-only Hinglish check, and a fixed example title.
4. Skip-the-day rule and an offline message.
5. Result card shown for an already-solved puzzle.
6. `utm_*` share links and one report-a-clue path.
7. Lighter safety plumbing, plus the manifest-and-files check and versioned module imports.
