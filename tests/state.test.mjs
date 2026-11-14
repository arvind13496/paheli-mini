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

// ---------- archive ----------
const STATS = { sec: 90, hints: 0, checks: 0, reveals: 0, auto: false };
const DAYS = ["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"];

test("an archive solve leaves streaks() unchanged, even for a missed day", () => {
  const st = createState(memoryStorage());
  ["2026-10-29", "2026-11-01"].forEach((d) => solve(st, d));
  const before = st.streaks(DAYS, "2026-11-01");
  st.recordArchiveSolve("2026-10-30", STATS);
  st.recordArchiveSolve("2026-10-31", STATS);
  assert.deepEqual(st.streaks(DAYS, "2026-11-01"), before);
  assert.deepEqual(before, { current: 1, best: 1 });
  assert.equal(st.getSolve("2026-10-30"), null, "archive solves never land in solves");
  assert.equal(st.getArchiveSolve("2026-10-30").sec, 90);
});

test("archive solves are stored under paheli:v1:archive, merged by date across tabs", () => {
  const storage = memoryStorage();
  const a = createState(storage), b = createState(storage);
  a.recordArchiveSolve("2026-10-29", STATS);
  b.recordArchiveSolve("2026-10-30", STATS);
  const raw = JSON.parse(storage.getItem("paheli:v1:archive"));
  assert.deepEqual(Object.keys(raw).sort(), ["2026-10-29", "2026-10-30"]);
  assert.equal(storage.getItem("paheli:v1:solves"), null);
});

test("archive progress and today's progress don't overwrite each other", () => {
  const st = createState(memoryStorage());
  st.saveProgress({ date: "2026-11-01", hash: "t", letters: ["T"] });
  st.saveArchiveProgress({ date: "2026-10-30", hash: "a", letters: ["A"] });
  assert.equal(st.getProgress("2026-11-01", "t").letters[0], "T");
  assert.equal(st.getArchiveProgress("2026-10-30", "a").letters[0], "A");
  st.saveProgress({ date: "2026-11-01", hash: "t", letters: ["U"] });
  assert.equal(st.getArchiveProgress("2026-10-30", "a").letters[0], "A");
  // Solving the archive day clears only the archive slot; solving today clears only today's.
  st.recordArchiveSolve("2026-10-30", STATS);
  assert.equal(st.getArchiveProgress("2026-10-30", "a"), null);
  assert.equal(st.getProgress("2026-11-01", "t").letters[0], "U");
  st.saveArchiveProgress({ date: "2026-10-31", hash: "b", letters: ["B"] });
  solve(st, "2026-11-01");
  assert.equal(st.getProgress("2026-11-01", "t"), null);
  assert.equal(st.getArchiveProgress("2026-10-31", "b").letters[0], "B");
});

test("the archive progress slot holds the last archive day played, older or newer", () => {
  const st = createState(memoryStorage());
  st.saveArchiveProgress({ date: "2026-10-31", hash: "a", letters: [] });
  st.saveArchiveProgress({ date: "2026-10-29", hash: "b", letters: [] });
  assert.equal(st.archiveProgressDate(), "2026-10-29");
  assert.equal(st.getArchiveProgress("2026-10-31", "a"), null);
  assert.equal(st.getArchiveProgress("2026-10-29", "x"), null, "a changed grid hash drops progress");
});
