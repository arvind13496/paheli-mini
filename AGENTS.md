# Paheli web: instructions for coding agents

> **Before any work, read `docs/STATUS.md` in arvind13496/paheli-mini (main branch). It is the source of truth for decisions, what's live and work in flight. Don't redo listed work; ask Arvind if a task conflicts with it. When you finish, update the iOS rows of that file through a pull request to paheli-mini, or give Arvind the update to pass on.**

Several Claude chats and Claude Code sessions work on Paheli at the same time, without seeing each other's conversations. To avoid duplicate or conflicting work:

1. **Read `docs/STATUS.md` before doing anything.** It lists what's live, who owns which part, work in flight, decisions and open questions. Also check open pull requests and `git log` since its "Last updated" date.
2. **Don't redo listed work.** If your task is already in flight or decided, build on that. If it conflicts with a decision or another lane, ask Arvind first.
3. **Claim your work** by adding a row to "In flight" before you start.
4. **Update `docs/STATUS.md` in the same pull request as your work**: what's live, in flight, decisions, open questions, "Last updated".
5. Changes go in through pull requests. Arvind merges. Ask before pushing, publishing or anything outward-facing.

Project basics: the app is `index.html` with `lib/`; puzzles live in `puzzles/` with tools in `tools/`; `npm test` runs the tests (Node 22+). Designs are in `docs/designs/`, clue rules in `docs/clue-style.md`. When the app changes, bump `APP_VERSION` and the `?v=` imports together.
