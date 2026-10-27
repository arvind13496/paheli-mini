#!/usr/bin/env node
// Publishes approved puzzles: node tools/publish.mjs batches/<id>.json review/<id>.xlsx
// Reads only Status and Notes from the sheet. Content always comes from the batch file. Never commits.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { encode } from "../lib/codec.js";
import { todayIST } from "../lib/dates.js";
import { checkBatch, loadPublished } from "./check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function cellText(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object" && v.richText) return v.richText.map((t) => t.text).join("");
  if (typeof v === "object" && "result" in v) return String(v.result ?? "");
  return String(v).trim();
}

export async function readDecisions(sheetPath) {
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
  const decisions = await readDecisions(sheetPath);
  fs.mkdirSync(puzzlesDir, { recursive: true });
  const manifestPath = path.join(puzzlesDir, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { launch: null, dates: [] };
  const published = fs.existsSync(manifestPath) ? loadPublished(puzzlesDir).entries : [];
  const publishedDates = new Set(manifest.dates);

  const report = { published: [], alreadyPublished: [], notApproved: [], refused: [] };
  const approved = [];
  for (const rec of batch.records) {
    if (publishedDates.has(rec.date)) { report.alreadyPublished.push(rec.date); continue; }
    const d = decisions.get(rec.date);
    if (!d || d.status !== "approved") { report.notApproved.push({ date: rec.date, status: d ? d.status || "(blank)" : "(not in sheet)", notes: d ? d.notes : "" }); continue; }
    if (rec.date <= today) { report.refused.push({ date: rec.date, reason: `date is not after today (${today})` }); continue; }
    approved.push(rec);
  }

  const { errors } = checkBatch(approved, published, today, undefined, manifest.dates);
  const failed = new Set(approved.filter((r) => errors.some((e) => e.startsWith(`${r.date}:`))).map((r) => r.date));
  for (const d of failed) report.refused.push({ date: d, reason: "checker failed" });

  for (const rec of approved.filter((r) => !failed.has(r.date))) {
    const clues = {};
    for (const [id, c] of Object.entries(rec.clues)) clues[id] = { tag: c.tag, clue: c.clue, easy: c.easy, why: c.why };
    const data = encode({ title: rec.title, constructor: rec.constructor, grid: rec.grid, clues });
    fs.writeFileSync(path.join(puzzlesDir, `${rec.date}.json`), JSON.stringify({ schema: 1, date: rec.date, data }) + "\n");
    publishedDates.add(rec.date);
    report.published.push(rec.date);
  }
  if (report.published.length) {
    const dates = [...publishedDates].sort();
    fs.writeFileSync(manifestPath, JSON.stringify({ launch: manifest.launch || dates[0], dates }, null, 2) + "\n");
  }
  return { ...report, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [batchPath, sheetPath] = process.argv.slice(2);
  if (!batchPath || !sheetPath) { console.error("Usage: node tools/publish.mjs batches/<id>.json review/<id>.xlsx"); process.exit(1); }
  const r = await publish(batchPath, sheetPath);
  r.published.forEach((d) => console.log(`published  ${d}`));
  r.alreadyPublished.forEach((d) => console.log(`skipped    ${d} (already published)`));
  r.notApproved.forEach((x) => console.log(`not approved ${x.date}: ${x.status}${x.notes ? ` | ${x.notes}` : ""}`));
  r.refused.forEach((x) => console.log(`refused    ${x.date}: ${x.reason}`));
  r.errors.forEach((e) => console.error(`error ${e}`));
  process.exit(r.errors.length || r.refused.length ? 1 : 0);
}
