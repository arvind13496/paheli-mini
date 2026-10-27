// Player state in localStorage: settings, solved dates, and one in-progress puzzle. No imports.

const K = {
  settings: "paheli:v1:settings",
  solves: "paheli:v1:solves",
  progress: "paheli:v1:progress",
  migrated: "paheli:v1:migrated",
  probe: "paheli:v1:probe",
};
const LEGACY = ["paheli-1", "paheli-2", "paheli-3", "paheli-last"];

export function createState(storage = globalThis.localStorage) {
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

  return { available, migrateLegacy, getSettings, setSettings, getProgress, saveProgress, clearProgress, getSolve, recordSolve, streaks };
}
