import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../lib/state.js";

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

const solve = (st, d) => st.recordSolve(d, { sec: 60, hints: 0, checks: 0, reveals: 0, auto: false });

test("a no-puzzle day doesn't break the streak", () => {
  const st = createState(memoryStorage());
  ["2026-10-29", "2026-10-30", "2026-11-01"].forEach((d) => solve(st, d));
  // 31 Oct is not in the manifest
  assert.deepEqual(st.streaks(["2026-10-29", "2026-10-30", "2026-11-01"], "2026-11-01"), { current: 3, best: 3 });
});

test("a missed manifest day breaks the streak", () => {
  const st = createState(memoryStorage());
  ["2026-10-29", "2026-11-01"].forEach((d) => solve(st, d));
  assert.equal(st.streaks(["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"], "2026-11-01").current, 1);
});

test("today unsolved still shows yesterday's streak", () => {
  const st = createState(memoryStorage());
  ["2026-10-29", "2026-10-30"].forEach((d) => solve(st, d));
  assert.equal(st.streaks(["2026-10-29", "2026-10-30", "2026-10-31"], "2026-10-31").current, 2);
});

test("best streak over a 2-1-3 pattern is 3", () => {
  const st = createState(memoryStorage());
  const days = ["01", "02", "03", "04", "05", "06", "07", "08"].map((d) => `2026-11-${d}`);
  // solved: 01 02 | 04 | 06 07 08
  ["01", "02", "04", "06", "07", "08"].forEach((d) => solve(st, `2026-11-${d}`));
  assert.deepEqual(st.streaks(days, "2026-11-08"), { current: 3, best: 3 });
});

test("legacy keys migrate once", () => {
  const storage = memoryStorage({ "paheli-1": "{}", "paheli-last": "0", "paheli-auto": "true" });
  const st = createState(storage);
  st.migrateLegacy();
  assert.equal(st.getSettings().autocheck, true);
  assert.equal(storage.getItem("paheli-1"), null);
  assert.equal(storage.getItem("paheli-auto"), null);
  st.setSettings({ autocheck: false });
  storage.setItem("paheli-auto", "true");
  st.migrateLegacy();
  assert.equal(st.getSettings().autocheck, false, "does not run twice");
});

test("progress with a different hash is ignored", () => {
  const st = createState(memoryStorage());
  st.saveProgress({ date: "2026-10-29", hash: "aaaa0000", letters: [] });
  assert.ok(st.getProgress("2026-10-29", "aaaa0000"));
  assert.equal(st.getProgress("2026-10-29", "bbbb1111"), null);
});

test("a stale tab can't overwrite or clear a newer date's progress", () => {
  const st = createState(memoryStorage());
  st.saveProgress({ date: "2026-10-30", hash: "h", letters: ["A"] });
  st.saveProgress({ date: "2026-10-29", hash: "h", letters: ["B"] });
  assert.equal(st.getProgress("2026-10-30", "h").letters[0], "A");
  solve(st, "2026-10-29");
  assert.ok(st.getProgress("2026-10-30", "h"), "yesterday's solve keeps today's progress");
});

test("recordSolve from a stale tab keeps the other tab's solve", () => {
  const storage = memoryStorage();
  const tabA = createState(storage);
  const tabB = createState(storage);
  solve(tabA, "2026-10-29");
  solve(tabB, "2026-10-30");
  assert.ok(tabA.getSolve("2026-10-29") && tabA.getSolve("2026-10-30"));
});

test("settings round trip and getSolve", () => {
  const st = createState(memoryStorage());
  st.setSettings({ autocheck: true });
  assert.equal(st.getSettings().autocheck, true);
  assert.equal(st.getSolve("2026-10-29"), null);
  solve(st, "2026-10-29");
  assert.equal(st.getSolve("2026-10-29").sec, 60);
});

test("storage that throws on write is unavailable but harmless", () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
  const st = createState(broken);
  assert.equal(st.available, false);
  solve(st, "2026-10-29");
  assert.deepEqual(st.streaks(["2026-10-29"], "2026-10-29"), { current: 0, best: 0 });
});
