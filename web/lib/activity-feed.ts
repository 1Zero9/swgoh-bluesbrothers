import { getPrisma } from "@/lib/prisma";
import { describeWin, type WinKind, type WinTier } from "@/lib/wins";

export type ActivityGroup = "stars" | "gear" | "relics" | "legends" | "units";

export type ActivityItem = {
  id: string;
  who: string;
  text: string;
  tag: string;
  tier: WinTier;
  group: ActivityGroup;
  /** "17h", "3d": how long ago, like the in-game feed. */
  ago: string;
  at: string;
};

const GROUP_OF: Record<string, ActivityGroup> = {
  STAR: "stars", GEAR: "gear", RELIC: "relics", FIRST_R9: "relics",
  GL_UNLOCK: "legends", ULTIMATE: "legends", UNIT_UNLOCK: "units", DATACRON: "units",
};

/** "just now", "5m", "17h", "3d": compact, like the in-game chat. */
export function agoLabel(from: Date, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - from.getTime()) / 60_000));
  if (minutes < 2) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export const ACTIVITY_DAYS = 14;

/** Everything the guild has done lately, newest first: the same lines the game's guild chat shows. */
export async function getActivityFeed(limit = 400): Promise<ActivityItem[]> {
  if (!process.env.DATABASE_URL) return [];
  const since = new Date(Date.now() - ACTIVITY_DAYS * 86_400_000);
  const rows = await getPrisma().guildWin.findMany({
    where: { occurredAt: { gte: since }, player: { membershipTerms: { some: { state: "ACTIVE" } } } },
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: { player: { select: { currentName: true } } },
  });
  const now = Date.now();
  return rows.map((row) => {
    const described = describeWin({ kind: row.kind as WinKind, subject: row.subject, value: row.value });
    return { id: row.id, who: row.player.currentName, text: described.text, tag: described.tag, tier: described.tier, group: GROUP_OF[row.kind] ?? "units", ago: agoLabel(row.occurredAt, now), at: row.occurredAt.toISOString() };
  });
}
