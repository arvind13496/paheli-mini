# 5x5 Mini filler. usage: fill5.py <banned file> <seed> <count> [SLOT=WORD ...]
import sys, random, json, time
from wordfreq import zipf_frequency, top_n_list
DESI = set("""
DHONI KOHLI KAPIL ROHIT SIXER GULLY STUMP BAILS ASHES DRAVID KUMBLE GOOGLY YORKER
NIRMA BAJAJ HUTCH VICKS ONIDA LIRIL RASNA MAAZA BOOST PULSE KITKAT FROOTI LIMCA VESPA ATLAS TITAN BATA DABUR PARLE AMUL
BINOD MEME EMOJI TROLL PAYTM SNAKE MARIO NOKIA REELS ORKUT YAHOO SELFIE VIRAL
GULLAK MUNNA SWAMI JETHA RAJU SHYAM VEERU GABBAR TARAK TINKLE
DHOOM BARFI QUEEN ROJA PIKU KABIR TAAL ANAND GUIDE HAIDER RAAZI SIMBA PUSHPA JAWAN
RAFI LATA ASHA SONU SITAR TABLA VEENA DHOLAK GHAZAL GARBA KATHAK
RAJMA LASSI KULFI CHAAT LADOO HALWA RASAM KHEER TIKKA RAITA MAGGI SAMOSA JALEBI PANEER MASALA PAKORA DHOKLA THEPLA MISAL APPAM SAMBAR RABRI MODAK PEDA KEBAB KORMA PULAO PAPAD ACHAR GHEE CHAI CURRY NIMBU JEERA HALDI MIRCH ADRAK BHINDI METHI KOKUM IMLI
DELHI PUNE AGRA PATNA KOCHI NOIDA AJMER KUTCH ASSAM BIHAR GANGA JAIPUR SHIMLA MANALI SIKKIM KERALA PUNJAB ODISHA INDORE BHOPAL KANPUR NASHIK RANCHI HAMPI YAMUNA THAR GOA LEH
ISRO RUPEE PAISA TIGER MANGO LOTUS ASHOKA
YAAR ACCHA ARRE DESI JUGAAD HAAN JALDI THANDA GARAM PAANI DOST BETA BABA DIDI CHALO SUNO BINDAAS PAKKA MASTI ADDA
TAPRI DHABA TONGA METRO DABBA TIFFIN KURTA DHOTI SAREE LUNGI JHOLA CHAPPAL MANDI MELA HAVELI BINDI MEHENDI PAGDI RANGOLI DIWALI HOLI RAKHI PATANG LATTU KANCHA
""".split())
BAD = set(open(sys.argv[1]).read().split())
seed = int(sys.argv[2]); count = int(sys.argv[3])
fixed = dict(a.split("=") for a in sys.argv[4:])
dictw = set(l.strip() for l in open("/usr/share/dict/words") if l.strip().islower())
def known(w):
    if w in dictw: return True
    for suf in ("s", "es", "ed", "d", "ing", "er"):
        if w.endswith(suf) and (w[:-len(suf)] in dictw or w[:-len(suf)] + "e" in dictw): return True
    return False
thr = {3: 3.9, 4: 3.5, 5: 3.2}
W = {}
for w in top_n_list("en", 60000):
    if w.isascii() and w.isalpha() and 3 <= len(w) <= 5 and known(w):
        z = zipf_frequency(w, "en")
        if z >= thr[len(w)]: W[w.upper()] = z
for w in DESI:
    if 3 <= len(w) <= 5: W[w] = max(W.get(w, 0), 4.6)
for w in list(W):
    if w in BAD: del W[w]
for v in fixed.values(): W.setdefault(v, 4.6)
S = {"1A": [(0,2),(0,3),(0,4)], "4A": [(1,c) for c in range(1,5)], "6A": [(2,c) for c in range(5)],
     "7A": [(3,c) for c in range(4)], "8A": [(4,c) for c in range(3)],
     "1D": [(r,2) for r in range(5)], "2D": [(r,3) for r in range(4)], "3D": [(r,4) for r in range(3)],
     "4D": [(r,1) for r in range(1,5)], "5D": [(r,0) for r in range(2,5)]}
idx = {}; bylen = {}
for w in W:
    bylen.setdefault(len(w), set()).add(w)
    for i, ch in enumerate(w): idx.setdefault((len(w), i, ch), set()).add(w)
rng = random.Random(seed)
def solve():
    grid = {}; asg = {}
    for k, v in fixed.items():
        asg[k] = v
        for p, ch in zip(S[k], v): grid[p] = ch
    def cands(k):
        s = S[k]; res = None
        for i, p in enumerate(s):
            if p in grid:
                x = idx.get((len(s), i, grid[p]), set()); res = x if res is None else res & x
                if not res: return set()
        return bylen[len(s)] if res is None else res
    def go():
        best = None; bc = None
        for k in S:
            if k in asg: continue
            c = cands(k) - set(asg.values())
            if not c: return False
            if best is None or len(c) < len(bc): best, bc = k, c
        if best is None: return True
        cl = sorted(bc, key=lambda w: -(W[w] + (1.5 if w in DESI else 0) + rng.random() * 2))[:80]
        for w in cl:
            new = [p for p in S[best] if p not in grid]
            for p, ch in zip(S[best], w): grid[p] = ch
            asg[best] = w
            if go(): return True
            del asg[best]
            for p in new: del grid[p]
        return False
    return asg if go() else None
seen = set(); out = 0; tries = 0
while out < count and tries < count * 60:
    tries += 1
    a = solve()
    if not a: continue
    key = tuple(sorted(a.values()))
    if key in seen: continue
    seen.add(key); out += 1
    sc = sum(W[w] + (1.5 if w in DESI else 0) for w in a.values()) / 10
    print(json.dumps({"score": round(sc, 2), "desi": [w for w in a.values() if w in DESI], "slots": a}), flush=True)
