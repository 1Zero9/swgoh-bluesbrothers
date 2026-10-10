import { getPrisma } from "@/lib/prisma";
import { postDiscordAnnouncement } from "@/lib/discord";
import { siteUrl } from "@/lib/site-url";
import { evaluateCallout, type CalloutProgress, type CalloutRoster } from "@/lib/tb-callout-match";
import { UNIT_CHECKLIST } from "@/lib/unit-checklist";
import { unitName } from "@/lib/wins";

export type CalloutView = {
  id: string;
  unitId: string;
  unitName: string;
  minStars: number;
  minRelic: number;
  needed: number | null;
  phase: number | null;
  planetName: string | null;
  note: string | null;
  status: "OPEN" | "CLOSED";
  createdBy: string | null;
  createdAt: Date;
  progress: CalloutProgress;
};

export type UnitOption = { id: string; name: string };

type RawUnit = { definitionId?: unknown; currentRarity?: unknown; relic?: { currentTier?: unknown } | null };

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function loadRosters(): Promise<CalloutRoster[]> {
  const snapshot = await getPrisma().guildSnapshot.findFirst({
    orderBy: { capturedAt: "desc" },
    select: { members: { select: { player: { select: { id: true, currentName: true, discordUserId: true, profilePayload: true } } } } },
  });
  if (!snapshot) return [];

  return snapshot.members.map(({ player }) => {
    const payload = player.profilePayload;
    const roster = payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as { rosterUnit?: unknown }).rosterUnit
      : null;
    if (!Array.isArray(roster)) return { playerId: player.id, playerName: player.currentName, discordUserId: player.discordUserId, units: null };

    const units = new Map<string, { stars: number; relic: number }>();
    for (const unit of roster as RawUnit[]) {
      const id = String(unit?.definitionId ?? "").split(":")[0];
      if (id) units.set(id, { stars: num(unit.currentRarity), relic: Math.max(0, num(unit.relic?.currentTier) - 2) });
    }
    return { playerId: player.id, playerName: player.currentName, discordUserId: player.discordUserId, units };
  });
}

export async function getCalloutUnitOptions(): Promise<UnitOption[]> {
  const known = new Map<string, string>();
  for (const group of Object.values(UNIT_CHECKLIST)) for (const unit of group) known.set(unit.definitionId, unit.name);
  try {
    for (const roster of await loadRosters()) {
      for (const id of roster.units?.keys() ?? []) if (!known.has(id)) known.set(id, unitName(id) ?? id);
    }
  } catch {
    // Fall back to the curated list.
  }
  return [...known].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listCallouts(): Promise<CalloutView[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const prisma = getPrisma();
    const [rows, rosters] = await Promise.all([
      prisma.tbCallout.findMany({ orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 30 }),
      loadRosters(),
    ]);
    return rows.map((row) => ({
      id: row.id,
      unitId: row.unitId,
      unitName: row.unitName,
      minStars: row.minStars,
      minRelic: row.minRelic,
      needed: row.needed,
      phase: row.phase,
      planetName: row.planetName,
      note: row.note,
      status: row.status === "CLOSED" ? "CLOSED" : "OPEN",
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      progress: evaluateCallout(
        { unitId: row.unitId, minStars: row.minStars, minRelic: row.minRelic, needed: row.needed },
        rosters,
      ),
    }));
  } catch {
    return [];
  }
}

function requirementLabel(callout: Pick<CalloutView, "minStars" | "minRelic">) {
  return callout.minRelic > 0 ? `${callout.minStars}★ Relic ${callout.minRelic}+` : `${callout.minStars}★`;
}

export function calloutHeadline(callout: Pick<CalloutView, "unitName" | "minStars" | "minRelic" | "phase" | "planetName">) {
  const where = [callout.phase ? `Phase ${callout.phase}` : "", callout.planetName ?? ""].filter(Boolean).join(" · ");
  return `${callout.unitName} — ${requirementLabel(callout)}${where ? ` (${where})` : ""}`;
}

export async function postCalloutToDiscord(callout: CalloutView) {
  const webhookUrl = process.env.DISCORD_CALLOUTS_WEBHOOK_URL || process.env.DISCORD_WINS_WEBHOOK_URL;
  if (!webhookUrl) return false;
  const { progress } = callout;
  const baseUrl = siteUrl();

  const closest = progress.close.slice(0, 8);
  const lines = [
    `**${progress.readyCount}${callout.needed ? ` of ${callout.needed}` : ""}** ready so far.`,
    callout.note ?? "",
    progress.close.length
      ? `**Closest to ready:**\n${closest.map((m) => `• ${m.discordUserId ? `<@${m.discordUserId}>` : m.name} (${m.gap})`).join("\n")}`
      : "",
    `Full list: ${baseUrl}/territory-battles#callouts`,
  ].filter(Boolean);

  await postDiscordAnnouncement(
    {
      title: `TB callout: ${calloutHeadline(callout)}`,
      description: lines.join("\n\n"),
      color: 0x38bdf8,
      websiteUrl: `${baseUrl}/territory-battles#callouts`,
      footer: "Blues Brothers · TB callouts",
      mentionUserIds: closest.flatMap((m) => (m.discordUserId ? [m.discordUserId] : [])),
    },
    webhookUrl,
  );
  return true;
}
