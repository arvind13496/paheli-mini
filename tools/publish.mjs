#!/usr/bin/env node
// Publishes approved puzzles: node tools/publish.mjs batches/<id>.json review/<id>.xlsx
// Reads only Status and Notes from the sheet. Content always comes from the batch file. Never commits.
// Without a sheet: node tools/publish.mjs batches/<id>.json --checked   publishes every record that passes the checker
// (since 12 Nov 2026 the checks and a blind test-solve replace the review sheet).
// A record with "level": "midi" or "complex" goes to puzzles/<level>/ and manifest.levels.<level>.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "../lib/codec.js";
import { todayIST } from "../lib/dates.js";
import { checkBatch, loadPublished, levelManifest } from "./check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function cellText(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object" && v.richText) return v.richText.map((t) => t.text).join("");
  if (typeof v === "object" && "result" in v) return String(v.result ?? "");
  return String(v).trim();
}

export async function readDecisions(sheetPath) {
  // Loaded only when a sheet is read, so --checked and the tests work without `npm install`.
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(sheetPath);
  const ws = wb.worksheets[0];
  const header = {};
  ws.getRow(1).eachCell((cell, col) => { header[cellText(cell.value)] = col; });
  for (const h of ["Date", "Status", "Notes"]) if (!header[h]) throw new Error(`Sheet has no "${h}" column`);
  const decisions = new Map();
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const date = cellText(row.getCell(header.Date).value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || decisions.has(date)) return;
    decisions.set(date, {
      status: cellText(row.getCell(header.Status).value).toLowerCase(),
      notes: cellText(row.getCell(header.Notes).value),
    });
  });
  return decisions;
}

export async function publish(batchPath, sheetPath, { today = todayIST(), puzzlesDir = path.join(ROOT, "puzzles") } = {}) {
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
  const decisions = sheetPath ? await readDecisions(sheetPath) : null;
  fs.mkdirSync(puzzlesDir, { recursive: true });
  const manifestPath = path.join(puzzlesDir, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { launch: null, dates: [] };
  const published = fs.existsSync(manifestPath) ? loadPublished(puzzlesDir).entries : [];
  const lvOf = (r) => r.level || "mini";
  const tag = (r) => (lvOf(r) === "mini" ? r.date : `${r.level} ${r.date}`);
  const datesOf = {};
  const publishedDates = (lv) => (datesOf[lv] ||= new Set(levelManifest(manifest, lv).dates));

  const report = { published: [], alreadyPublished: [], notApproved: [], refused: [] };
  const approved = [];
  for (const rec of batch.records) {
    if (publishedDates(lvOf(rec)).has(rec.date)) { report.alreadyPublished.push(tag(rec)); continue; }
    const d = decisions ? decisions.get(rec.date) : { status: "approved", notes: "" };
    if (!d || d.status !== "approved") { report.notApproved.push({ date: tag(rec), status: d ? d.status || "(blank)" : "(not in sheet)", notes: d ? d.notes : "" }); continue; }
    if (rec.date <= today) { report.refused.push({ date: tag(rec), reason: `date is not after today (${today})` }); continue; }
    approved.push(rec);
  }

  const { errors } = checkBatch(approved, published, today, undefined, manifest.dates, manifest);
  const failed = new Set(approved.filter((r) => errors.some((e) => e.startsWith(`${tag(r)}:`))).map(tag));
  for (const d of failed) report.refused.push({ date: d, reason: "checker failed" });

  const touched = new Set();
  for (const rec of approved.filter((r) => !failed.has(tag(r)))) {
    const lv = lvOf(rec), dir = lv === "mini" ? puzzlesDir : path.join(puzzlesDir, lv);
    const clues = {};
    for (const [id, c] of Object.entries(rec.clues)) clues[id] = { tag: c.tag, clue: c.clue, easy: c.easy, why: c.why };
    const data = encode({ ...(lv === "mini" ? {} : { level: lv }), title: rec.title, constructor: rec.constructor, grid: rec.grid, clues });
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${rec.date}.json`), JSON.stringify({ schema: 1, date: rec.date, data }) + "\n");
    publishedDates(lv).add(rec.date);
    touched.add(lv);
    report.published.push(tag(rec));
  }
  if (touched.size) {
    // Mini keeps the top-level launch and dates, so older app builds read the manifest unchanged.
    const out = { launch: manifest.launch || null, dates: manifest.dates || [] };
    if (touched.has("mini")) { out.dates = [...publishedDates("mini")].sort(); out.launch = manifest.launch || out.dates[0]; }
    const levels = { ...(manifest.levels || {}) };
    for (const lv of touched) if (lv !== "mini") { const dates = [...publishedDates(lv)].sort(); levels[lv] = { launch: (manifest.levels && manifest.levels[lv] && manifest.levels[lv].launch) || dates[0], dates }; }
    if (Object.keys(levels).length) out.levels = levels;
    fs.writeFileSync(manifestPath, JSON.stringify(out, null, 2) + "\n");
  }
  return { ...report, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [batchPath, second] = process.argv.slice(2);
  if (!batchPath || !second) { console.error("Usage: node tools/publish.mjs batches/<id>.json review/<id>.xlsx | --checked"); process.exit(1); }
  const r = await publish(batchPath, second === "--checked" ? null : second);
  r.published.forEach((d) => console.log(`published  ${d}`));
  r.alreadyPublished.forEach((d) => console.log(`skipped    ${d} (already published)`));
  r.notApproved.forEach((x) => console.log(`not approved ${x.date}: ${x.status}${x.notes ? ` | ${x.notes}` : ""}`));
  r.refused.forEach((x) => console.log(`refused    ${x.date}: ${x.reason}`));
  r.errors.forEach((e) => console.error(`error ${e}`));
  process.exit(r.errors.length || r.refused.length ? 1 : 0);
}
