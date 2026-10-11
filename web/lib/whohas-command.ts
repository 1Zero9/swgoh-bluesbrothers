import { formatCounters } from "@/lib/counters";
import { listCounters } from "@/lib/counters-data";
import { findActiveMemberByDiscordId } from "@/lib/member-lookup";
import { siteUrl } from "@/lib/site-url";
import { formatHolders, resolveUnit, whoHas } from "@/lib/who-has";

export type CommandOption = { name: string; value?: string | number; focused?: boolean };

/** The text answer to a /whohas command. Slow (it reads every roster), so Discord is told to wait and the answer is sent after. */
export async function answerWhoHas(discordUserId: string | undefined, options: CommandOption[]): Promise<string> {
  const member = discordUserId ? await findActiveMemberByDiscordId(discordUserId).catch(() => null) : null;
  if (!member) return `Link your account first and I'll answer: sign in with Discord at ${siteUrl()}.`;

  const unitInput = String(options.find((option) => option.name === "unit")?.value ?? "");
  const minStars = Number(options.find((option) => option.name === "min_stars")?.value ?? 0) || 0;
  const result = await whoHas(unitInput, minStars);
  if (!result.unit) return `I couldn't find a unit called "${unitInput.slice(0, 60)}". Start typing and pick one from the list.`;
  return formatHolders(result.unit, result.holders, minStars, result.totalMembers);
}

/** Replaces the "thinking…" placeholder with the real answer (the interaction token is the credential). */
export async function editOriginalResponse(applicationId: string, token: string, content: string) {
  const response = await fetch(`https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 1990), allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Discord rejected the follow-up (${response.status})`);
}

/** The text answer to a /counter command: the guild's counters to an enemy leader and whether the asker can run them. */
export async function answerCounter(discordUserId: string | undefined, options: CommandOption[]): Promise<string> {
  const member = discordUserId ? await findActiveMemberByDiscordId(discordUserId).catch(() => null) : null;
  if (!member) return `Link your account first and I'll answer: sign in with Discord at ${siteUrl()}.`;

  const input = String(options.find((option) => option.name === "enemy")?.value ?? "");
  const enemy = resolveUnit(input);
  if (!enemy) return `I couldn't find a unit called "${input.slice(0, 60)}". Start typing and pick one from the list.`;

  const counters = await listCounters({ enemyId: enemy.id, youPlayerId: member.id, limit: 5 });
  return formatCounters(enemy.name, counters, `${siteUrl()}/counters`);
}
