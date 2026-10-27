// Grid logic shared by the app and the tools. No imports.

const SIZE = 5;

/**
 * Builds cells, slots and the per-cell slot map from a 5x5 grid ("#" = black square)
 * and clues keyed by slot id ("1A", "4D"). Numbering and Across-first order match the prototype.
 */
export function buildPuzzle(grid, clues = {}) {
  const g = grid.join("");
  const blk = (i) => g[i] === "#";
  const cells = [];
  const slots = [];
  let n = 0;
  for (let i = 0; i < SIZE * SIZE; i++) {
    const r = Math.floor(i / SIZE), c = i % SIZE;
    let num = null;
    if (!blk(i)) {
      const sa = (c === 0 || blk(i - 1)) && c < SIZE - 1 && !blk(i + 1);
      const sd = (r === 0 || blk(i - SIZE)) && r < SIZE - 1 && !blk(i + SIZE);
      if (sa || sd) {
        num = ++n;
        if (sa) {
          const cs = [];
          for (let k = i; k < r * SIZE + SIZE && !blk(k); k++) cs.push(k);
          slots.push({ dir: "A", num, cells: cs });
        }
        if (sd) {
          const cs = [];
          for (let k = i; k < SIZE * SIZE && !blk(k); k += SIZE) cs.push(k);
          slots.push({ dir: "D", num, cells: cs });
        }
      }
    }
    cells.push({ block: blk(i), answer: blk(i) ? "" : g[i], num });
  }
  const cellSlots = Array.from({ length: SIZE * SIZE }, () => ({}));
  for (const s of slots) {
    s.id = `${s.num}${s.dir}`;
    s.answer = s.cells.map((k) => g[k]).join("");
    const c = clues[s.id] || {};
    s.tag = c.tag; s.clue = c.clue; s.easy = c.easy; s.why = c.why;
    for (const k of s.cells) cellSlots[k][s.dir] = s;
  }
  slots.sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === "A" ? -1 : 1));
  return { cells, slots, cellSlots };
}

/** Returns a list of shape errors; empty means the grid is valid. */
export function validateShape(grid) {
  const errors = [];
  if (!Array.isArray(grid) || grid.length !== SIZE) return ["Grid must have 5 rows"];
  grid.forEach((row, r) => {
    if (typeof row !== "string" || row.length !== SIZE) errors.push(`Row ${r + 1} must be 5 characters`);
    else if (!/^[A-Z#]{5}$/.test(row)) errors.push(`Row ${r + 1} may only contain A-Z or #`);
  });
  if (errors.length) return errors;
  const g = grid.join("");
  const white = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE && g[r * SIZE + c] !== "#";
  const runLen = (r, c, dr, dc) => {
    let a = 0, b = 0;
    while (white(r - (a + 1) * dr, c - (a + 1) * dc)) a++;
    while (white(r + (b + 1) * dr, c + (b + 1) * dc)) b++;
    return a + b + 1;
  };
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!white(r, c)) continue;
      const across = runLen(r, c, 0, 1), down = runLen(r, c, 1, 0);
      if (across < 2 || down < 2) errors.push(`Square r${r + 1}c${c + 1} is not in both an Across and a Down answer`);
      if (across === 2 || down === 2) errors.push(`Square r${r + 1}c${c + 1} is in a 2-letter answer (minimum is 3)`);
    }
  }
  return [...new Set(errors)];
}

/** FNV-1a 32-bit over grid.join(""), as 8 lowercase hex characters. */
export function gridHash(grid) {
  const s = grid.join("");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
