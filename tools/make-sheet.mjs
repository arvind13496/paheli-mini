#!/usr/bin/env node
// Builds the weekly review sheet: node tools/make-sheet.mjs batches/<id>.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { buildPuzzle } from "../lib/grid.js";
import { numberFor } from "../lib/dates.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const STATUSES = ["approved", "fix clue", "replace puzzle"];
export const COLUMNS = [
  ["Date", 12], ["#", 5], ["Title", 18], ["Grid", 10], ["Slot", 6], ["Answer", 10], ["Tag", 5],
  ["Clue", 42], ["Easier clue", 32], ["Why", 42], ["Source", 28], ["Warnings", 28], ["Self-solve", 18],
  ["Status", 15], ["Notes", 32],
];
const TAG_NAMES = { R: "Riddle", GK: "GK", N: "Pop" };

export async function makeSheet(batchPath, outPath) {
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
  const manifestPath = path.join(ROOT, "puzzles", "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { launch: null, dates: [] };
  const published = new Set(manifest.dates || []);
  const records = batch.records.filter((r) => !published.has(r.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const launch = manifest.launch || [...batch.records.map((r) => r.date)].sort()[0];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Batch ${batch.batch}`, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = COLUMNS.map(([header, width]) => ({ header, width }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111111" } };
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  let rowNo = 2;
  records.forEach((rec, idx) => {
    const { slots } = buildPuzzle(rec.grid, rec.clues || {});
    const first = rowNo;
    slots.forEach((s, i) => {
      const c = (rec.clues || {})[s.id] || {};
      const row = ws.getRow(rowNo++);
      row.values = [
        i === 0 ? rec.date : null,
        i === 0 ? numberFor(rec.date, launch) : null,
        i === 0 ? rec.title : null,
        i === 0 ? rec.grid.map((r) => r.replace(/#/g, "■").split("").join(" ")).join("\n") : null,
        s.id, s.answer, TAG_NAMES[c.tag] || c.tag || "",
        c.clue || "", c.easy || "", c.why || "", c.source || "",
        i === 0 ? (rec.warnings || []).join("\n") : null,
        i === 0 ? (rec.selfsolve || []).join(", ") : null,
        i === 0 ? "" : null,
        i === 0 ? "" : null,
      ];
      row.alignment = { vertical: "top", wrapText: true };
      if (idx % 2 === 1) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F2ED" } };
    });
    const last = rowNo - 1;
    for (const col of ["A", "B", "C", "D", "L", "M", "N", "O"]) if (last > first) ws.mergeCells(`${col}${first}:${col}${last}`);
    ws.getCell(`A${first}`).numFmt = "@";
    ws.getCell(`D${first}`).font = { name: "Courier New", size: 11 };
    ws.getCell(`N${first}`).dataValidation = { type: "list", allowBlank: true, formulae: [`"${STATUSES.join(",")}"`] };
    ws.getRow(last).border = { bottom: { style: "medium" } };
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await wb.xlsx.writeFile(outPath);
  return { written: records.length, skipped: batch.records.length - records.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const batchPath = process.argv[2];
  if (!batchPath) { console.error("Usage: node tools/make-sheet.mjs batches/<id>.json"); process.exit(1); }
  const id = JSON.parse(fs.readFileSync(batchPath, "utf8")).batch;
  const out = process.argv[3] || path.join(ROOT, "review", `${id}.xlsx`);
  const { written, skipped } = await makeSheet(batchPath, out);
  console.log(`Wrote ${out}: ${written} puzzle(s)${skipped ? `, ${skipped} already published and skipped` : ""}.`);
}
