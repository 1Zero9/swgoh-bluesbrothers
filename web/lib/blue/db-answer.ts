import { findNotesForBlue } from "@/lib/knowledge/notes-data";
import { listCounters, type CounterView } from "@/lib/counters-data";
import { detectIntent } from "@/lib/blue/intent";
import { lookupKnownCounters, type KnownCounter } from "@/lib/knowledge/lookup";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import { whoHas } from "@/lib/who-has";
import { allUnitNames } from "@/lib/wins";

/** A reply that came from the guild's own database. `needsWebSearch` means the database had nothing and the member may choose to spend a question on a web search. */
export type DbAnswer = { text: string; needsWebSearch: boolean; offer?: { leaderUnitId: string; leaderName: string; mode: KbMode | null } };

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null);
const FOOT = "*From the guild's own database. No AI used, so this cost nothing.*";

type SavedCounter = Pick<CounterView, "title" | "mode" | "notes" | "createdByName"> & { squad: { name: string }[]; readiness: { you: { ready: boolean; gaps: string[] } | null; ready: unknown[] } };

/** The database's counters for one enemy squad, as plain text. Pure, so it can be tested without a database. */
export function formatCounterAnswer(enemy: string, mode: KbMode | null, known: KnownCounter[], saved: SavedCounter[]): string {
  const lines: string[] = [`**Counters for ${enemy}**${mode ? ` (${MODE_LABELS[mode]})` : ""}`, ""];
  let n = 1;
  for (const counter of known) {
    lines.push(`${n++}. **${counter.attackingSquad.join(", ")}** · ${counter.modeLabel}`);
    if (counter.strategy) lines.push(`   * ${counter.strategy}`);
    if (counter.datacronDependent) lines.push(`   * Needs a particular Datacron${counter.datacronEnds ? `, until ${day(counter.datacronEnds)}` : " (end date unknown)"}`);
    const needs = counter.requirements;
    const bits = [needs?.zetas?.length ? `zetas: ${needs.zetas.join(", ")}` : "", needs?.omicrons?.length ? `omicrons: ${needs.omicrons.join(", ")}` : "", needs?.ultimates?.length ? `ultimates: ${needs.ultimates.join(", ")}` : ""].filter(Boolean);
    if (bits.length) lines.push(`   * Needs ${bits.join("; ")}`);
    if (counter.memberCanRunIt !== null) lines.push(counter.memberCanRunIt ? "   * **You can run this now.**" : `   * You still need: ${counter.memberStillNeeds.slice(0, 4).join("; ")}`);
    const sources = counter.evidence.length;
    lines.push(`   * ${counter.guildmatesWhoUseIt} guildmate${counter.guildmatesWhoUseIt === 1 ? "" : "s"} use${counter.guildmatesWhoUseIt === 1 ? "s" : ""} it · ${sources} source${sources === 1 ? "" : "s"}${counter.lastReviewed ? ` · checked ${day(counter.lastReviewed)}` : ""}`);
  }
  for (const counter of saved) {
    lines.push(`${n++}. **${counter.squad.map((slot) => slot.name).join(", ")}** · ${counter.title} (${counter.mode === "BOTH" ? "TW and GAC" : counter.mode}) · saved by ${counter.createdByName}`);
    if (counter.notes) lines.push(`   * ${counter.notes}`);
    if (counter.readiness.you) lines.push(counter.readiness.you.ready ? "   * **You can run this now.**" : `   * You still need: ${counter.readiness.you.gaps.slice(0, 4).join("; ")}`);
    lines.push(`   * ${counter.readiness.ready.length} guildmate${counter.readiness.ready.length === 1 ? "" : "s"} can run it right now`);
  }
  lines.push("", FOOT);
  return lines.join("\n");
}

/**
 * The free first step for a question. Counter questions and "who has X" are answered from the database with no AI and no cost.
 * Returns null for anything else (the AI handles those). When the database has nothing, says so and offers the web search as an explicit choice.
 */
export async function answerFromDatabase(playerId: string | null, question: string): Promise<DbAnswer | null> {
  const intent = detectIntent(question, allUnitNames());
  if (intent.kind === "other") return null;

  if (intent.kind === "whohas") {
    const result = await whoHas(intent.unit.name);
    if (!result.unit) return null;
    if (!result.holders.length) return { text: `Nobody in the guild has **${result.unit.name}** yet.\n\n${FOOT}`, needsWebSearch: false };
    const top = result.holders.slice(0, 15).map((holder) => `* **${holder.name}**: ${holder.stars}★${holder.relic > 0 ? ` R${holder.relic}` : holder.gear ? ` G${holder.gear}` : ""}`);
    const more = result.holders.length - top.length;
    return { text: `**${result.holders.length} of ${result.totalMembers}** guildmates have **${result.unit.name}**:\n\n${top.join("\n")}${more > 0 ? `\n\n…and ${more} more.` : ""}\n\n${FOOT}`, needsWebSearch: false };
  }

  const [known, saved] = await Promise.all([
    lookupKnownCounters(intent.unit.id, intent.mode, playerId),
    listCounters({ enemyId: intent.unit.id, youPlayerId: playerId, limit: 5 }),
  ]);
  const savedForMode = saved.filter((counter) => !intent.mode || counter.mode === "BOTH" || (intent.mode === "TW" ? counter.mode === "TW" : counter.mode === "GAC"));
  if (known.counters.length || savedForMode.length) {
    return { text: formatCounterAnswer(intent.unit.name, intent.mode, known.counters, savedForMode), needsWebSearch: false };
  }
  const tips = await findNotesForBlue(intent.unit.name, 3).catch(() => []);
  if (tips.length) {
    const lines = tips.map((tip) => `**${tip.title}**\n${tip.body}`).join("\n\n");
    return {
      text: `The guild has no checked counter squad for **${intent.unit.name}**${intent.mode ? ` in ${MODE_LABELS[intent.mode]}` : ""} yet, but it does have tips (no AI used):\n\n${lines}\n\nCheck these in game before you rely on them. I can also search the web, which uses one of your questions.`,
      needsWebSearch: true,
      offer: { leaderUnitId: intent.unit.id, leaderName: intent.unit.name, mode: intent.mode },
    };
  }
  return {
    text: `Nobody has saved a counter for **${intent.unit.name}**${intent.mode ? ` in ${MODE_LABELS[intent.mode]}` : ""} yet. I checked the guild's counter knowledge base and the saved counters, with no AI used.\n\nYou can ask me to search the web, which uses one of your questions, or ask the guild for help.`,
    needsWebSearch: true,
    offer: { leaderUnitId: intent.unit.id, leaderName: intent.unit.name, mode: intent.mode },
  };
}
