# Paheli Mini: Clue Style Guide

Claude reads this guide before writing every batch, and Arvind can refer to it during review.

## Audience and voice

* Indian millennials first; Gen Z is welcome.
* The voice is a witty friend, not a quiz master. Clues should make people smile or groan, and every answer should feel fair once revealed.
* Write in English, with Hinglish where it's natural ("bas ek aur episode"). Answers use Roman letters only.

## Clue mix (per puzzle)

About 4 riddles (R), 3 desi GK (GK) and 3 nostalgia or internet clues (N) for a 10-clue puzzle. Keep the same proportions for other clue counts. The checker warns if more than half the clues share one tag.

* **R (Riddle):** a twist or double meaning, with one clean definition. *"Bread that got a tan, or a glass raised at the sangeet"* = TOAST.
* **GK (Desi GK):** Indian facts with a hook. Every GK clue needs a `source` link that Arvind can check. *"Kiran ___, director of Laapataa Ladies"* = RAO.
* **N (Pop, nostalgia and internet):** pop culture first. *"Yellow booth where you watched the meter tick on an STD call"* = PCO.

## The N clues: more pop, less family cliché

Updated 12 Nov after player feedback. Jokes about what uncle does at a shaadi felt cringe. Pop references land better.

Reach for:
* Bollywood and regional cinema: films, famous dialogues, characters, actors' roles (Phir Hera Pheri, Gangs of Wasseypur, Baahubali).
* TV and OTT: Shaktimaan, CID, KBC, Roadies, Panchayat, Kota Factory, Scam 1992.
* Music: Indipop, Coke Studio, indie artists, film soundtracks, antakshari. Use song and album titles, never lyrics.
* Cricket and sport: IPL, famous matches and moments, commentary lines.
* Ads, brands and logos: Hutch's pug, Amul's girl, Fevicol, Cadbury's cricket-field dance.
* Internet and memes: Orkut, Binod, "Rasode mein kaun tha", YouTube and creators, BGMI, UPI, reels.
* Mix the eras: 90s and 2000s childhood alongside things from the 2020s.

Ease off:
* Relatives as the punchline (uncle, aunty, Mummy, Dadi) and wedding or sangeet jokes. At most one family clue per puzzle, and never the uncle-at-the-shaadi joke.
* Generic "desi household" observations with no specific reference behind them. A clue should point at a real show, film, ad, brand, song or meme whenever it can.

## Every clue needs two texts

* `clue`: the main clue.
* `why`: one line shown after solving that explains the answer. This is where trivia lives, and it may use the answer.

## Hard rules (the checker enforces these)

* An answer never appears as a whole word in its own clue or the puzzle title.
* Titles never contain any answer from the grid.
* No answer repeats within 14 days either side of its date, and no word appears twice in one grid.
* Grids are 5x5. Every white square belongs to both an Across and a Down answer, and every answer has at least 3 letters.
* Before writing, get the used-answer list with `node tools/check.mjs --used` and avoid those answers.

## Avoid

* Party politics, religion and caste. Light civic GK, like capitals or national symbols, is fine.
* Anything mean about a group of people.
* Facts that can't be sourced, and dates or awards you aren't sure of.
* Obscure fill. If an answer is a crossword staple that nobody uses in real life, change the grid.

## Spelling

Use the common spellings: CHAI, ACCHA, MAGGI, DOSA, SAMOSA, JALEBI, YAAR. Known wrong spellings are in `data/misspellings.txt`.

## Batch file

Write `batches/<id>.json` in the format given in the design doc, §1. Constructor is "Arvind Lakhani". Titles are 1 to 3 words.
