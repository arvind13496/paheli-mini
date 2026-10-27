# Manual checklist

Run on a phone (390 px wide) and on desktop. For local checks, run `python3 -m http.server` in the repo, then open `http://localhost:8000/?date=YYYY-MM-DD`.

## Every release
- [ ] The day before launch (`?date=2026-10-28`) shows "Paheli Mini starts Thursday, 29 October" with a countdown.
- [ ] Today's puzzle shows "Paheli Mini #N", the title, "By Arvind Lakhani" and "Shuru karo".
- [ ] The masthead shows the India date.
- [ ] Solving shows the result card with:
  - [ ] time, speed tag and help line
  - [ ] Streak N · Best N
  - [ ] "Saved on this browser"
  - [ ] the "Next paheli in" countdown
- [ ] Reloading after solving shows the result card again, with the grid filled in.
- [ ] Solving the next day's date shows streak 2.
- [ ] Reloading mid-solve offers Resume, with the time kept.
- [ ] A date that isn't published shows "running late". Typing on that screen does nothing and logs no console errors.
- [ ] In offline mode (devtools), Retry appears.
- [ ] Autocheck, check, reveal and clear all work. A revealed square shows the red corner.
- [ ] "Aasaan clue" swaps in the easier clue.
- [ ] A private window shows "Streaks can't be saved in this browser", and the share text has no streak.
- [ ] With two tabs open, solving in one tab doesn't erase the other's solve.

## Live site only
- [ ] The WhatsApp and Copy share texts end with the site link.
- [ ] "Report a clue" opens an email to arv.experiments@gmail.com with the subject "Paheli Mini #N (date): clue report".
- [ ] Opening `?utm_source=whatsapp&utm_medium=share` gives exactly one visit in Umami with source "whatsapp", and the address bar is cleaned.
- [ ] `puzzle-start`, `puzzle-solve` and `share-whatsapp` appear in Umami Realtime within 10 minutes.
