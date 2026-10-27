# Stage 7: Critic Report

**Target:** `docs/designs/daily-puzzle-system.md` lines 1-464 · **Reviewers:** egm-design (feature-spec-standard), egm-structural (feature-spec-standard), egm-style

The doc covers the problem, goals, architecture and alternatives well. Its weak points are untested assumptions about how GitHub behaves, the review pipeline, and the lack of a single risks section.

## Blocker

1. **The checker reports bad files but doesn't block them** (design). GitHub Pages publishes straight from `main`, so a push goes live while `check.yml` is still running. "No broken puzzle reaches players" is only monitored, never enforced. Nothing checks that every manifest date has a file. *Fix:* deploy Pages through an Actions workflow that publishes only after the check passes. Also run the checker inside `publish.mjs` before pushing, and add a check that the manifest and files match.

## Major

2. **There's no Risks & Mitigations section and no success thresholds** (design, structural, style). Risks are scattered or missing:
   - iOS storage clearing and the WhatsApp in-app browser
   - Umami or GitHub Pages going down
   - wrong GK facts
   - byline backlash
   - several tabs overwriting each other's saves

   The doc says success is "judged at 3 months" but gives no numbers. Cookie-free Umami can't measure returning players directly, so the streak value is the only stand-in.
3. **The review-time goal isn't realistic** (design). About 900 texts in under an hour works out to roughly 4 seconds each. *Fix:* put GK clues and their sources first, let the checker and self-solve cover easier clues and "why" lines, and set an honest time budget.
4. **Publishing from the returned spreadsheet can push unreviewed text live** (design). Excel autocorrect, smart quotes or accidental edits would be published. The readable source has no permanent home, and `review/` isn't listed in `.gitignore` in the plan. *Fix:* keep a local `work/batch-<id>.json` that git ignores. Have `publish.mjs` read only the Status column, take the content from the JSON, and refuse to publish if the sheet's text differs.
5. **The alarm can switch itself off** (design, style). GitHub disables `daily.yml` after 60 days with no commits, and 60 pre-launch puzzles make exactly that gap possible. Nobody is named to send the "reminder", and scheduled-run failure emails depend on notification settings. *Fix:* use a free outside uptime check on `puzzles/<today>.json`, or have the workflow commit a small keep-alive.
6. **The "running late" state, late publishing and streaks conflict** (design, structural):
   - A date that's in the manifest but whose file fails to load breaks streaks.
   - A file added later in the day breaks streaks for players who already left.
   - An open tab never re-checks for a late file.
   - Being offline looks the same as "late".

   *Fix:* pick a rule, either "a missed midnight means a skipped day" or late publishing that is defined and polled, and show a separate network-error state.
7. **The midnight carry-over has no time limit** (design). Starting yesterday's puzzle at 23:59 and finishing it days later keeps a streak alive, which becomes a backdoor archive. Reload behaviour isn't defined. *Fix:* set a cutoff.
8. **CUJ 4 promises to handle a wrong phone clock, but the design can't** (design, structural). Rename it to cover time zones only, and define what shows before launch day and after the buffer runs out.
9. **One storage key means tabs overwrite each other** (design). A stale second tab can wipe a solve another tab just saved. *Fix:* re-read and merge solves by date on every write, or use separate keys.
10. **`index.html` can't cache-bust itself, and modules can be out of step after a deploy** (design, structural). *Fix:* add a version query to module imports, for example `lib/grid.js?v=<APP_VERSION>`, and drop the `index.html` claim.
11. **Report a clue has two entry points** (structural). The goal and CUJ 5 say result card only, but section 4 adds per-clue links. Pick one.
12. **The repeat check only looks backwards, and matching is undefined** (design). It should cover 30 days either side, including the buffer and the same batch, and match whole words regardless of case.
13. **Share attribution won't work as written** (design). Umami reads `utm_*` parameters, not `?s=`. *Fix:* use `?utm_source=whatsapp&utm_medium=share`, then remove it from the address bar with `history.replaceState`.
14. **Additional Resources and Future Improvements are nested under the wrong heading** (structural, style). Promote both to H2.
15. **Absolute claims contradict other parts of the doc** (style):
    - "Never edited" vs the `[emergency-edit]` path.
    - "Can't miss a midnight" vs CUJ 7.
    - "Nothing personal leaves the device": Umami sees IP addresses, and report emails show the sender's address.
16. **One concept has many names** (style): easier clue, Aasaan clue, `easy`, hints, help, madad. Define each once.
17. **Decisions are cited but not recorded** (style): "as agreed", "Arvind accepted". Add an Accepted Risks list and name `concepts_brief.md`.
18. **"There is no Indian take on the daily mini" is an unverified absolute claim** (style).
19. **Shared code is described inconsistently** (style). The intro says one shared module, but tools import two.

## Nits

- The example title "Spill the Tea" contains the answer TEA (design, comprehension).
- The emergency-edit text says the fingerprint changes even for clue-only fixes (design, structural).
- Clue, title and "why" text from fetched files must be rendered as text, not inserted as HTML. Encode mailto parameters (design).
- Strip `batch` and `source_note` before scrambling the published file (design).
- Umami: nothing actually alerts at 80% of the cap, data is kept for only 6 months, and the source of `v` isn't defined (design).
- Fetch the manifest and today's puzzle in parallel, and don't let fonts block the start screen (design).
- Record the declined byline-disclosure concern as an accepted risk (design).
- Note what happens to 60 pre-dated puzzles if the launch date moves (design).
- Make CUJ formatting, the Alternatives structure and horizontal rules consistent. Label code fences as `json` (structural).
- Use real Markdown links for the brief, repo and live site, and mark `docs/clue-style.md` "to be created" (structural).
- `tools/make-sheet` is missing its extension. The Goals checker list is partial, and the dateline change is missing (structural).
- Wording: define UI terms like "Shuru karo" and "Shatabdi pace", say "adds no running cost", source the GitHub delay figure, relabel F as "Deferred", and remove "Simplest possible" and "It's tiny" (style).
