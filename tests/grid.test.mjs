import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildPuzzle, validateShape, gridHash } from "../lib/grid.js";

const samples = JSON.parse(fs.readFileSync(new URL("./fixtures/samples.json", import.meta.url)));

test("sample puzzles number like the prototype", () => {
  samples.records.forEach((rec, i) => {
    const { slots } = buildPuzzle(rec.grid, rec.clues);
    assert.deepEqual(slots.map((s) => `${s.id}:${s.answer}`), samples.expectedSlots[i]);
    for (const s of slots) assert.ok(s.clue && s.easy && s.why, `clue fields attached for ${s.id}`);
  });
});

test("cellSlots maps every white square to its Across and Down slots", () => {
  const { cells, cellSlots } = buildPuzzle(samples.records[0].grid);
  cells.forEach((c, i) => {
    if (c.block) return;
    assert.ok(cellSlots[i].A && cellSlots[i].D, `square ${i}`);
  });
});

test("the same word twice gets two separate slot ids", () => {
  const { slots } = buildPuzzle(["CAT##", "ARE##", "TEA##", "#####", "#####"]);
  const ids = slots.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(slots.filter((s) => s.answer === "CAT").map((s) => s.id), ["1A", "1D"]);
});

test("validateShape accepts the samples", () => {
  for (const rec of samples.records) assert.deepEqual(validateShape(rec.grid), []);
});

test("validateShape rejects bad shapes", () => {
  assert.ok(validateShape(["ABCD", "ABCDE", "ABCDE", "ABCDE", "ABCDE"]).length > 0, "4-letter row");
  assert.ok(validateShape(["aBCDE", "ABCDE", "ABCDE", "ABCDE", "ABCDE"]).length > 0, "lowercase");
  assert.ok(validateShape(["AB###", "AB###", "#####", "#####", "#####"]).length > 0, "2-letter slot");
  assert.ok(validateShape(["ABC##", "#####", "#####", "#####", "#####"]).length > 0, "square in one direction only");
});

test("gridHash is stable and changes with the grid", () => {
  const g = samples.records[0].grid;
  assert.equal(gridHash(g), gridHash([...g]));
  assert.match(gridHash(g), /^[0-9a-f]{8}$/);
  assert.notEqual(gridHash(g), gridHash(["##PCO", "#BEAT", "TOAST", "EACH#", "ATS##"]));
});
