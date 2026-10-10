// Regenerates lib/unit-names.json (unit id -> English name) from the community game-data mirror
// https://github.com/swgoh-utils/gamedata. Run `node scripts/build-unit-names.mjs` when new units are released.
import { brotliDecompressSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const base = "https://raw.githubusercontent.com/swgoh-utils/gamedata/main";

async function download(name) {
  const response = await fetch(`${base}/${name}`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const units = JSON.parse(brotliDecompressSync(await download("units.json.br")).toString()).data;
const loc = JSON.parse(brotliDecompressSync(await download("Loc_ENG_US.txt.json.br")).toString()).data;

const names = {};
for (const unit of units) {
  if (!unit.baseId || !unit.nameKey) continue;
  const name = loc[unit.nameKey];
  if (name) names[unit.baseId] = name.trim();
}

const sorted = Object.fromEntries(Object.entries(names).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(new URL("../lib/unit-names.json", import.meta.url), JSON.stringify(sorted, null, 0) + "\n");
console.log(`wrote ${Object.keys(sorted).length} unit names`);
