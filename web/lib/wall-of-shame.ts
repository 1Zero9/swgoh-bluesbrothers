import { getPrisma } from "@/lib/prisma";

export type WallOfShameEntry = {
  playerId: string;
  name: string;
  galacticPower: bigint;
  raidTickets: number;
  lastActivityAt: Date | null;
  reasons: string[];
};

const GP_THRESHOLD_RATIO = 65;
const INACTIVITY_HOURS = 48;
const MAX_ENTRIES = 5;
const MIN_GUILD_SIZE = 4;

function compareGp(a: bigint, b: bigint) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

async function computeAllEntries(): Promise<WallOfShameEntry[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const snapshot = await getPrisma().guildSnapshot.findFirst({
      orderBy: { capturedAt: "desc" },
      include: { members: { include: { player: true } } },
    });
    if (!snapshot || snapshot.members.length < MIN_GUILD_SIZE) return [];

    const totalGp = snapshot.members.reduce((sum, member) => sum + member.galacticPower, BigInt(0));
    const averageGp = totalGp / BigInt(snapshot.members.length);
    const gpFloor = (averageGp * BigInt(GP_THRESHOLD_RATIO)) / BigInt(100);
    const capturedAtMs = snapshot.capturedAt.getTime();

    const entries = snapshot.members.flatMap((member) => {
      const reasons: string[] = [];
      if (member.galacticPower > BigInt(0) && member.galacticPower < gpFloor) {
        reasons.push("Under-geared next to the rest of the crew");
      }
      const hoursSinceActive = member.lastActivityAt
        ? (capturedAtMs - member.lastActivityAt.getTime()) / 3_600_000
        : null;
      if (hoursSinceActive === null || hoursSinceActive > INACTIVITY_HOURS) {
        reasons.push("Gone quiet on the holonet");
      }
      if (!reasons.length) return [];

      return [{
        playerId: member.playerId,
        name: member.player.currentName,
        galacticPower: member.galacticPower,
        raidTickets: member.raidTickets ?? 0,
        lastActivityAt: member.lastActivityAt,
        reasons,
      }];
    });

    return entries.sort((a, b) => compareGp(a.galacticPower, b.galacticPower));
  } catch {
    return [];
  }
}

export async function getWallOfShame(): Promise<WallOfShameEntry[]> {
  const entries = await computeAllEntries();
  return entries.slice(0, MAX_ENTRIES);
}

export async function getWallOfShameStatus(playerId: string): Promise<string[]> {
  const entries = await computeAllEntries();
  return entries.find((entry) => entry.playerId === playerId)?.reasons ?? [];
}
