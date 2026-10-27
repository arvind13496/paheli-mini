import test from "node:test";
import assert from "node:assert/strict";
import { todayIST, istHourStamp, addDays, numberFor, msToNextMidnightIST, formatIST, formatShort, countdownText, appNow } from "../lib/dates.js";

test("todayIST switches at 18:30 UTC", () => {
  assert.equal(todayIST(Date.UTC(2026, 9, 28, 18, 29, 59)), "2026-10-28");
  assert.equal(todayIST(Date.UTC(2026, 9, 28, 18, 30, 0)), "2026-10-29");
});

test("istHourStamp is the India hour", () => {
  assert.equal(istHourStamp(Date.UTC(2026, 9, 28, 18, 30, 0)), "2026102900");
});

test("addDays crosses month ends", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-11-01", -1), "2026-10-31");
});

test("numberFor counts from 1 on launch day", () => {
  assert.equal(numberFor("2026-10-29", "2026-10-29"), 1);
  assert.equal(numberFor("2026-11-04", "2026-10-29"), 7);
});

test("msToNextMidnightIST", () => {
  assert.equal(msToNextMidnightIST(Date.UTC(2026, 9, 28, 18, 0, 0)), 1800000);
});

test("formatting", () => {
  assert.equal(formatIST("2026-10-29"), "Thursday, 29 October 2026");
  assert.equal(formatShort("2026-10-29"), "29 Oct 2026");
  assert.equal(countdownText(43320000), "12h 2m");
  assert.equal(countdownText(720000), "12m");
});

test("appNow is the real clock outside localhost", () => {
  const before = Date.now();
  const t = appNow();
  assert.ok(t >= before && t <= Date.now());
});
