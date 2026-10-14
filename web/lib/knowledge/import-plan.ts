import type { Via } from "@/lib/knowledge/permissions";
import { validateSubmission, type SubmissionInput } from "@/lib/knowledge/validate";

export type ImportItem = { importKey: string; body: unknown };

export type ImportPlan = {
  items: { importKey: string; input: SubmissionInput; action: "create" | "update" }[];
  problems: { importKey: string; error: string }[];
  summary: { create: number; update: number; invalid: number; duplicateInFile: number };
};

/**
 * Works out what an import would do, without touching the database. Pure, so a dry run and a real run agree:
 * keys already stored become updates (which only add evidence, never rewrite reviewed text), new keys create
 * candidates, bad rows are reported, and a key repeated inside the file is counted once.
 */
export function planImport(items: ImportItem[], existingKeys: ReadonlySet<string>, knownUnits: ReadonlySet<string>, via: Via = "IMPORT"): ImportPlan {
  const plan: ImportPlan = { items: [], problems: [], summary: { create: 0, update: 0, invalid: 0, duplicateInFile: 0 } };
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.importKey || seen.has(item.importKey)) { plan.summary.duplicateInFile += 1; continue; }
    seen.add(item.importKey);
    const checked = validateSubmission(item.body, via, knownUnits);
    if (!checked.ok) { plan.problems.push({ importKey: item.importKey, error: checked.error }); plan.summary.invalid += 1; continue; }
    const action = existingKeys.has(item.importKey) ? "update" : "create";
    plan.items.push({ importKey: item.importKey, input: checked.value, action });
    plan.summary[action] += 1;
  }
  return plan;
}
