import test from "node:test";
import assert from "node:assert/strict";
import { encode, decode, readPuzzleFile } from "../lib/codec.js";

test("round trip keeps unicode", () => {
  const rec = { title: "Chai pe charcha", clues: { "1A": { clue: "Pāni ₹10 😄", easy: "x", why: "y" } } };
  assert.deepEqual(decode(encode(rec)), rec);
});

test("scrambled text does not contain the answers", () => {
  const s = encode({ grid: ["##PCO", "#BEAT", "TOAST", "EACH#", "ATE##"] });
  assert.ok(!/TOAST|BEAT|PCO/.test(s));
});

test("readPuzzleFile checks the schema", () => {
  const rec = { title: "T" };
  assert.deepEqual(readPuzzleFile({ schema: 1, date: "2026-10-29", data: encode(rec) }), rec);
  assert.throws(() => readPuzzleFile({ schema: 2, data: encode(rec) }), (e) => e.name === "PuzzleFormatError");
});
