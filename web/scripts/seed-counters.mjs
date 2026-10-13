// Loads counters from a plain-text list the officers wrote, so the library does not start empty.
//
//   node scripts/seed-counters.mjs counters.txt            (check only, writes nothing)
//   node scripts/seed-counters.mjs counters.txt --write    (adds them to the database)
//
// One counter per line, fields separated by " | ":
//   Enemy leader | Name of the counter | TW, GAC or BOTH | Unit:stars:relic, Unit:stars:relic, ... | optional note
// Units are the leader first. Stars and relic are optional (defaults 7 stars, relic 0). Example:
//   Lord Vader | Bounty hunters | TW | Boba Fett:7:5, Bossk:7:5, Cad Bane:7:5 | Open with Cad Bane
// Reads DATABASE_URL (or PRISMA_DATABASE_URL) from the environment, like the sync scripts.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const names = JSON.parse(readFileSync(join(here, "../lib/unit-names.json"), "utf8"));
const byName = new Map(Object.entries(names).map(([id, name]) => [String(name).toLowerCase(), id]));
const byId = new Map(Object.keys(names).map((id) => [id.toLowerCase(), id]));
const resolve = (text) => byName.get(text.trim().toLowerCase()) ?? byId.get(text.trim().toLowerCase()) ?? null;

const [file, flag] = process.argv.slice(2);
if (!file) { console.error("Usage: node scripts/seed-counters.mjs <list.txt> [--write]"); process.exit(1); }
const write = flag === "--write";

const counters = [];
const problems = [];
readFileSync(file, "utf8").split("\n").forEach((raw, index) => {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return;
  const at = `line ${index + 1}`;
  const [enemy, title, modeText, squadText, note] = line.split("|").map((part) => part.trim());
  const enemyLeaderId = resolve(enemy ?? "");
  if (!enemyLeaderId) return problems.push(`${at}: no unit called "${enemy}"`);
  if (!title) return problems.push(`${at}: missing a name for the counter`);
  const mode = (modeText || "BOTH").toUpperCase();
  if (!["TW", "GAC", "BOTH"].includes(mode)) return problems.push(`${at}: mode must be TW, GAC or BOTH`);
  const squad = [];
  for (const slotText of (squadText || "").split(",")) {
    const [unit, stars, relic] = slotText.split(":").map((part) => part.trim());
    const unitId = resolve(unit ?? "");
    if (!unitId) { problems.push(`${at}: no unit called "${unit}"`); continue; }
    squad.push({ unitId, minStars: Number(stars || 7), minRelic: Number(relic || 0) });
  }
  if (squad.length < 1 || squad.length > 5) return problems.push(`${at}: a counter squad has 1 to 5 units`);
  counters.push({ enemyLeaderId, title: title.slice(0, 60), mode, squad, notes: note ? note.slice(0, 400) : null });
});

if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`${counters.length} counter(s) read OK:`);
for (const c of counters) console.log(` - ${names[c.enemyLeaderId]}: ${c.title} [${c.mode}] ${c.squad.map((s) => `${names[s.unitId]} ${s.minStars}*/R${s.minRelic}`).join(", ")}`);
if (!write) { console.log("\nNothing written. Add --write to save them."); process.exit(0); }

const require = createRequire(import.meta.url);
const pg = require("pg");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? process.env.PRISMA_DATABASE_URL });
await client.connect();
for (const c of counters) {
  // Re-running the file must not duplicate a counter that is already there.
  const exists = await client.query('select 1 from "Counter" where "enemyLeaderId" = $1 and title = $2 and "createdByName" = $3', [c.enemyLeaderId, c.title, "Guild officers"]);
  if (exists.rowCount) { console.log(`skipped (already there): ${c.title}`); continue; }
  await client.query(
    'insert into "Counter" (id, "enemyLeaderId", title, mode, squad, notes, "createdById", "createdByName") values ($1,$2,$3,$4,$5,$6,null,$7)',
    [`seed${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, c.enemyLeaderId, c.title, c.mode, JSON.stringify(c.squad), c.notes, "Guild officers"],
  );
  console.log(`added: ${c.title}`);
}
await client.end();
