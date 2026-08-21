import { TICKET_TARGET_PER_MEMBER } from "@/lib/dashboard";
import { getLatestGuildSnapshot } from "@/lib/guild-snapshot";

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
const TICKET_FLOOR_RATIO = 0.5;
const STALE_PROFILE_DAYS = 7;
const MAX_ENTRIES = 8;
const MIN_GUILD_SIZE = 4;

export function getMemberAttentionReasons(
  member: {
    galacticPower: bigint;
    lastActivityAt: Date | null;
    raidTickets?: number | null;
    profileSyncedAt?: Date | null;
  },
  averageGp: bigint,
  capturedAt: Date,
) {
  const reasons: string[] = [];
  const gpFloor = (averageGp * BigInt(GP_THRESHOLD_RATIO)) / BigInt(100);
  if (member.galacticPower > BigInt(0) && member.galacticPower < gpFloor) {
    reasons.push("Under-geared next to the rest of the crew");
  }

  const hoursSinceActive = member.lastActivityAt
    ? (capturedAt.getTime() - member.lastActivityAt.getTime()) / 3_600_000
    : null;
  if (hoursSinceActive === null || hoursSinceActive > INACTIVITY_HOURS) {
    reasons.push("Gone quiet on the holonet");
  }

  const ticketFloor = TICKET_TARGET_PER_MEMBER * TICKET_FLOOR_RATIO;
  if ((member.raidTickets ?? 0) < ticketFloor) {
    reasons.push("Raid tickets running low");
  }

  const daysSinceProfileSync = member.profileSyncedAt
    ? (capturedAt.getTime() - member.profileSyncedAt.getTime()) / 86_400_000
    : null;
  if (member.profileSyncedAt === undefined) {
    // Caller did not supply profile sync data — skip this check rather than false-flag.
  } else if (daysSinceProfileSync === null || daysSinceProfileSync > STALE_PROFILE_DAYS) {
    reasons.push("Profile hasn't rotated through sync recently");
  }

  return reasons;
}

function compareGp(a: bigint, b: bigint) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

async function computeAllEntries(): Promise<WallOfShameEntry[]> {
  const snapshot = await getLatestGuildSnapshot();
  if (!snapshot || snapshot.members.length < MIN_GUILD_SIZE) return [];

  const totalGp = snapshot.members.reduce((sum, member) => sum + member.galacticPower, BigInt(0));
  const averageGp = totalGp / BigInt(snapshot.members.length);

  const entries = snapshot.members.flatMap((member) => {
    const reasons = getMemberAttentionReasons(
      {
        galacticPower: member.galacticPower,
        lastActivityAt: member.lastActivityAt,
        raidTickets: member.raidTickets,
        profileSyncedAt: member.player.profileSyncedAt,
      },
      averageGp,
      snapshot.capturedAt,
    );
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

  return entries.sort((a, b) => b.reasons.length - a.reasons.length || compareGp(a.galacticPower, b.galacticPower));
}

export async function getWallOfShame(): Promise<WallOfShameEntry[]> {
  const entries = await computeAllEntries();
  return entries.slice(0, MAX_ENTRIES);
}

export async function getWallOfShameStatus(playerId: string): Promise<string[]> {
  const entries = await computeAllEntries();
  return entries.find((entry) => entry.playerId === playerId)?.reasons ?? [];
}
