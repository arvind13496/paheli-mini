import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkBatch, checkPublished } from "../tools/check.mjs";
import { encode } from "../lib/codec.js";

const TODAY = "2025-12-01";
const samples = JSON.parse(fs.readFileSync(new URL("./fixtures/samples.json", import.meta.url))).records;
const clone = (o) => JSON.parse(JSON.stringify(o));
const errs = (records, published = []) => checkBatch(records, published, TODAY, new Map()).errors;

test("samples 2 and 3 are clean", () => {
  assert.deepEqual(errs([samples[1], samples[2]]), []);
});

test("sample 1 fails only on its title", () => {
  const e = errs([samples[0]]);
  assert.equal(e.length, 1);
  assert.match(e[0], /Title "Spill the Tea" contains the answer TEA/);
});

test("answer in its own clue fails, ignoring case", () => {
  const r = clone(samples[1]);
  r.clues["1A"].clue = "Kiran rao directed this";
  assert.ok(errs([r]).some((x) => /RAO appears in its own clue/.test(x)));
});

test("matching is whole-word only", () => {
  const r = clone(samples[1]);
  r.clues["8A"].clue = "Beta, who will marry later or sooner"; // SON inside "sooner"
  assert.deepEqual(errs([r]), []);
});

test("the same word twice in one grid fails", () => {
  const r = clone(samples[2]);
  r.grid = ["CAT##", "ARE##", "TEA##", "#####", "#####"];
  r.clues = {};
  assert.ok(errs([r]).some((x) => /CAT appears twice/.test(x)));
});

test("a repeat 10 days apart fails", () => {
  const a = clone(samples[1]);
  const b = clone(samples[2]);
  b.date = "2026-01-11"; // SRI is in both, 10 days after sample 2
  assert.ok(errs([a, b]).some((x) => /SRI was also used/.test(x)));
});

test("a missing why line fails", () => {
  const r = clone(samples[1]);
  delete r.clues["4A"].why;
  assert.ok(errs([r]).some((x) => /4A \(SOUND\) is missing "why"/.test(x)));
});

test("a missing easier clue fails", () => {
  const r = clone(samples[1]);
  delete r.clues["4A"].easy;
  assert.ok(errs([r]).some((x) => /4A \(SOUND\) is missing "easy"/.test(x)));
});

test("answer in its own easier clue fails", () => {
  const r = clone(samples[1]);
  r.clues["4A"].easy = "Rhymes with sound";
  assert.ok(errs([r]).some((x) => /SOUND appears in its own easier clue/.test(x)));
});

test("a GK clue with no source fails", () => {
  const r = clone(samples[1]);
  r.clues["1A"].source = "";
  assert.ok(errs([r]).some((x) => /GK clue with no source/.test(x)));
});

test("a 2-letter slot fails", () => {
  const r = clone(samples[1]);
  r.grid = ["AB###", "CD###", "#####", "#####", "#####"];
  assert.ok(errs([r]).length > 0);
});

test("a date on or before today fails", () => {
  const r = clone(samples[1]);
  r.date = TODAY;
  assert.ok(errs([r]).some((x) => /must be after today/.test(x)));
});

test("already-published records are skipped in batch mode", () => {
  const res = checkBatch([samples[1]], [{ date: samples[1].date, record: samples[1] }], TODAY, new Map());
  assert.deepEqual(res.skipped, [samples[1].date]);
  assert.deepEqual(res.errors, []);
});

function publishTo(dir, recs, manifestDates = recs.map((r) => r.date), { dropEasy = false } = {}) {
  for (const r of recs) {
    const { title, constructor, grid } = r;
    const clues = Object.fromEntries(Object.entries(r.clues).map(([id, c]) => [id, dropEasy ? { tag: c.tag, clue: c.clue, why: c.why } : { tag: c.tag, clue: c.clue, easy: c.easy, why: c.why }]));
    fs.writeFileSync(path.join(dir, `${r.date}.json`), JSON.stringify({ schema: 1, date: r.date, data: encode({ title, constructor, grid, clues }) }));
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ launch: [...manifestDates].sort()[0], dates: manifestDates }));
}

test("published mode passes with past dates and no date rules", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paheli-"));
  publishTo(dir, [samples[1], samples[2]]);
  assert.deepEqual(checkPublished(dir, { today: "2026-03-01" }).errors, [], "GK sources are stripped from published files and not required");
});

test("published mode fails on a manifest/file mismatch", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paheli-"));
  publishTo(dir, [samples[1]], [samples[1].date, "2026-01-02"]);
  assert.ok(checkPublished(dir, { today: "2026-03-01" }).errors.some((x) => /2026-01-02/.test(x)));
});

test("buffer check fails with only 2 future dates", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paheli-"));
  publishTo(dir, [samples[1], samples[2]]);
  const res = checkPublished(dir, { today: "2025-12-31", buffer: 3 });
  assert.ok(res.errors.some((x) => /Only 2 future day/.test(x)));
  assert.ok(!res.errors.some((x) => /No puzzle published for today/.test(x)), "before launch, today may be missing");
});

test("published puzzles need an easier clue only from EASY_FROM on", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paheli-easy-"));
  const before = { ...clone(samples[1]), date: "2026-10-20" };
  const after = { ...clone(samples[2]), date: "2026-11-13" };
  publishTo(dir, [before, after], undefined, { dropEasy: true });
  const e = checkPublished(dir, { today: "2026-11-12" }).errors;
  assert.ok(e.some((x) => /^2026-11-13: .* is missing "easy"/.test(x)), "13 Nov without easier clues fails");
  assert.ok(!e.some((x) => /^2026-10-20: /.test(x)), "a puzzle from before the cutoff is fine without easier clues");
  publishTo(dir, [before, after]);
  assert.deepEqual(checkPublished(dir, { today: "2026-11-12" }).errors, []);
});

// ---------- levels (Midi 7x7, Complex 9x9) ----------
const levels = JSON.parse(fs.readFileSync(new URL("./fixtures/levels.json", import.meta.url))).records;

test("a 7x7 Midi and a 9x9 Complex with cryptic clues pass", () => {
  assert.deepEqual(errs(levels.map(clone)), []);
});

test("a Mini must be 5x5, and a Midi 7x7", () => {
  const mini = clone(levels[0]); delete mini.level;
  assert.ok(errs([mini]).some((x) => /Grid must have 5 rows/.test(x)));
  const wrong = { ...clone(levels[1]), level: "midi" };
  assert.ok(errs([wrong]).some((x) => /Grid must have 7 rows/.test(x)));
});

test("the cryptic tag is only allowed in a Complex", () => {
  const r = clone(levels[0]); r.clues["1A"].tag = "C";
  assert.ok(errs([r]).some((x) => /1A has an invalid tag "C"/.test(x)));
});

test("across levels on the same day, 4+ letter answers can't repeat but short ones can", () => {
  const midi = clone(levels[0]), complex = { ...clone(levels[1]), date: levels[0].date };
  assert.deepEqual(errs([midi, complex]), [], "THE and TEN (3 letters) may appear in both");
  complex.grid[6] = "ACHAR#SON"; // 20A becomes ACHAR, which the Midi also has
  assert.ok(errs([midi, complex]).some((x) => /ACHAR is also in the midi puzzle on the same day/.test(x)));
});

test("a Mini and a Midi may share a date", () => {
  const mini = { ...clone(samples[1]), date: levels[0].date };
  assert.ok(!errs([mini, clone(levels[0])]).some((x) => /appears twice/.test(x)));
});

// ---------- per-level feed: puzzles/<level>/<date>.json and manifest.levels ----------
import { publish } from "../tools/publish.mjs";
import { loadPublished, levelManifest } from "../tools/check.mjs";

function levelBatch(dir) {
  const mini = { ...clone(samples[1]), date: "2026-12-01" };
  const midi = { ...clone(levels[0]), date: "2026-12-01" };
  const midi2 = { ...clone(levels[0]), date: "2026-12-20", title: "Second Midi" };
  const complex = { ...clone(levels[1]), date: "2026-12-02" };
  const file = path.join(dir, "batch.json");
  fs.writeFileSync(file, JSON.stringify({ batch: "t", records: [mini, midi, midi2, complex] }));
  return file;
}

test("publish --checked writes each level to its own folder and manifest entry", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paheli-"));
  const puzzlesDir = path.join(dir, "puzzles");
  const r = await publish(levelBatch(dir), null, { today: "2026-11-20", puzzlesDir });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.published, ["2026-12-01", "midi 2026-12-01", "midi 2026-12-20", "complex 2026-12-02"]);
  const m = JSON.parse(fs.readFileSync(path.join(puzzlesDir, "manifest.json"), "utf8"));
  assert.deepEqual({ launch: m.launch, dates: m.dates }, { launch: "2026-12-01", dates: ["2026-12-01"] }, "Mini stays at the top level");
  assert.deepEqual(m.levels, { midi: { launch: "2026-12-01", dates: ["2026-12-01", "2026-12-20"] }, complex: { launch: "2026-12-02", dates: ["2026-12-02"] } });
  assert.ok(fs.existsSync(path.join(puzzlesDir, "midi", "2026-12-01.json")) && fs.existsSync(path.join(puzzlesDir, "complex", "2026-12-02.json")));
  const loaded = loadPublished(puzzlesDir);
  assert.deepEqual(loaded.entries.map((e) => `${e.level || "mini"} ${e.date} ${e.record.grid.length}`), ["mini 2026-12-01 5", "midi 2026-12-01 7", "midi 2026-12-20 7", "complex 2026-12-02 9"]);
  assert.deepEqual(checkPublished(puzzlesDir, { today: "2026-11-20" }).errors, []);
  // Publishing again skips everything, level by level.
  const again = await publish(path.join(dir, "batch.json"), null, { today: "2026-11-20", puzzlesDir });
  assert.equal(again.published.length, 0);
  assert.equal(again.alreadyPublished.length, 4);
});

test("the buffer check runs per level, and a paused level is ignored", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paheli-"));
  const puzzlesDir = path.join(dir, "puzzles");
  await publish(levelBatch(dir), null, { today: "2026-11-20", puzzlesDir });
  const e = checkPublished(puzzlesDir, { today: "2026-12-02", buffer: 1 }).errors;
  assert.ok(e.some((x) => /^midi: No puzzle published for today/.test(x)));
  assert.ok(e.some((x) => /^complex: Only 0 future/.test(x)));
  assert.ok(!e.some((x) => /^complex: No puzzle published for today/.test(x)));
  // Pause Complex: take it out of the manifest and leave its files.
  const mp = path.join(puzzlesDir, "manifest.json");
  const m = JSON.parse(fs.readFileSync(mp, "utf8")); delete m.levels.complex;
  fs.writeFileSync(mp, JSON.stringify(m));
  assert.ok(!checkPublished(puzzlesDir, { today: "2026-12-02", buffer: 1 }).errors.some((x) => /complex/.test(x)));
  assert.deepEqual(levelManifest(m, "complex"), { launch: null, dates: [] });
});

test("published mode flags a level file missing from the manifest", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paheli-"));
  const puzzlesDir = path.join(dir, "puzzles");
  await publish(levelBatch(dir), null, { today: "2026-11-20", puzzlesDir });
  const mp = path.join(puzzlesDir, "manifest.json");
  const m = JSON.parse(fs.readFileSync(mp, "utf8")); m.levels.midi.dates = ["2026-12-01"];
  fs.writeFileSync(mp, JSON.stringify(m));
  assert.ok(checkPublished(puzzlesDir, { today: "2026-11-20" }).errors.some((x) => /puzzles\/midi\/2026-12-20\.json is not in the manifest/.test(x)));
});
