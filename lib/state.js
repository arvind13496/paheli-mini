// Player state in localStorage: settings, solved dates, one in-progress puzzle, and the archive
// (past days played after their day: own solves and own in-progress slot, never counted in streaks). No imports.

// Settings are shared by every level. Solves, progress and the archive are kept per level:
// Mini uses the original keys ("paheli:v1:solves"), Midi and Complex add their name ("paheli:v1:midi:solves").
export const LEVEL_IDS = ["mini", "midi", "complex"];
function keysFor(level) {
  if (!LEVEL_IDS.includes(level)) throw new Error(`Unknown level "${level}"`);
  const p = level === "mini" ? "paheli:v1:" : `paheli:v1:${level}:`;
  return {
    settings: "paheli:v1:settings",
    solves: p + "solves",
    progress: p + "progress",
    archive: p + "archive",
    archiveProgress: p + "archive-progress",
    migrated: "paheli:v1:migrated",
    probe: "paheli:v1:probe",
  };
}
const LEGACY = ["paheli-1", "paheli-2", "paheli-3", "paheli-last"];

export function createState(storage = globalThis.localStorage, level = "mini") {
  const K = keysFor(level);
  const read = (key, fallback) => {
    try {
      const v = storage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  };
  const write = (key, value) => {
    try { storage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  };
  const remove = (key) => {
    try { storage.removeItem(key); } catch (e) { /* storage unavailable */ }
  };

  let available = false;
  try {
    storage.setItem(K.probe, "1");
    storage.removeItem(K.probe);
    available = true;
  } catch (e) {
    available = false;
  }

  function getSettings() {
    return { autocheck: false, ...read(K.settings, {}) };
  }

  function setSettings(patch) {
    write(K.settings, { ...getSettings(), ...patch });
  }

  function migrateLegacy() {
    if (read(K.migrated, false)) return;
    const auto = read("paheli-auto", null);
    if (auto === true) setSettings({ autocheck: true });
    for (const k of [...LEGACY, "paheli-auto"]) remove(k);
    write(K.migrated, true);
  }

  function getProgress(date, hash) {
    const p = read(K.progress, null);
    return p && p.date === date && p.hash === hash ? p : null;
  }

  /** The date held in the daily progress slot, or null. */
  function progressDate() {
    const p = read(K.progress, null);
    return p && typeof p.date === "string" ? p.date : null;
  }

  /** Writes only if nothing is stored, or the stored progress is for the same or an older date. */
  function saveProgress(record) {
    const cur = read(K.progress, null);
    if (!cur || cur.date <= record.date) write(K.progress, record);
  }

  /** Clears progress only if it belongs to the given date. */
  function clearProgress(date) {
    const cur = read(K.progress, null);
    if (cur && cur.date === date) remove(K.progress);
  }

  function getSolve(date) {
    const solves = read(K.solves, {});
    return solves[date] || null;
  }

  /** Re-reads solves, merges by date, writes, then clears that date's progress. */
  function recordSolve(date, stats) {
    const solves = read(K.solves, {});
    solves[date] = { at: Date.now(), ...stats };
    write(K.solves, solves);
    clearProgress(date);
  }

  /** All daily solves, { date: SolveStats }. */
  function allSolves() {
    return read(K.solves, {});
  }

  // ---------- archive (past days played later; never read by streaks()) ----------

  function getArchiveSolve(date) {
    const all = read(K.archive, {});
    return all[date] || null;
  }

  function allArchiveSolves() {
    return read(K.archive, {});
  }

  /** Re-reads archive solves, merges by date, writes, then clears that date's archive progress. */
  function recordArchiveSolve(date, stats) {
    const all = read(K.archive, {});
    all[date] = { at: Date.now(), ...stats };
    write(K.archive, all);
    clearArchiveProgress(date);
  }

  function getArchiveProgress(date, hash) {
    const p = read(K.archiveProgress, null);
    return p && p.date === date && p.hash === hash ? p : null;
  }

  /** The date held in the archive progress slot, or null. */
  function archiveProgressDate() {
    const p = read(K.archiveProgress, null);
    return p && typeof p.date === "string" ? p.date : null;
  }

  /** One slot: the last archive puzzle played wins, whatever its date. */
  function saveArchiveProgress(record) {
    write(K.archiveProgress, record);
  }

  function clearArchiveProgress(date) {
    const cur = read(K.archiveProgress, null);
    if (cur && cur.date === date) remove(K.archiveProgress);
  }

  /**
   * Current and best streak over manifest dates up to today.
   * Dates not in the manifest (no-puzzle days) never break a streak.
   */
  function streaks(manifestDates, today) {
    const solves = read(K.solves, {});
    const dates = [...manifestDates].filter((d) => d <= today).sort();
    let best = 0, run = 0;
    for (const d of dates) {
      if (solves[d]) { run++; best = Math.max(best, run); } else run = 0;
    }
    let i = dates.length - 1;
    if (i >= 0 && dates[i] === today && !solves[today]) i--;
    let current = 0;
    for (; i >= 0 && solves[dates[i]]; i--) current++;
    return { current, best };
  }

  return {
    available, migrateLegacy, getSettings, setSettings, getProgress, progressDate, saveProgress, clearProgress, getSolve, recordSolve, allSolves, streaks,
    getArchiveSolve, allArchiveSolves, recordArchiveSolve, getArchiveProgress, archiveProgressDate, saveArchiveProgress, clearArchiveProgress,
  };
}
