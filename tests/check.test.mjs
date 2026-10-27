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

test("a missing easier clue fails", () => {
  const r = clone(samples[1]);
  delete r.clues["4A"].easy;
  assert.ok(errs([r]).some((x) => /4A \(SOUND\) is missing "easy"/.test(x)));
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

function publishTo(dir, recs, manifestDates = recs.map((r) => r.date)) {
  for (const r of recs) {
    const { title, constructor, grid } = r;
    const clues = Object.fromEntries(Object.entries(r.clues).map(([id, c]) => [id, { tag: c.tag, clue: c.clue, easy: c.easy, why: c.why }]));
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
