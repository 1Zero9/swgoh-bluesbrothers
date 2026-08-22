import { getPrisma } from "@/lib/prisma";

export type PlayerProgressionPoint = {
  capturedAt: string;
  galacticPower: string;
  characterPower: string;
  shipPower: string;
  galacticLegends: number;
  relicUnits: number;
};

export async function getPlayerProgression(playerId: string): Promise<PlayerProgressionPoint[]> {
  if (!process.env.DATABASE_URL) return [];
  const prisma = getPrisma();

  try {
    // 1. Fetch MemberSnapshots (GP history)
    const memberSnaps = await prisma.memberSnapshot.findMany({
      where: { playerId },
      orderBy: { guildSnapshot: { capturedAt: "asc" } },
      select: {
        galacticPower: true,
        characterPower: true,
        shipPower: true,
        guildSnapshot: {
          select: { capturedAt: true },
        },
      },
    });

    // 2. Fetch PlayerProfileSnapshots (GLs, Relics history)
    const profileSnaps = await prisma.playerProfileSnapshot.findMany({
      where: { playerId },
      orderBy: { capturedAt: "asc" },
      select: {
        capturedAt: true,
        galacticLegends: true,
        relicUnits: true,
      },
    });

    // Merge them by capturedAt date correlation
    const points: PlayerProgressionPoint[] = memberSnaps.map((mSnap) => {
      const date = mSnap.guildSnapshot.capturedAt;

      // Find the closest profile snapshot within a reasonable timeframe (e.g. 12 hours)
      const closestProfile = profileSnaps.reduce((closest, current) => {
        if (!closest) return current;
        const diffClosest = Math.abs(closest.capturedAt.getTime() - date.getTime());
        const diffCurrent = Math.abs(current.capturedAt.getTime() - date.getTime());
        return diffCurrent < diffClosest ? current : closest;
      }, null as typeof profileSnaps[0] | null);

      return {
        capturedAt: date.toISOString(),
        galacticPower: mSnap.galacticPower.toString(),
        characterPower: (mSnap.characterPower ?? BigInt(0)).toString(),
        shipPower: (mSnap.shipPower ?? BigInt(0)).toString(),
        galacticLegends: closestProfile?.galacticLegends ?? 0,
        relicUnits: closestProfile?.relicUnits ?? 0,
      };
    });

    return points;
  } catch (error) {
    console.error("Failed to query player progression history:", error);
    return [];
  }
}
