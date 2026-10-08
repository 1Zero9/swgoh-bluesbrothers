import { getPrisma } from "@/lib/prisma";
import { describeWin, type WinKind, type WinTier } from "@/lib/wins";

export type FeedWin = {
  id: string;
  who: string;
  text: string;
  tag: string;
  icon: string;
  tier: WinTier;
  occurredAt: Date;
};

export type WinsFeed = {
  live: boolean;
  weekly: { galacticLegends: number; ultimates: number; relics: number; members: number };
  days: { label: string; wins: FeedWin[] }[];
};

const FEED_DAYS = 21;
const empty: WinsFeed = { live: false, weekly: { galacticLegends: 0, ultimates: 0, relics: 0, members: 0 }, days: [] };

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
}

export async function getWinsFeed(): Promise<WinsFeed> {
  if (!process.env.DATABASE_URL) return empty;

  try {
    const since = new Date(Date.now() - FEED_DAYS * 86_400_000);
    const rows = await getPrisma().guildWin.findMany({
      where: { occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      include: { player: { select: { currentName: true } } },
    });

    const weekAgo = Date.now() - 7 * 86_400_000;
    const week = rows.filter((row) => row.occurredAt.getTime() >= weekAgo);
    const weekly = {
      galacticLegends: week.filter((row) => row.kind === "GL_UNLOCK").length,
      ultimates: week.filter((row) => row.kind === "ULTIMATE").length,
      relics: week.filter((row) => row.kind === "RELIC").length,
      members: new Set(week.map((row) => row.playerId)).size,
    };

    const days = new Map<string, FeedWin[]>();
    for (const row of rows) {
      const described = describeWin({ kind: row.kind as WinKind, subject: row.subject, value: row.value });
      const label = dayLabel(row.occurredAt);
      const list = days.get(label) ?? [];
      list.push({ id: row.id, who: row.player.currentName, occurredAt: row.occurredAt, ...described });
      days.set(label, list);
    }

    return {
      live: true,
      weekly,
      days: [...days].map(([label, wins]) => ({
        label,
        wins: [...wins].sort((a, b) => Number(b.tier === "headline") - Number(a.tier === "headline")),
      })),
    };
  } catch {
    return empty;
  }
}
