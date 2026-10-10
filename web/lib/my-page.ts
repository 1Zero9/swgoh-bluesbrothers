import { getPrisma } from "@/lib/prisma";
import { getWallOfShameStatus } from "@/lib/wall-of-shame";
import { calloutHeadline, listCallouts } from "@/lib/tb-callouts";
import { describeWin, type WinKind } from "@/lib/wins";

export type MyCallout = { id: string; headline: string; status: "ready" | "close"; gap: string; readyCount: number; needed: number | null };

export type MyPageData = {
  name: string;
  rank: string;
  level: number | null;
  galacticPower: bigint;
  raidTickets: number;
  lastActivityAt: Date | null;
  joinedAt: Date | null;
  galacticLegends: number;
  relicUnits: number;
  datacrons: number;
  glChange30d: number;
  relicChange30d: number;
  wins: { id: string; text: string; icon: string; tag: string; occurredAt: Date }[];
  callouts: MyCallout[];
  standing: string[];
};

export async function getMyPage(playerId: string): Promise<MyPageData | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const prisma = getPrisma();
    const since30 = new Date(Date.now() - 30 * 86_400_000);
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        currentName: true,
        level: true,
        snapshots: {
          orderBy: { guildSnapshot: { capturedAt: "desc" } },
          take: 1,
          select: { galacticPower: true, raidTickets: true, lastActivityAt: true, memberRole: true, playerLevel: true },
        },
        membershipTerms: { where: { state: "ACTIVE" }, orderBy: { joinedAt: "desc" }, take: 1, select: { joinedAt: true } },
        profileSnapshots: { orderBy: { capturedAt: "desc" }, take: 1, select: { galacticLegends: true, relicUnits: true, datacrons: true } },
      },
    });
    if (!player) return null;

    const [older, wins, callouts, standing] = await Promise.all([
      prisma.playerProfileSnapshot.findFirst({
        where: { playerId, capturedAt: { lte: since30 } },
        orderBy: { capturedAt: "desc" },
        select: { galacticLegends: true, relicUnits: true },
      }),
      prisma.guildWin.findMany({
        where: { playerId, occurredAt: { gte: new Date(Date.now() - 60 * 86_400_000) } },
        orderBy: { occurredAt: "desc" },
        take: 30,
      }),
      listCallouts(),
      getWallOfShameStatus(playerId),
    ]);

    const latest = player.snapshots[0];
    const profile = player.profileSnapshots[0];

    const mine: MyCallout[] = callouts
      .filter((callout) => callout.status === "OPEN")
      .flatMap((callout) => {
        const ready = callout.progress.ready.some((member) => member.name === player.currentName);
        const close = callout.progress.close.find((member) => member.name === player.currentName);
        if (!ready && !close) return [];
        return [{
          id: callout.id,
          headline: calloutHeadline(callout),
          status: ready ? ("ready" as const) : ("close" as const),
          gap: close?.gap ?? "",
          readyCount: callout.progress.readyCount,
          needed: callout.needed,
        }];
      });

    return {
      name: player.currentName,
      rank: latest?.memberRole ?? "Member",
      level: latest?.playerLevel ?? player.level ?? null,
      galacticPower: latest?.galacticPower ?? BigInt(0),
      raidTickets: latest?.raidTickets ?? 0,
      lastActivityAt: latest?.lastActivityAt ?? null,
      joinedAt: player.membershipTerms[0]?.joinedAt ?? null,
      galacticLegends: profile?.galacticLegends ?? 0,
      relicUnits: profile?.relicUnits ?? 0,
      datacrons: profile?.datacrons ?? 0,
      glChange30d: older && profile ? profile.galacticLegends - older.galacticLegends : 0,
      relicChange30d: older && profile ? profile.relicUnits - older.relicUnits : 0,
      wins: wins.map((win) => {
        const described = describeWin({ kind: win.kind as WinKind, subject: win.subject, value: win.value });
        return { id: win.id, text: described.text, icon: described.icon, tag: described.tag, occurredAt: win.occurredAt };
      }),
      callouts: mine,
      standing,
    };
  } catch {
    return null;
  }
}
