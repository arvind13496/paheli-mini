// India-date helpers. Works in the browser and in Node. No imports (see design §Phase 1).
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const pad = (n) => String(n).padStart(2, "0");

function parseDate(date) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function isoFromUtcMs(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Current India date as "YYYY-MM-DD", independent of the device time zone. */
export function todayIST(now = Date.now()) {
  return isoFromUtcMs(now + IST_OFFSET_MS);
}

/** "YYYYMMDDHH" in India time, used to cache-bust the manifest hourly. */
export function istHourStamp(now = Date.now()) {
  const d = new Date(now + IST_OFFSET_MS);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}`;
}

export function addDays(date, n) {
  return isoFromUtcMs(parseDate(date) + n * DAY_MS);
}

/** Puzzle number: whole days since launch, plus 1. */
export function numberFor(date, launch) {
  return Math.round((parseDate(date) - parseDate(launch)) / DAY_MS) + 1;
}

export function msToNextMidnightIST(now = Date.now()) {
  const shifted = now + IST_OFFSET_MS;
  return (Math.floor(shifted / DAY_MS) + 1) * DAY_MS - shifted;
}

/** "Thursday, 29 October 2026" */
export function formatIST(date) {
  const d = new Date(parseDate(date));
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "29 Oct 2026" */
export function formatShort(date) {
  const d = new Date(parseDate(date));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
}

/** "7h 12m", or "12m" under an hour. */
export function countdownText(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const pageLoadTime = Date.now();

/**
 * The app's clock. On localhost only, "?date=YYYY-MM-DD" starts the clock at 06:00 IST on that date
 * and lets it keep running. Everywhere else it is Date.now().
 */
export function appNow() {
  const loc = globalThis.location;
  if (loc && (loc.hostname === "localhost" || loc.hostname === "127.0.0.1")) {
    const m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(loc.search || "");
    if (m) {
      const start = parseDate(m[1]) - IST_OFFSET_MS + 6 * 60 * 60 * 1000;
      return start + (Date.now() - pageLoadTime);
    }
  }
  return Date.now();
}
