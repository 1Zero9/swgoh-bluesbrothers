import { getLatestGuildSnapshot } from "@/lib/guild-snapshot";
import { getPrisma } from "@/lib/prisma";
import { getMemberAttentionReasons } from "@/lib/wall-of-shame";

export type NewRosterMember = {
  playerId: string;
  name: string;
  joinedAt: Date;
  galacticPower: bigint | null;
  memberRole: string | null;
};

export type DepartedRosterMember = {
  playerId: string;
  name: string;
  joinedAt: Date;
  leftAt: Date;
  tenureDays: number;
};

const NEW_MEMBER_WINDOW_DAYS = 30;
const DEPARTED_WINDOW_DAYS = 60;
const DEPARTED_MAX_ENTRIES = 12;

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
        attentionReasons: getMemberAttentionReasons(
          { ...member, profileSyncedAt: member.player.profileSyncedAt },
          averageGp,
          snapshot.capturedAt,
        ),
      };
    });
}

export async function getRosterChanges(): Promise<{
  newMembers: NewRosterMember[];
  departedMembers: DepartedRosterMember[];
}> {
  const snapshot = await getLatestGuildSnapshot();
  if (!snapshot || !process.env.DATABASE_URL) return { newMembers: [], departedMembers: [] };

  const guildId = snapshot.guildId;
  const prisma = getPrisma();
  const cutoffNew = new Date(Date.now() - NEW_MEMBER_WINDOW_DAYS * 86_400_000);
  const cutoffDeparted = new Date(Date.now() - DEPARTED_WINDOW_DAYS * 86_400_000);
  const gpByPlayer = new Map(snapshot.members.map((member) => [member.playerId, member.galacticPower]));
  const roleByPlayer = new Map(snapshot.members.map((member) => [member.playerId, member.memberRole]));

  try {
    const [joined, departed] = await Promise.all([
      prisma.membershipTerm.findMany({
        where: { guildId, state: "ACTIVE", joinedAt: { gte: cutoffNew } },
        orderBy: { joinedAt: "desc" },
        include: { player: { select: { currentName: true } } },
      }),
      prisma.membershipTerm.findMany({
        where: { guildId, state: "LEFT", leftAt: { gte: cutoffDeparted } },
        orderBy: { leftAt: "desc" },
        take: DEPARTED_MAX_ENTRIES,
        include: { player: { select: { currentName: true } } },
      }),
    ]);

    return {
      newMembers: joined.map((term) => ({
        playerId: term.playerId,
        name: term.player.currentName,
        joinedAt: term.joinedAt,
        galacticPower: gpByPlayer.get(term.playerId) ?? null,
        memberRole: roleByPlayer.get(term.playerId) ?? null,
      })),
      departedMembers: departed.map((term) => ({
        playerId: term.playerId,
        name: term.player.currentName,
        joinedAt: term.joinedAt,
        leftAt: term.leftAt as Date,
        tenureDays: Math.max(0, Math.round(((term.leftAt as Date).getTime() - term.joinedAt.getTime()) / 86_400_000)),
      })),
    };
  } catch {
    return { newMembers: [], departedMembers: [] };
  }
}
