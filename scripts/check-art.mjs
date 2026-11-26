import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
const rows = JSON.parse(
  readFileSync(new URL("../art/ASSET_MANIFEST.json", import.meta.url), "utf8"),
);
const ids = new Set(),
  paths = new Set();
for (const row of rows) {
  assert(
    !ids.has(row.id) && !paths.has(row.runtime),
    "Duplicate art entry " + row.id,
  );
  ids.add(row.id);
  paths.add(row.runtime);
  assert(
    row.runtime.endsWith("/" + row.id + ".webp") &&
      row.source.endsWith("/" + row.id + ".png"),
    "Mismatched paths",
  );
  assert(
    ["5:7", "1:1", "16:9"].includes(row.ratio) && row.minWidth >= 1024,
    "Invalid master spec",
  );
  assert(
    ["requested", "review", "approved"].includes(row.status),
    "Invalid asset status",
  );
  if (row.status === "approved")
    assert(
      existsSync(new URL("../public/" + row.runtime, import.meta.url)),
      "Missing approved " + row.id,
    );
}
for (const [prefix, count] of [
  ["u_", 15],
  ["g_", 6],
  ["w_", 7],
  ["t_", 6],
  ["c_", 3],
  ["b_", 7],
  ["r_", 5],
  ["m_", 1],
])
  assert.equal(rows.filter((r) => r.id.startsWith(prefix)).length, count);
console.log(rows.length + " art entries validated.");
