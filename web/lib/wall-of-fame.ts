import { TICKET_TARGET_PER_MEMBER } from "@/lib/dashboard";
import { getPrisma } from "@/lib/prisma";

export type WallOfFameEntry = {
  playerId: string;
  name: string;
  galacticPower: bigint;
  raidTickets: number;
  rank: number;
  badges: string[];
};

const MAX_ENTRIES = 5;
const MIN_GUILD_SIZE = 4;

function compareGpDesc(a: bigint, b: bigint) {
  if (a > b) return -1;
  if (a < b) return 1;
  return 0;
}

export async function getWallOfFame(): Promise<WallOfFameEntry[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const snapshot = await getPrisma().guildSnapshot.findFirst({
      orderBy: { capturedAt: "desc" },
      include: { members: { include: { player: true } } },
    });
    if (!snapshot || snapshot.members.length < MIN_GUILD_SIZE) return [];

    const ranked = [...snapshot.members].sort((a, b) => compareGpDesc(a.galacticPower, b.galacticPower));

    return ranked.slice(0, MAX_ENTRIES).map((member, index) => {
      const badges: string[] = [];
      if (index === 0) badges.push("Top gun in the guild");
      if ((member.raidTickets ?? 0) >= TICKET_TARGET_PER_MEMBER) badges.push("Maxed raid tickets");

      return {
        playerId: member.playerId,
        name: member.player.currentName,
        galacticPower: member.galacticPower,
        raidTickets: member.raidTickets ?? 0,
        rank: index + 1,
        badges,
      };
    });
  } catch {
    return [];
  }
}
