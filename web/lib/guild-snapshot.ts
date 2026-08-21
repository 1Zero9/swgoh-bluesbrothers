import { cache } from "react";
import { getPrisma } from "@/lib/prisma";

export type GuildSnapshotMember = {
  playerId: string;
  galacticPower: bigint;
  characterPower: bigint | null;
  shipPower: bigint | null;
  raidTickets: number | null;
  lastActivityAt: Date | null;
  playerLevel: number | null;
  memberRole: string | null;
  player: {
    currentName: string;
    level: number | null;
    profileSyncedAt: Date | null;
    membershipTerms: { joinedAt: Date }[];
    profileSnapshots: { galacticLegends: number; relicUnits: number; datacrons: number }[];
  };
};

export type GuildSnapshotWithMembers = {
  id: string;
  capturedAt: Date;
  guildId: string;
  members: GuildSnapshotMember[];
} | null;

/**
 * Fetches the latest guild snapshot with the fields needed across the
 * roster/standings pages (wall of fame, wall of shame, member directory,
 * member context). Deliberately excludes the large `rawPayload`/
 * `profilePayload` JSON blobs, which only individual consumers that
 * genuinely need them (guild-arsenal, territory-war) fetch separately.
 *
 * Wrapped in React's `cache()` so multiple lib functions calling this
 * within the same request/render only hit Postgres once.
 */
export const getLatestGuildSnapshot = cache(async (): Promise<GuildSnapshotWithMembers> => {
  if (!process.env.DATABASE_URL) return null;

  try {
    return await getPrisma().guildSnapshot.findFirst({
      orderBy: { capturedAt: "desc" },
      select: {
        id: true,
        capturedAt: true,
        guildId: true,
        members: {
          select: {
            playerId: true,
            galacticPower: true,
            characterPower: true,
            shipPower: true,
            raidTickets: true,
            lastActivityAt: true,
            playerLevel: true,
            memberRole: true,
            player: {
              select: {
                currentName: true,
                level: true,
                profileSyncedAt: true,
                membershipTerms: {
                  where: { state: "ACTIVE" },
                  orderBy: { joinedAt: "desc" },
                  take: 1,
                  select: { joinedAt: true },
                },
                profileSnapshots: {
                  orderBy: { capturedAt: "desc" },
                  take: 1,
                  select: { galacticLegends: true, relicUnits: true, datacrons: true },
                },
              },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
});
