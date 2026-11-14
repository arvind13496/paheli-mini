#!/usr/bin/env node
// Paheli checker. Batch mode: node tools/check.mjs batches/<id>.json
// Published mode: node tools/check.mjs puzzles/ [--buffer 3] [--used]
// Feed layout: Mini lives at puzzles/<date>.json with manifest { launch, dates }. Midi and Complex live at
// puzzles/<level>/<date>.json with manifest.levels.<level> = { launch, dates }.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPuzzle, validateShape } from "../lib/grid.js";
import { readPuzzleFile } from "../lib/codec.js";
import { todayIST, addDays } from "../lib/dates.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPEAT_WINDOW_DAYS = 14;
const TAGS = new Set(["R", "GK", "N"]);
// Levels: Mini is the daily 5x5 (no `level` field). Midi and Complex are bigger; Complex may use cryptic clues (tag C).
export const LEVEL_SIZE = { mini: 5, midi: 7, complex: 9 };
export const EXTRA_LEVELS = ["midi", "complex"];
/** { launch, dates } for one level, from the manifest. Mini is the manifest's own top-level fields. */
export function levelManifest(manifest, level = "mini") {
  const m = !manifest ? null : level === "mini" ? manifest : manifest.levels && manifest.levels[level];
  return { launch: (m && m.launch) || null, dates: m && Array.isArray(m.dates) ? m.dates : [] };
}
const label = (e) => (e.level && e.level !== "mini" ? `${e.level} ${e.date}` : e.date);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// The easier ("Aasaan") clue is required for every puzzle dated from this day on. (The 12 Nov 2026 puzzle went out without one.)
export const EASY_FROM = "2026-11-13";

const isStr = (o, k) => Object.prototype.hasOwnProperty.call(o, k) && typeof o[k] === "string" && o[k].trim() !== "";
const wordRe = (w) => new RegExp(`(^|[^A-Za-z])${w}([^A-Za-z]|$)`, "i");

function loadMisspellings() {
  const file = path.join(ROOT, "data", "misspellings.txt");
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z]+)\s*=\s*([A-Z]+)\s*$/.exec(line);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

/** Shape, content and answer-leak rules for one record. Returns { errors, warnings, answers }. */
function checkRecord(rec, misspellings = new Map(), { published = false, date = rec && rec.date } = {}) {
  const errors = [], warnings = [];
  if (!rec || typeof rec !== "object") return { errors: ["Record is not an object"], warnings, answers: [] };
  if (!isStr(rec, "title")) errors.push("Missing title");
  if (!isStr(rec, "constructor")) errors.push("Missing constructor");
  const level = rec.level || "mini";
  if (!LEVEL_SIZE[level]) return { errors: [...errors, `Unknown level "${rec.level}" (use midi or complex, or leave it out for a Mini)`], warnings, answers: [] };
  const shape = validateShape(rec.grid, [LEVEL_SIZE[level]]);
  const tags = level === "complex" ? new Set([...TAGS, "C"]) : TAGS;
  if (shape.length) return { errors: [...errors, ...shape], warnings, answers: [] };

  const clues = rec.clues && typeof rec.clues === "object" ? rec.clues : {};
  const { slots } = buildPuzzle(rec.grid, clues);
  const answers = slots.map((s) => s.answer);
  const ids = new Set(slots.map((s) => s.id));
  for (const id of Object.keys(clues)) if (!ids.has(id)) errors.push(`Clue ${id} has no matching slot in the grid`);

  const seen = new Set();
  for (const a of answers) {
    if (seen.has(a)) errors.push(`${a} appears twice in the same grid`);
    seen.add(a);
  }

  const tagCount = {};
  for (const s of slots) {
    const c = clues[s.id];
    if (!c) { errors.push(`${s.id} (${s.answer}) has no clue`); continue; }
    if (!tags.has(c.tag)) errors.push(`${s.id} has an invalid tag "${c.tag}" (use ${[...tags].join(", ")})`);
    const needEasy = !published || !(typeof date === "string" && date < EASY_FROM);
    for (const f of needEasy ? ["clue", "easy", "why"] : ["clue", "why"]) if (!isStr(c, f)) errors.push(`${s.id} (${s.answer}) is missing "${f}"`);
    if (!published && c.tag === "GK" && !isStr(c, "source")) errors.push(`${s.id} (${s.answer}) is a GK clue with no source`);
    for (const f of ["clue", "easy"]) {
      if (isStr(c, f) && wordRe(s.answer).test(c[f])) errors.push(`${s.id}: answer ${s.answer} appears in its own ${f === "easy" ? "easier clue" : "clue"}`);
    }
    if (isStr(rec, "title") && wordRe(s.answer).test(rec.title)) errors.push(`Title "${rec.title}" contains the answer ${s.answer}`);
    if (misspellings.has(s.answer)) warnings.push(`${s.answer} looks like a misspelling of ${misspellings.get(s.answer)}`);
    tagCount[c.tag] = (tagCount[c.tag] || 0) + 1;
  }
  for (const [tag, n] of Object.entries(tagCount)) {
    if (n > slots.length / 2) warnings.push(`Clue mix is lopsided: ${n} of ${slots.length} clues are ${tag}`);
  }
  return { errors, warnings, answers };
}

function daysApart(a, b) {
  return Math.abs((Date.parse(a) - Date.parse(b)) / 86400000);
}

/** Repeat rule between entries with different dates. entries: [{date, answers}] */
// Repeat rule. Within a level: no answer again within 14 days. Across levels (someone may play
// all three on one day): no answer of 4 or more letters in two levels on the same date.
export const CROSS_LEVEL_MIN = 4;
function repeatErrors(entry, others) {
  const errs = [];
  const lv = entry.level || "mini";
  for (const o of others) {
    if (o === entry) continue;
    if ((o.level || "mini") === lv) {
      if (o.date === entry.date || daysApart(o.date, entry.date) > REPEAT_WINDOW_DAYS) continue;
      for (const a of entry.answers) {
        if (o.answers.includes(a)) errs.push(`${a} was also used on ${o.date} (within ${REPEAT_WINDOW_DAYS} days)`);
      }
    } else if (o.date === entry.date) {
      for (const a of entry.answers) {
        if (a.length >= CROSS_LEVEL_MIN && o.answers.includes(a)) errs.push(`${a} is also in the ${o.level || "mini"} puzzle on the same day`);
      }
    }
  }
  return errs;
}

/** Loads published puzzles from a folder, all levels. Returns { manifest, entries: [{date, level?, record}], errors }. */
export function loadPublished(dir) {
  const errors = [];
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return { manifest: null, entries: [], errors: ["No manifest.json found"] };
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); } catch (e) { return { manifest: null, entries: [], errors: ["manifest.json is not valid JSON"] }; }
  const entries = [];
  for (const level of ["mini", ...EXTRA_LEVELS]) {
    const sub = level === "mini" ? dir : path.join(dir, level);
    if (!fs.existsSync(sub)) continue;
    for (const name of fs.readdirSync(sub).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()) {
      const date = name.slice(0, 10), shown = level === "mini" ? name : `${level}/${name}`;
      try {
        const file = JSON.parse(fs.readFileSync(path.join(sub, name), "utf8"));
        if (file.date !== date) errors.push(`${shown}: date inside the file is ${file.date}`);
        const record = readPuzzleFile(file);
        if (level === "mini") { delete record.level; entries.push({ date, record }); }
        else entries.push({ date, level, record: { ...record, level } });
      } catch (e) {
        errors.push(`${shown}: could not be read (${e.message})`);
      }
    }
  }
  return { manifest, entries, errors };
}

/** Batch mode. records: plaintext batch records; published: [{date, record}]; today: "YYYY-MM-DD". */
export function checkBatch(records, published, today, misspellings = loadMisspellings(), manifestDates = null, manifest = null) {
  const errors = [], warnings = {}, skipped = [];
  const lvOf = (x) => x.level || (x.record && x.record.level) || "mini";
  const publishedKeys = new Set(published.filter((p) => !(manifestDates && lvOf(p) === "mini")).map((p) => `${lvOf(p)} ${p.date}`));
  for (const d of manifestDates || []) publishedKeys.add(`mini ${d}`);
  for (const lv of EXTRA_LEVELS) for (const d of levelManifest(manifest, lv).dates) publishedKeys.add(`${lv} ${d}`);
  const pubEntries = published.map((p) => ({ date: p.date, level: lvOf(p), answers: buildPuzzle(p.record.grid).slots.map((s) => s.answer) }));
  const batchDates = new Set();
  const checked = [];
  for (const rec of records) {
    const date = rec && rec.date;
    if (publishedKeys.has(`${(rec && rec.level) || "mini"} ${date}`)) { skipped.push(label({ level: rec.level, date })); continue; }
    const tag = date ? label({ level: rec.level, date }) : "(no date)";
    if (typeof date !== "string" || !DATE_RE.test(date)) errors.push(`${tag}: date must be YYYY-MM-DD`);
    else {
      if (date <= today) errors.push(`${tag}: date must be after today (${today})`);
      const key = (rec.level || "mini") + " " + date;
      if (batchDates.has(key)) errors.push(`${tag}: date appears twice in the batch`);
      batchDates.add(key);
    }
    const r = checkRecord(rec, misspellings);
    r.errors.forEach((e) => errors.push(`${tag}: ${e}`));
    warnings[tag] = r.warnings;
    checked.push({ date, level: rec.level, answers: r.answers });
  }
  const all = [...pubEntries, ...checked];
  for (const c of checked) repeatErrors(c, all).forEach((e) => errors.push(`${label(c)}: ${e}`));
  return { errors, warnings, skipped };
}

/** Published mode. */
export function checkPublished(dir, { today = todayIST(), buffer = 0 } = {}) {
  const { manifest, entries, errors } = loadPublished(dir);
  if (!manifest) return { errors };
  for (const k of Object.keys(manifest.levels || {})) if (!EXTRA_LEVELS.includes(k)) errors.push(`manifest has an unknown level "${k}"`);
  // Every level is checked on its own, so one level running short never hides another's problems.
  for (const level of ["mini", ...EXTRA_LEVELS]) {
    const mini = level === "mini", pre = mini ? "" : `${level}: `, dirName = mini ? "puzzles" : `puzzles/${level}`;
    const listed = mini || !!(manifest.levels && manifest.levels[level]);
    const { launch, dates } = levelManifest(manifest, level);
    const fileDates = entries.filter((e) => (e.level || "mini") === level).map((e) => e.date);
    const mSet = new Set(dates), fSet = new Set(fileDates);
    for (const d of dates) if (!fSet.has(d)) errors.push(`${pre}manifest lists ${d} but ${dirName}/${d}.json is missing or unreadable`);
    // A level taken out of the manifest (paused) may keep its files.
    if (listed) for (const d of fileDates) if (!mSet.has(d)) errors.push(`${dirName}/${d}.json is not in the manifest`);
    if (dates.length && launch !== [...dates].sort()[0]) errors.push(`${pre}manifest launch (${launch}) is not the earliest date`);
    if (buffer && listed) {
      const future = dates.filter((d) => d > today).length;
      if (launch && today >= launch && !mSet.has(today)) errors.push(`${pre}No puzzle published for today (${today})`);
      if (future < buffer) errors.push(`${pre}Only ${future} future day(s) published; the minimum is ${buffer}`);
    }
  }
  const misspellings = loadMisspellings();
  const checked = [];
  for (const e of entries) {
    const r = checkRecord(e.record, misspellings, { published: true, date: e.date });
    r.errors.forEach((x) => errors.push(`${label(e)}: ${x}`));
    checked.push({ date: e.date, level: e.level, answers: r.answers });
  }
  for (const c of checked) repeatErrors(c, checked).forEach((x) => errors.push(`${label(c)}: ${x}`));
  return { errors };
}

/** Answers used within the repeat window either side of today. */
export function usedAnswers(dir, today = todayIST()) {
  const { entries } = loadPublished(dir);
  const from = addDays(today, -REPEAT_WINDOW_DAYS), to = addDays(today, REPEAT_WINDOW_DAYS);
  const out = new Set();
  for (const e of entries) if (e.date >= from && e.date <= to) buildPuzzle(e.record.grid).slots.forEach((s) => out.add(s.answer));
  return [...out].sort();
}

function main(argv) {
  const args = argv.slice(2);
  const target = args.find((a) => !a.startsWith("--")) || path.join(ROOT, "puzzles");
  const bi = args.indexOf("--buffer");
  const buffer = bi >= 0 ? Number(args[bi + 1]) : 0;
  const today = todayIST();
  const puzzlesDir = path.join(ROOT, "puzzles");

  if (args.includes("--used")) {
    console.log(usedAnswers(fs.existsSync(target) && fs.statSync(target).isDirectory() ? target : puzzlesDir, today).join(", "));
    return 0;
  }

  if (target.endsWith(".json")) {
    const batch = JSON.parse(fs.readFileSync(target, "utf8"));
    if (!Array.isArray(batch.records)) { console.error("Not a batch file: expected a \"records\" array"); return 1; }
    const loaded = fs.existsSync(path.join(puzzlesDir, "manifest.json")) ? loadPublished(puzzlesDir) : { entries: [], manifest: null };
    const { errors, warnings, skipped } = checkBatch(batch.records, loaded.entries, today, loadMisspellings(), loaded.manifest && loaded.manifest.dates, loaded.manifest);
    for (const rec of batch.records) { const w = warnings[label(rec)]; if (w) rec.warnings = w; }
    fs.writeFileSync(target, JSON.stringify(batch, null, 2) + "\n");
    skipped.forEach((d) => console.log(`${d}: already published, skipped`));
    Object.entries(warnings).forEach(([d, ws]) => ws.forEach((w) => console.log(`warning ${d}: ${w}`)));
    errors.forEach((e) => console.error(`error ${e}`));
    console.log(errors.length ? `\n${errors.length} error(s).` : `\nBatch OK (${batch.records.length - skipped.length} checked).`);
    return errors.length ? 1 : 0;
  }

  const { errors } = checkPublished(target, { today, buffer });
  errors.forEach((e) => console.error(`error ${e}`));
  console.log(errors.length ? `\n${errors.length} error(s).` : "Published puzzles OK.");
  return errors.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv));
}
