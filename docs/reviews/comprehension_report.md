# Stage 6: Comprehension Report

**Target:** `docs/designs/daily-puzzle-system.md` (Feature 1-464, Detailed 465-692) · **Reviewer:** egm-comprehension · **Standard:** re-implementation-standard

A newcomer can follow the reasoning, but the doc doesn't yet meet the "build it with zero assumptions" bar. Several formats are left for the builder to invent, and the doc contradicts its own examples in places.

## Blockers

1. **The sample title breaks the doc's own rule.** "Spill the Tea" contains TEA, an answer in the same grid, but the checker must reject any title containing an answer. The rule for what counts as a match isn't defined: whole word or part of a word, and whether case matters. *Fix:* define the matching rule and fix the example.
2. **"Answer in its own clue" and "no repeat in 30 days" are underspecified.**
   - With a part-of-word rule, ATE would match "later" and SON would match "reason".
   - It doesn't say whether the same word twice in one grid is allowed. A test expects it to be valid.
   - It doesn't say where the checker gets the last 30 days, or what happens to repeats inside one batch.
   - The 30-day and 60-day windows don't match and aren't explained.
3. **The Hinglish rule can't be built as written.** No English word list is named, and the sample abbreviations and names (PCO, OTT, STD, VHS, RAO, SRI) would fail.
4. **The batch and sheet formats aren't defined.**
   - The record is shown in pseudo-syntax rather than exact JSON, and `batch.json` is never specified.
   - Checker warnings and self-solve flags have no fields to live in.
   - It's unclear whether clue edits typed into the sheet get published or ignored.
   - The sheet's date format isn't given.
5. **What a returning player sees after solving isn't defined.** Progress is deleted on solve, so the doc must say whether they get the start screen, a filled grid or the result card.

## Major

6. The byte-level details of the scrambling are open: how the key becomes bytes, which base64 variant to use and how to produce it in the browser, and the error type and its message.
7. The grid fingerprint is ambiguous: hash width, separator, encoding and hex case. The checker should also confirm each file's `hash` matches its grid.
8. The launch date has two sources of truth (`LAUNCH_DATE` and `manifest.launch`).
9. Startup error handling is incomplete. Being offline shows "running late". A missing puzzle file, a 404 or malformed JSON have no defined screen or event.
10. Cache-busting is described inconsistently: `index.html` can't bust itself, and the `<today><hour>` format is undefined.
11. Midnight handling has gaps. The current visibility handler only pauses, "in progress" isn't defined, and the countdown is wrong after a past-midnight finish.
12. The progress format is missing `usedAuto` and `solved`, doesn't give units for `elapsed` and `at`, and conflicts with the prototype's hint id format ("A1" vs "1A").
13. The per-puzzle blurb is dropped without a decision, and the header dateline still uses the phone's time zone.
14. It isn't specified how Umami attributes visits from shares, or whether `?s=` is removed from the address bar.
15. The share text doesn't cover the help line wording, what the streak shows when storage is unavailable, or how the Copy and WhatsApp versions differ.
16. Report a clue: the picker assumes 10 slots, the email body promises more than the template contains, and it isn't said when the event fires.
17. **JavaScript trap:** every JS object has a built-in `constructor` property, so a check that the field exists always passes. Check for a string field of its own, or rename it.
18. The module count is inconsistent (2 vs 4), and switching to `<script type="module">` isn't stated.
19. The CI guard: `github.event.before` is missing on pull requests and all zeros on a first push, `npm ci` needs a lockfile that isn't listed, and `[emergency-edit]` is ambiguous when a push holds several commits.
20. The end-to-end setup doesn't say how test puzzles replace real ones, and Playwright isn't a listed dependency.

## Nits

21. The streak rule doesn't say what happens when the manifest is unavailable, or with solves on dates outside it.
22. The countdown format for under an hour isn't defined.
23. How often `storage-unavailable` fires, and what the `streak` value means, aren't stated.
24. It doesn't say whether re-publishing a future date overwrites it, or whether removing a past date from the manifest is guarded.
25. It doesn't say how the checker tells plaintext files from published ones, or how it treats `manifest.json`.
26. "Arvind is reminded to push an empty commit" doesn't say who or what reminds him.
27. Some terms are undefined: EGM, FNV-1a, the R / GK / N clue tags, and the Hindi UI strings.
28. The example puzzle number "#12 · 15 Nov" contradicts the launch date of 15 Nov. Also state that numbers skip on missing days.
29. The README should point to the design doc.
