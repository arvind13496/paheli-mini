# Grid filler for Paheli (any size). Setup once: python3 -m venv .venv && .venv/bin/pip install wordfreq==3.1.1
# Run: .venv/bin/python tools/fill/fillg.py tools/fill/templates.json <names> <banned file> <seed> <secs> <tries> <out.jsonl>
# Env THR lowers the word-frequency cutoff (0 strict; 0.3 for 7x7; 0.5 to 0.6 for 9x9).
# The output still needs a human-quality pass: drop grids with names, abbreviations or weak words, and add them to badx.txt.
# General filler. usage: fillg.py <templates.json> <names,comma> <banned file> <seed> <secs per try> <tries per grid> <out.jsonl>
# Fills each named template in turn; each pick bans its words for the next.
import sys, json, random, time, os
from wordfreq import zipf_frequency, top_n_list
T = json.load(open(sys.argv[1])); names = sys.argv[2].split(","); ban = set(open(sys.argv[3]).read().split())
seed = int(sys.argv[4]); secs = float(sys.argv[5]); tries = int(sys.argv[6]); out = sys.argv[7]
DESI = set(open(os.path.join(os.path.dirname(__file__) or ".", "desi.txt")).read().split())
dictw = set(l.strip() for l in open("/usr/share/dict/words") if l.strip().islower())
def known(w):
    if w in dictw: return True
    for suf in ("s", "es", "ed", "d", "ing", "er", "ly"):
        if w.endswith(suf) and (w[:-len(suf)] in dictw or w[:-len(suf)] + "e" in dictw): return True
    return False
sh = float(os.environ.get("THR", "0"))
thr = {3: 3.9 - sh, 4: 3.5 - sh, 5: 3.2 - sh, 6: 3.1 - sh, 7: 3.0 - sh, 8: 2.9 - sh, 9: 2.8 - sh}
W0 = {}
for w in top_n_list("en", 90000):
    if w.isascii() and w.isalpha() and 3 <= len(w) <= 9 and known(w):
        z = zipf_frequency(w, "en")
        if z >= thr[len(w)]: W0[w.upper()] = z
for w in DESI:
    if 3 <= len(w) <= 9: W0[w] = max(W0.get(w, 0), 4.6)
A3 = set(open(os.path.join(os.path.dirname(__file__) or ".", "allow3.txt")).read().split())
BADX = set(open(os.path.join(os.path.dirname(__file__) or ".", "badx.txt")).read().split())
for w in list(W0):
    if (len(w) == 3 and w not in A3) or w in BADX: del W0[w]
# Proper nouns (names, places) only allowed via the DESI list; offensive stems blocked outright.
ALLDICT = [l.strip() for l in open("/usr/share/dict/words") if l.strip()]
LOWER = set(w for w in ALLDICT if w.islower())
PROPER = set(w.lower() for w in ALLDICT if w[:1].isupper()) - LOWER
import glob
NAMES = set()
for f in glob.glob("/usr/share/dict/propernames") + glob.glob("/usr/share/dict/connectives"):
    if f.endswith("propernames"): NAMES |= set(l.strip().upper() for l in open(f) if l.strip())
STEMS = ("NIGG", "FAGG", "DILDO", "NIPPL", "PUBES", "PUBIC", "PENIS", "VAGIN", "RAPIS", "SLUT", "WHORE", "PORN", "BOOB", "PISS", "SHIT", "FUCK", "RETARD", "BIGOT", "MURDER", "SUICID", "NAZI", "ORGASM", "SEMEN", "SPERM", "EROTIC", "BASTARD", "BITCH", "SATAN", "TERROR", "JIHAD", "COCAIN", "HEROIN", "MARIJ", "RACIS", "NEGRO", "TRANNY", "MASJID", "SEXU", "SEXY", "NUDIS", "HAREM", "OPIUM", "CORPSE", "INBRED")
WHOLE = set("""HELL DAMN DEAD DEATH DIE DIED DIES LUST WEED BEER BEERS GITA BUTT BUTTS ANAL TITS HOMO GYP JAP WOP SPIC COON KIKE PAKI SEX CASTE DALIT DRUG DRUGS KILL KILLS KILLED BOMB BOMBS COCK COCKS DICK DICKS SLAVE SLAVES SLAVERY RAPE RAPED RAPES NUDE NUDES WOMB WOMBS PIMP HOOKER DEVIL DEVILS MORON MORONS IDIOT IDIOTS DRUNK BOOZE GUN GUNS WAR WARS HINDU MUSLIM CHRIST JESUS ALLAH MOSQUE CHURCH TEMPLE PRIEST PRIESTS SYNOD GOSPEL GOSPELS BIBLE KORAN QURAN FAG FAGS QUEER LESBIAN GAY GAYS""".split())
for w in list(W0):
    if w in DESI: continue
    if w.lower() in PROPER or w in NAMES or w in WHOLE or any(w.startswith(x) for x in STEMS): del W0[w]
for w in A3:
    if len(w) == 3 and w not in W0 and w not in BADX: W0[w] = 4.0
def slots_of(t):
    n = len(t); S = []
    for r in range(n):
        c = 0
        while c < n:
            if t[r][c] != "#":
                s = c
                while c < n and t[r][c] != "#": c += 1
                if c - s >= 2: S.append([(r, k) for k in range(s, c)])
            else: c += 1
    for c in range(n):
        r = 0
        while r < n:
            if t[r][c] != "#":
                s = r
                while r < n and t[r][c] != "#": r += 1
                if r - s >= 2: S.append([(k, c) for k in range(s, r)])
            else: r += 1
    return S
rng = random.Random(seed)
def fill(t, W, deadline):
    S = slots_of(t); idx = {}; bylen = {}
    for w in W:
        bylen.setdefault(len(w), set()).add(w)
        for i, ch in enumerate(w): idx.setdefault((len(w), i, ch), set()).add(w)
    grid = {}; asg = {}
    def cands(k):
        s = S[k]; res = None
        for i, p in enumerate(s):
            if p in grid:
                x = idx.get((len(s), i, grid[p]), set()); res = x if res is None else res & x
                if not res: return set()
        return bylen.get(len(s), set()) if res is None else res
    def go():
        if time.time() > deadline: return None
        best = None; bc = None
        for k in range(len(S)):
            if k in asg: continue
            c = cands(k) - set(asg.values())
            if not c: return False
            if best is None or len(c) < len(bc): best, bc = k, c
            if len(c) == 1: break
        if best is None: return True
        cl = sorted(bc, key=lambda w: -(W[w] + (1.5 if w in DESI else 0) + rng.random() * 2))[:50]
        for w in cl:
            new = [p for p in S[best] if p not in grid]
            for p, ch in zip(S[best], w): grid[p] = ch
            asg[best] = w
            r = go()
            if r: return True
            if r is None: return None
            del asg[best]
            for p in new: del grid[p]
        return False
    if not go(): return None
    n = len(t)
    return ["".join(grid.get((r, c), "#") for c in range(n)) for r in range(n)], [asg[i] for i in range(len(S))]
used = set(ban)
for name in names:
    t = T[name]; W = {w: z for w, z in W0.items() if w not in used}
    best = None
    for _ in range(tries):
        r = fill(t, W, time.time() + secs)
        if not r: continue
        g, ws = r
        if any(w + "S" in ws or w + "ES" in ws or w + "ED" in ws for w in ws): continue
        sc = sum(W[w] + (1.5 if w in DESI else 0) for w in ws) / len(ws)
        if best is None or sc > best[0]: best = (sc, g, ws)
    if not best: print("FAILED", name, flush=True); continue
    used |= set(best[2])
    rec = {"template": name, "score": round(best[0], 2), "grid": best[1], "words": best[2], "desi": [w for w in best[2] if w in DESI]}
    open(out, "a").write(json.dumps(rec) + "\n")
    print(name, rec["score"], " ".join(best[2]), rec["desi"], flush=True)
