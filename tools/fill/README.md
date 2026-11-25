# Grid filler

Fills Paheli grids (5x5 Mini, 7x7 Midi, 9x9 Mega) with real words, preferring desi words.

**Setup, once:**
```bash
python3 -m venv .venv && .venv/bin/pip install wordfreq==3.1.1
```

**Fill** (each named template in turn; every chosen grid's words are banned for the next):
```bash
THR=0.3 .venv/bin/python tools/fill/fillg.py tools/fill/templates.json midi0,midi1,midi2 banned.txt 1 4 10 out.jsonl
```
Arguments: templates file, template names, banned-words file, seed, seconds per try, tries per grid, output file.

**Files**
- `templates.json`: block patterns. Midi and Mega layouts come from weeks 1 to 3; the 9x9 `mega1`, `mega3` and `mega5` fill most cleanly.
- `desi.txt`: desi words that get a bonus.
- `allow3.txt`: the only 3-letter words allowed.
- `badx.txt`: words never to use (names, abbreviations, weak fill, anything off-tone). Add to it whenever a grid shows a bad word.

**Banned file:** build it from every answer published within 14 days either side of the new dates, plus `badx.txt`:
```bash
node tools/check.mjs --used
```
That prints the answers used around today.

**Always** read the output by eye before writing clues. The filter blocks most junk, but names and odd words still slip through.
