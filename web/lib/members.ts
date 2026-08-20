import { getPrisma } from "@/lib/prisma";
import { getMemberAttentionReasons } from "@/lib/wall-of-shame";

export type RosterMember = {
  playerId: string;
  name: string;
  galacticPower: bigint;
  raidTickets: number;
  lastActivityAt: Date | null;
  joinedAt: Date | null;
  rank: number;
  attentionReasons: string[];
};

function compareGpDesc(a: { galacticPower: bigint }, b: { galacticPower: bigint }) {
  if (a.galacticPower > b.galacticPower) return -1;
  if (a.galacticPower < b.galacticPower) return 1;
  return 0;
}

export async function getRosterMembers(): Promise<RosterMember[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const snapshot = await getPrisma().guildSnapshot.findFirst({
      orderBy: { capturedAt: "desc" },
      include: {
        members: {
          include: {
            player: {
              include: {
                membershipTerms: {
                  where: { state: "ACTIVE" },
                  orderBy: { joinedAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    if (!snapshot?.members.length) return [];

    const averageGp = snapshot.members.reduce(
      (sum, member) => sum + member.galacticPower,
      BigInt(0),
    ) / BigInt(snapshot.members.length);

    return [...snapshot.members]
      .sort(compareGpDesc)
      .map((member, index) => ({
        playerId: member.playerId,
        name: member.player.currentName,
        galacticPower: member.galacticPower,
        raidTickets: member.raidTickets ?? 0,
        lastActivityAt: member.lastActivityAt,
        joinedAt: member.player.membershipTerms[0]?.joinedAt ?? null,
        rank: index + 1,
        attentionReasons: getMemberAttentionReasons(member, averageGp, snapshot.capturedAt),
      }));
  } catch {
    return [];
  }
}
