#!/usr/bin/env node
// Builds a self-contained, playable preview. Nothing is saved and nothing is sent to analytics.
//   node tools/preview.mjs batches/<id>.json [--fragment]   one batch, before publishing
//   node tools/preview.mjs puzzles/ [--fragment]            every published puzzle, past and future, all unlocked
// The output holds readable answers, so it lives in review/ (git-ignored).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPublished } from "./check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function inlineModule(file) {
  const code = fs.readFileSync(path.join(ROOT, "lib", file), "utf8");
  const names = [...code.matchAll(/^export (?:async )?(?:function|const|let) (\w+)/gm)].map((m) => m[1]);
  return `(() => {\n${code.replace(/^export /gm, "")}\nreturn { ${names.join(", ")} };\n})()`;
}

export function buildPreview(batch, { fragment = false } = {}) {
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const manifestPath = path.join(ROOT, "puzzles", "manifest.json");
  const launch = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")).launch : batch.records.map((r) => r.date).sort()[0];
  const records = batch.records.map(({ date, title, constructor, grid, clues }) => ({ date, title, constructor, grid, clues }));
  html = html.replace(/<script defer src="https:\/\/cloud\.umami\.is[^>]*><\/script>\n?/, "");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>Paheli Mini Preview</title>`);
  html = html.replace(/^import \{([^}]+)\} from "\.\/lib\/(\w+)\.js\?v=[^"]+";$/gm, (_, names, mod) => `const {${names}} = ${inlineModule(mod + ".js")};`);
  if (/from "\.\/lib\//.test(html)) throw new Error("Could not inline every lib import");
  const data = JSON.stringify({ launch, records }).replace(/</g, "\\u003c");
  html = html.replace('<script type="module">', `<script>window.PAHELI_PREVIEW = ${data};</script>\n<script type="module">`);
  if (fragment) {
    const head = html.slice(html.indexOf("<head>") + 6, html.indexOf("</head>"))
      .replace(/<meta charset[^>]*>\n?/, "").replace(/<meta name="viewport"[^>]*>\n?/, "");
    const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));
    html = head + "\n" + body;
  }
  return html;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) { console.error("Usage: node tools/preview.mjs batches/<id>.json | puzzles/ [--fragment]"); process.exit(1); }
  const fragment = process.argv.includes("--fragment");
  let batch, opts = { fragment };
  if (fs.statSync(target).isDirectory()) {
    const { entries, errors } = loadPublished(target);
    if (errors.length) { errors.forEach((e) => console.error(`error ${e}`)); process.exit(1); }
    batch = { batch: "all", records: entries.map((e) => ({ date: e.date, ...e.record })) };
  } else {
    batch = JSON.parse(fs.readFileSync(target, "utf8"));
  }
  const out = path.join(ROOT, "review", `${batch.batch}-preview${fragment ? "-fragment" : ""}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buildPreview(batch, opts));
  console.log(`Wrote ${out} (${batch.records.length} puzzles). Open it in a browser to play.`);
}
