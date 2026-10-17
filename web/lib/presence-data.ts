import { getPrisma } from "@/lib/prisma";
import { agoLabel, GAME_RECENT_MS, isOnSite, parseActivity, SITE_ONLINE_MS } from "@/lib/presence";

export type PresenceSummary = {
  site: { id: string; name: string; you: boolean }[];
  /** null when Discord's server widget is not switched on, so nothing is shown. */
  discord: { name: string; status: string }[] | null;
  game: { id: string; name: string; ago: string }[];
  /** Seen on the site in the last day but not right now. */
  recent: { id: string; name: string; ago: string }[];
};

export async function touchPresence(playerId: string, name: string, path: string | null, hidden: boolean) {
  const data = { playerName: name.slice(0, 80), lastSeenAt: new Date(), path, hidden };
  await getPrisma().memberPresence.upsert({ where: { playerId }, create: { playerId, ...data }, update: data });
}

/** Discord's public server widget lists who is online (names and status only). It works only when the server turned the widget on. */
async function discordOnline(): Promise<PresenceSummary["discord"]> {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return null;
  try {
    const response = await fetch(`https://discord.com/api/guilds/${encodeURIComponent(guildId)}/widget.json`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const json = (await response.json()) as { members?: { username?: string; status?: string }[] };
    return (json.members ?? []).filter((m) => m.username).slice(0, 60).map((m) => ({ name: String(m.username).slice(0, 40), status: m.status === "idle" || m.status === "dnd" ? m.status : "online" }));
  } catch {
    return null;
  }
}

export async function presenceSummary(viewerId: string | null): Promise<PresenceSummary> {
  const db = getPrisma();
  const now = Date.now();
  const [rows, discord, gameRows, earlier] = await Promise.all([
    db.memberPresence.findMany({ where: { lastSeenAt: { gte: new Date(now - SITE_ONLINE_MS) } }, orderBy: { playerName: "asc" } }),
    discordOnline(),
    db.$queryRaw<{ id: string; name: string; at: string | null }[]>`
      SELECT p.id, p."currentName" AS name, p."profilePayload"->>'lastActivityTime' AS at
      FROM "Player" p
      WHERE p."profilePayload" IS NOT NULL
        AND EXISTS (SELECT 1 FROM "MembershipTerm" m WHERE m."playerId" = p.id AND m.state = 'ACTIVE')
        AND NOT EXISTS (SELECT 1 FROM "MemberPresence" h WHERE h."playerId" = p.id AND h.hidden = true)`.catch(() => []),
    db.memberPresence.findMany({ where: { hidden: false, lastSeenAt: { gte: new Date(now - 24 * 3_600_000), lt: new Date(now - SITE_ONLINE_MS) } }, orderBy: { lastSeenAt: "desc" }, take: 20 }),
  ]);
  const site = rows.filter((row) => !row.hidden && isOnSite(row.lastSeenAt, now)).map((row) => ({ id: row.playerId, name: row.playerName, you: row.playerId === viewerId }));
  const onSite = new Set(site.map((entry) => entry.id));
  const game = gameRows
    .map((row) => ({ id: row.id, name: row.name, at: parseActivity(row.at) }))
    .filter((row): row is { id: string; name: string; at: Date } => row.at !== null && now - row.at.getTime() < GAME_RECENT_MS && !onSite.has(row.id))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 30)
    .map((row) => ({ id: row.id, name: row.name, ago: agoLabel(row.at, now) }));
  const recent = earlier.map((row) => ({ id: row.playerId, name: row.playerName, ago: agoLabel(row.lastSeenAt, now) }));
  return { site, discord, game, recent };
}
