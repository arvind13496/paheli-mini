// Scrambles puzzle records so answers aren't readable in view-source. Not encryption. No imports.

const KEY = new TextEncoder().encode("paheli-mini-x1");

function xor(bytes) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ KEY[i % KEY.length];
  return out;
}

function toBase64(bytes) {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(str) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(str, "base64"));
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Method "x1": JSON -> UTF-8 bytes -> XOR with the key -> standard base64. */
export function encode(obj) {
  return toBase64(xor(new TextEncoder().encode(JSON.stringify(obj))));
}

export function decode(str) {
  return JSON.parse(new TextDecoder().decode(xor(fromBase64(str))));
}

/** Reads a published puzzle file ({ schema, date, data }) and returns the decoded record. */
export function readPuzzleFile(file) {
  if (!file || file.schema !== 1) {
    const err = new Error(`Unsupported puzzle file schema: ${file && file.schema}`);
    err.name = "PuzzleFormatError";
    throw err;
  }
  return decode(file.data);
}
