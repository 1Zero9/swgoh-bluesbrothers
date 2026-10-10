import { getDashboardSummary } from "@/lib/dashboard";
import { getPrisma } from "@/lib/prisma";
import { describeWin, type WinKind } from "@/lib/wins";

export type PublicTwResult = { opponent: string; score: number; opponentScore: number; won: boolean; endedAt: Date | null };

export type PublicHomeData = {
  live: boolean;
  members: number;
  capacity: number;
  spaces: number;
  guildPower: bigint;
  galacticLegends: number;
  tw: { wins: number; losses: number; recent: PublicTwResult[] };
  highlights: { text: string; icon: string }[];
};

const empty: PublicHomeData = {
  live: false, members: 0, capacity: 50, spaces: 0, guildPower: BigInt(0), galacticLegends: 0,
  tw: { wins: 0, losses: 0, recent: [] }, highlights: [],
};

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const summary = await getDashboardSummary();
  const base: PublicHomeData = {
    ...empty,
    live: summary.live,
    members: summary.memberCount,
    capacity: summary.capacity,
    spaces: Math.max(0, summary.capacity - summary.memberCount),
    guildPower: summary.guildPower,
  };
  if (!process.env.DATABASE_URL) return base;

  try {
    const prisma = getPrisma();
    const [events, glRows, wins] = await Promise.all([
      prisma.guildEvent.findMany({
        where: { type: "TERRITORY_WAR", finalResult: { not: undefined } },
        orderBy: { startsAt: "desc" },
        take: 12,
        select: { finalResult: true },
      }),
      prisma.player.findMany({
        where: { membershipTerms: { some: { state: "ACTIVE" } } },
        select: { profileSnapshots: { orderBy: { capturedAt: "desc" }, take: 1, select: { galacticLegends: true } } },
      }),
      prisma.guildWin.findMany({
        where: {
          kind: { in: ["GL_UNLOCK", "ULTIMATE"] },
          occurredAt: { gte: new Date(Date.now() - 14 * 86_400_000) },
          player: { membershipTerms: { some: { state: "ACTIVE" } } },
        },
        orderBy: { occurredAt: "desc" },
        take: 4,
      }),
    ]);

    const results = events.flatMap((event): PublicTwResult[] => {
      const result = event.finalResult as { score?: unknown; opponentScore?: unknown; endTimeSeconds?: unknown; opponentGuildProfile?: { name?: unknown } } | null;
      if (!result) return [];
      const score = num(result.score);
      const opponentScore = num(result.opponentScore);
      if (!score && !opponentScore) return [];
      const ended = num(result.endTimeSeconds);
      return [{
        opponent: String(result.opponentGuildProfile?.name ?? "another guild"),
        score,
        opponentScore,
        won: score > opponentScore,
        endedAt: ended ? new Date(ended * 1000) : null,
      }];
    });

    return {
      ...base,
      galacticLegends: glRows.reduce((sum, row) => sum + (row.profileSnapshots[0]?.galacticLegends ?? 0), 0),
      tw: {
        wins: results.filter((r) => r.won).length,
        losses: results.filter((r) => !r.won).length,
        recent: results.slice(0, 4),
      },
      highlights: wins.map((win) => {
        const described = describeWin({ kind: win.kind as WinKind, subject: win.subject, value: win.value });
        // Public view: no member names.
        return { text: described.text, icon: described.icon };
      }),
    };
  } catch {
    return base;
  }
}
