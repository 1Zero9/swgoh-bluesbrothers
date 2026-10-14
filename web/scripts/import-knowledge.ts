// Imports counters from a structured JSON file into the knowledge base, as candidates for review.
//
//   npx tsx scripts/import-knowledge.ts file.json                  (dry run: checks everything, writes nothing)
//   npx tsx scripts/import-knowledge.ts file.json --write          (stores them)
//   options: --offset N --limit N   (work through a big file in batches; safe to repeat)
//
// File shape: { "source": "name-of-the-source", "items": [ { "sourceRef": "id-in-that-source", ...a submission } ] }
// A submission is what /api/knowledge accepts: mode, defender.members, attacker.members, strategy, evidence[] …
// Re-running is safe: an item whose "<source>:<sourceRef>" is already stored only adds new evidence.
// Imports never publish by themselves unless the source is on the trusted list in lib/knowledge/permissions.ts.
// Reads DATABASE_URL (or PRISMA_DATABASE_URL) from the environment.
import { readFileSync } from "node:fs";
import { knownUnitIds, submitMatchup } from "@/lib/knowledge/data";
import { planImport } from "@/lib/knowledge/import-plan";
import { getPrisma } from "@/lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith("--"));
  const flag = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  if (!file) { console.error("Usage: npx tsx scripts/import-knowledge.ts <file.json> [--write] [--offset N] [--limit N]"); process.exit(1); }
  const write = args.includes("--write");

  const data = JSON.parse(readFileSync(file, "utf8")) as { source?: string; items?: { sourceRef?: string }[] };
  if (!data.source || !Array.isArray(data.items)) { console.error('The file needs a "source" name and an "items" list.'); process.exit(1); }
  const offset = Number(flag("--offset") ?? 0);
  const limit = Number(flag("--limit") ?? data.items.length);
  const batch = data.items.slice(offset, offset + limit);

  const existing = new Set(
    (await getPrisma().kbMatchup.findMany({ where: { importKey: { startsWith: `${data.source}:` } }, select: { importKey: true } })).map((row) => row.importKey as string),
  );
  const plan = planImport(batch.map((item, index) => ({ importKey: `${data.source}:${item.sourceRef ?? `#${offset + index}`}`, body: item })), existing, knownUnitIds);

  console.log(`${write ? "WRITE" : "DRY RUN"} · source "${data.source}" · items ${offset + 1}–${offset + batch.length} of ${data.items.length}`);
  console.log(`  would create ${plan.summary.create}, update ${plan.summary.update}, invalid ${plan.summary.invalid}, repeated in file ${plan.summary.duplicateInFile}`);
  for (const problem of plan.problems.slice(0, 20)) console.log(`  ✗ ${problem.importKey}: ${problem.error}`);
  if (!write) { console.log("Nothing written. Add --write to store these."); process.exit(plan.summary.invalid ? 2 : 0); }

  let created = 0, updated = 0, evidenceAdded = 0, failed = 0;
  for (const item of plan.items) {
    try {
      const result = await submitMatchup(item.input, { via: "IMPORT", who: `import:${data.source}`, whoId: null, importKey: item.importKey });
      if (result.created) created += 1; else updated += 1;
      evidenceAdded += result.evidenceAdded;
    } catch (error) {
      failed += 1;
      console.log(`  ✗ ${item.importKey}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
  console.log(`Done: ${created} created, ${updated} existing (evidence-only), ${evidenceAdded} evidence rows added, ${failed} failed.`);
  process.exit(failed ? 3 : 0);
}

main().catch((error) => { console.error(error); process.exit(1); });
