# Consolidated Goldfish Review: Daily Puzzle System

**Target:** [`docs/designs/daily-puzzle-system.md`](../designs/daily-puzzle-system.md)
**Mode:** Consolidated (all five stages, no checkpoints) · **Date:** 2026-10-27
**Stage reports:**
* [Stage 5, Zoom Out](zoom_out_report.md)
* [Stage 6, Comprehension](comprehension_report.md)
* [Stage 7, Critic](critic_report.md)
* [Stage 8, Intermediate Zoom Out](intermediate_zoom_out_report.md)
* [Stage 9, Implementation Readiness](implementation_readiness_report.md)

**Reviewers (11 runs, none saw the design conversation):** zoom-out ×2, comprehension, design critic, structural, style ×2, implementation readiness, codebase details.

## Verdict

The design passes on direction. The problem, the architecture and the rejected alternatives held up under every review lens. **It is not ready to build.** Several decisions are still left to whoever builds it, the CI and test setup won't run as written, and the doc contradicts its own example in places.

The Stage 8 zoom-out confirmed that most fixes are cheap. Its main warning: about a dozen of the recommendations would over-build a one-person side project, and they are listed under "Rejected as over-build".

---

## Blockers (must fix before building)

### B1. Review load: decide review-by-exception and set an honest time budget
* **Problem:** About 900 texts per batch is not "under an hour". This choice affects the file format, the checker, the sheet, the style guide and the UI.
* **Fix (needs Arvind):**
  * Arvind reviews clues and GK sources only.
  * Easier clues and "why" lines are auto-approved unless the checker or the self-solve pass flags them.
  * Set a realistic time per batch.

### B2. Batch storage and the publish source of truth
* **Problem:**
  * The batch file format is undefined.
  * Its home is a session folder that disappears.
  * `batch.json` at the repo root isn't git-ignored.
  * It's unclear whether edits made in the sheet get published.
* **Fix (needs Arvind for the folder):**
  * One backed-up folder holds `batches/<id>.json` and its sheet.
  * Define the batch file format as real JSON, including `selfsolve` and `warnings` fields.
  * `publish.mjs` reads only Status and Notes from the sheet, and takes all content from the JSON.

### B3. Checker rules that aren't defined
* **Problem:** The rules for matching an answer in its own clue or title, for repeats, and for Hinglish answers are undefined. The doc's own example fails its own rule.
* **Fix:**
  * Matching is whole-word and ignores case.
  * One repeat window, checked both before and after the date, covering the buffer and the current batch.
  * State whether the same word may appear twice in one grid.
  * Hinglish checking becomes a warning against a list of known misspellings. No English dictionary.
  * Replace the "Spill the Tea" example.

### B4. CI won't run
* **Problem:**
  * `npm ci` needs a lockfile that doesn't exist.
  * The published-file guard breaks on pull requests and first pushes.
* **Fix:**
  * Drop the guard and the `[emergency-edit]` rule for v1.
  * Commit `package-lock.json`, or skip installing packages in CI, since the checker uses only Node's built-ins.
  * Add a check that the manifest and puzzle files match exactly.

### B5. The app crashes or misbehaves while loading and after solving
* **Problem:**
  * Input handlers read the puzzle before the asynchronous load finishes.
  * A solved puzzle disappears on reload.
  * Several failure cases have no screen: offline, a missing file, a corrupt file.
* **Fix:**
  * Block input until the puzzle has loaded.
  * Today's solved puzzle shows the result card, with the grid filled from the answers.
  * Define a screen for each failure: "running late", "you're offline" and "refresh".

## Major (fix in the same edit pass)

| # | Action | Notes |
|---|---|---|
| M1 | **Build in phases** with exit checks: (1) lib + tests, (2) tools + data, (3) first batch published, (4) app switch-over, (5) CI. | The switch-over must not ship before the puzzle files exist. |
| M2 | **Specify the module switch:** `<script type="module">`, rename the local `load`/`save` functions, and list all 4 modules. | `file://` won't work for local testing. Use a local server. |
| M3 | **List every renamed field:** `t/c/e/w` → `tag/clue/easy/why`, `ans` → `answer`, and the hint key "A1" → "1A". Give `buildSlots(grid, clues)` the per-cell slot map. | From the codebase reviewer. |
| M4 | **Complete the progress shape:** add `solved` and `usedAuto`. Re-read storage before saving a solve, so a second tab can't overwrite it. Add a settings write and test storage with a write. | |
| M5 | **One launch date:** keep it in `manifest.launch` only. | Raised by 4 reviewers. |
| M6 | **Missed-day rule:** a date that misses midnight is skipped and removed from the manifest, never published late, and doesn't break streaks. No polling. | |
| M7 | **Midnight carry-over only applies within an open tab.** A reload always loads today's puzzle. Narrow CUJ 4 to time zones only. | Clock changes are an accepted risk. |
| M8 | **One report path:** the result card only, with one `mailto:` and no clue picker or per-clue links. | Also fixes the invalid link-inside-button HTML. |
| M9 | **Share links use `utm_source`/`utm_medium`**, which are removed from the address bar after load. | Umami reads these natively. |
| M10 | **Fix the header date** to use India time, and say what replaces the start-screen blurb. | Required by CUJ 4. |
| M11 | **Finish the removal list:** the `renderSwitch()` call in `solve()`, the boot puzzle selection, `#nextPuzzle`, the `.switch` CSS and the `level` in the eyebrow. | |
| M12 | **Version module imports** (`?v=APP_VERSION`). Remove the claim that `index.html` can cache-bust itself. | |
| M13 | **Test setup:** inject storage so tests run in Node, add `tests/fixtures/samples.json`, use concrete expected values, and replace Playwright e2e with a manual phone checklist. | |
| M14 | **Simplify the file format:** drop the stored `enc`/`hash` (compute the fingerprint when needed), drop the v2 storage policy, and strip `batch` and `source_note` before publishing. | |
| M15 | **Add a short Accepted Risks list** (readable future puzzles, clock peeking, byline concern declined, storage loss) and **1-2 three-month success targets.** | Replaces the requested full risks section. |
| M16 | **Wording and structure:** use one term for the easier clue and for "help", qualify absolute claims, make Additional Resources and Future Improvements H2 headings, mark `docs/clue-style.md` as to-be-created, and point the README to the design doc. | Style and structural reviewers. |

## Nits

* Render all fetched text with `textContent`, and encode the mailto fields.
* Fetch the manifest and today's puzzle in parallel, and don't let fonts block the start screen.
* Cap the buffer at about 60 days, so the 14-day alarm fires before GitHub's 60-day inactivity shutdown of scheduled jobs.
* Scheduled-job failure emails go to whoever last edited the cron.
* Send `storage-unavailable` at most once per session, or drop it.
* Note what happens to pre-dated puzzles if the launch date moves.

## Rejected as over-build (Stage 8)

* An outside uptime monitor or keep-alive commits. The buffer cap above covers this.
* A full CRDT-style merge across tabs. Re-reading before writing is enough.
* A gated GitHub Actions deploy. Optional: puzzle files go live 30+ days early, so the buffer itself is the safety gate.
* Byte-level codec and hash specs in the doc. The app and tools share the same code, and tests lock it down.
* A full Risks & Mitigations section, Playwright e2e, and the "every function tested" rule.
* The `sensitive.txt` list. Optional.

## Traceability Matrix

| Action | Stage 5 | Stage 6 | Stage 7 | Stage 8 | Stage 9 |
|---|---|---|---|---|---|
| B1 Review load | M2, M3 | | M3 | B1 | |
| B2 Batch storage / format | M1, M7 | B4 | M4 | M2 | B2, M18, M19, M22 |
| B3 Checker rules | M4 | B1, B2, B3 | M12, nit | M3 | B1, B3, M20 |
| B4 CI | M6, nit 8 | M19 | | M4 | B4, B5 |
| B5 Loading / solved / failures | | B5, M9 | M6 | M6, M7 | M9, M11 |
| M1 Phases | | | | | M6 |
| M2 Module switch | nit 4 | M18 | M19 | | M7, M8 |
| M3 Field renames | | M12 | | | M10 |
| M4 Progress / tabs / settings | nit 5 | M12 | M9 | rejected list | M11, M21 |
| M5 One launch date | nit 1 | M8 | | M4 | M12 |
| M6 Missed-day rule | | M9 | M6 | M6 | |
| M7 Midnight / CUJ 4 | | M11 | M7, M8 | rejected list | M13 |
| M8 One report path | M5 | M16 | M11 | M8 | M17 |
| M9 UTM share links | | M14 | M13 | M8 | |
| M10 Dateline / blurb | | M13 | nit | | M15 |
| M11 Removal list | | | | | M16 |
| M12 Versioned imports | nit 3 | M10 | M10 | cleanup | nit |
| M13 Test setup | | M20 | | rejected list | M14, M23 |
| M14 Simpler file format | nit 6 | M6, M7 | nit | M4 | nit |
| M15 Accepted risks / targets | | | M2, M17 | rejected list | M23 |
| M16 Wording / structure | nits 2, 9, 12 | nits | M14-M19, nits | cleanup | M24, nits |

## Decisions needed from Arvind before fixes are applied

1. **B1:** Should review be by exception, with easier clues and "why" lines approved by default unless flagged? Or should every text be read?
2. **B2:** Where should batches live permanently: a folder on your laptop, or a Google Drive folder?
3. **Launch date:** which India date is puzzle #1?

Every other action above can be applied directly to the design doc in one pass, using `egm-resolve`.

---

## Resolution (2026-10-27, revision 2 of the design)

Arvind's decisions:
* **Batches.** Weekly batches of 7. The buffer target is 7 to 14 days, with an alert at fewer than 3. Every text is reviewed, which fits about 30 minutes for a batch this size.
* **Batch storage.** Unpublished batches live on Arvind's laptop, in `batches/` inside his clone, which git ignores.
* **Launch.** Puzzle #1 is Thursday 29 October 2026, with the full build done first.
* **Scope.** v1 runs for its first month, with targets reviewed at the end of week 4.

All blockers B1 to B5 and majors M1 to M16 are applied in the design doc. "Rejected as over-build" is recorded as Alternative H.
