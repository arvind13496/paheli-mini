# Stage 9: Implementation Readiness Report

**Target:** `docs/designs/daily-puzzle-system.md` lines 465-692 · **Reviewers:** egm-implementation-readiness, egm-codebase-details (implementation-readiness-standard), egm-style

**Verdict: NOT READY.** The plan's claims about the existing code are accurate. `build()`, `PUZZLES`, `renderSwitch`, the storage keys, `track()` and the Umami install all exist as described. But the plan still leaves decisions to whoever builds it, and its CI and test setup won't run as written.

## Blockers

1. **The English word list is never chosen** (all three reviewers). The Hinglish rule needs a dictionary, and the sample answers (PCO, OTT, STD, VHS, SRI, RAO, ANIL) would fail it anyway.
2. **The batch file format is undefined** (readiness). The plan never says whether a batch is an array or keyed by date, where it lives, or how the fix loop updates it.
3. **The rule for "answer in its own clue or title" is undefined, and the doc's own sample fails it** (readiness). "Spill the Tea" contains TEA.
4. **`npm ci` fails** (codebase). It needs a `package-lock.json`, and no step creates one.
5. **The published guard can't work** (codebase). On pull requests there's no previous commit to compare against. The checkout only fetches the latest commit by default, so older ones aren't available. On a pull request, the "[emergency-edit]" message check reads the wrong commit.

## Major

6. **There are no phases** (readiness, codebase). The plan is a flat list of 18 items. If the new `index.html` ships before the puzzle files exist, the live site shows "running late". *Fix:* build in phases (lib + tests, then tools + data, then the first batch, then switch the app over, then CI), each with an exit check.
7. **The app script must become a module** (codebase, readiness). The current `<script>` has to change to `<script type="module">`, which no longer works when the file is opened directly from disk (`file://`).
8. **Name clash** (codebase). `index.html` already declares `load()` and `save()`, so importing `load` from `lib/state.js` is a syntax error.
9. **The app crashes before the puzzle loads, or when it's missing** (codebase, readiness). Six input handlers read `S` and `P`, which won't exist yet once loading becomes asynchronous. The "running late" screen has no location in the page and no rule for when its countdown hits zero.
10. **The field mapping between old and new code is unspecified** (codebase, readiness):
    * `t/c/e/w` become `tag/clue/easy/why`, and `ans` becomes `answer`.
    * The hint key changes from "A1" to "1A".
    * `buildSlots` has no way to attach clues, and `cellEnt` (which grid square belongs to which words, used in 5 places) isn't covered.
11. **A solved puzzle disappears on reload** (codebase, readiness). Progress is deleted on solve, and the progress shape drops `solved` and `usedAuto`, which are used in about 20 places and in the share text.
12. **There are two sources for the launch date** (codebase, readiness). `LAUNCH_DATE` and `manifest.launch` can disagree.
13. **The `?date=` override isn't pinned down** (codebase). It reads `location`, which doesn't exist in Node, so it throws there. Which functions use it isn't said.
14. **Tests can't run as described** (codebase, readiness):
    * There's no `localStorage` in Node, and no way to supply a stand-in.
    * The three sample puzzles are deleted with nowhere to put them as test fixtures.
    * The e2e test has no Playwright dependency, no server, and no way to serve test puzzles.
    * Several functions have no listed test, which contradicts the "every function tested" rule.
15. **The header date still uses the phone's time zone** (codebase, readiness). This breaks CUJ 4. Also, the start-screen blurb no longer exists in the new format.
16. **Removals are incomplete** (codebase). The removal list misses the `renderSwitch()` call inside `solve()`, the boot puzzle selection, the `#nextPuzzle` handler, the `.switch` CSS and the `level` in the eyebrow.
17. **Report links can't go inside the clue buttons** (codebase, readiness). A link inside a `<button>` is invalid HTML and would be wiped on every update. The picker also assumes exactly 10 clues.
18. **Self-solve flags and the sheet layout are undefined** (readiness). There's no field for them, and the number of columns varies with the clue count.
19. **Publish rules are open** (readiness). Does it read content only from the batch file? Does it overwrite an already-published future date? Who creates the first manifest? Are gaps allowed?
20. **Checker gaps** (readiness). It doesn't say where the repeat-check history comes from. Missing checks: `hash` matches the grid, the dates match, `schema` is 1, tags are valid, and GK sources are present.
21. **The state module can't save settings** (readiness). It never says how it detects unusable storage (Safari private mode), and old progress is only cleaned up when a puzzle is solved.
22. **`batch.json` at the repo root isn't git-ignored** (codebase). Readable answers could be committed by accident.
23. **Wording that can't be tested** (style). "Is correct" and "bad shapes are rejected" should state concrete inputs and expected outputs. The success metrics have no targets.
24. **One field has four names** (style): easy, easy clue, easier clue, Aasaan clue.

## Nits

* The FNV-1a variant and separator aren't stated. The format of `<hour>` isn't stated. `lib/*.js` files aren't cache-busted.
* `UnknownEncoding` isn't defined. It isn't said whether the app checks `file.hash`.
* "Reload the puzzle" is ambiguous. The visibility handler needs a branch for when the tab is shown again.
* `report-clue` is missing its `slot` property, and how often `storage-unavailable` fires isn't stated.
* Item 12 marks this doc as a file to create. Scheduled-run failure emails go to whoever last edited the cron, not to the repo owner.
* The npm script commands aren't given. Item 9 needs `exceljs` to read the sheet.
* The clue-mix ratio assumes exactly 10 clues. The audience wording differs (millennials vs Gen Z and millennials).
* Bullet styles are inconsistent. Remove the "Drafted with EGM" footer.
