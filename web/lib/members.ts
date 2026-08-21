import { getLatestGuildSnapshot } from "@/lib/guild-snapshot";
import { getMemberAttentionReasons } from "@/lib/wall-of-shame";

export type RosterMember = {
  playerId: string;
  name: string;
  galacticPower: bigint;
  characterPower: bigint;
  shipPower: bigint;
  raidTickets: number;
  lastActivityAt: Date | null;
  joinedAt: Date | null;
  rank: number;
  playerLevel: number;
  memberRole: string;
  galacticLegends: number | null;
  relicUnits: number | null;
  datacrons: number | null;
  profileSyncedAt: Date | null;
  attentionReasons: string[];
};

function compareGpDesc(a: { galacticPower: bigint }, b: { galacticPower: bigint }) {
  if (a.galacticPower > b.galacticPower) return -1;
  if (a.galacticPower < b.galacticPower) return 1;
  return 0;
}

export async function getRosterMembers(): Promise<RosterMember[]> {
  const snapshot = await getLatestGuildSnapshot();
  if (!snapshot?.members.length) return [];

  const averageGp = snapshot.members.reduce(
    (sum, member) => sum + member.galacticPower,
    BigInt(0),
  ) / BigInt(snapshot.members.length);

  return [...snapshot.members]
    .sort(compareGpDesc)
    .map((member, index) => {
      const profile = member.player.profileSnapshots[0];
      return {
        playerId: member.playerId,
        name: member.player.currentName,
        galacticPower: member.galacticPower,
        characterPower: member.characterPower ?? BigInt(0),
        shipPower: member.shipPower ?? BigInt(0),
        raidTickets: member.raidTickets ?? 0,
        lastActivityAt: member.lastActivityAt,
        joinedAt: member.player.membershipTerms[0]?.joinedAt ?? null,
        rank: index + 1,
        playerLevel: member.playerLevel ?? member.player.level ?? 0,
        memberRole: member.memberRole ?? "Member",
        galacticLegends: profile?.galacticLegends ?? null,
        relicUnits: profile?.relicUnits ?? null,
        datacrons: profile?.datacrons ?? null,
        profileSyncedAt: member.player.profileSyncedAt,
        attentionReasons: getMemberAttentionReasons(member, averageGp, snapshot.capturedAt),
      };
    });
}
