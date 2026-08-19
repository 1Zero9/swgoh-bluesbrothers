import { getPrisma } from "@/lib/prisma";

export type DashboardSummary = {
  memberCount: number;
  capacity: number;
  guildPower: bigint;
  dailyTickets: number;
  ticketTarget: number;
  capturedAt: Date | null;
  live: boolean;
};

const CAPACITY = 50;
export const TICKET_TARGET_PER_MEMBER = 600;

const fallbackSummary: DashboardSummary = {
  memberCount: 0,
  capacity: CAPACITY,
  guildPower: BigInt(0),
  dailyTickets: 0,
  ticketTarget: CAPACITY * TICKET_TARGET_PER_MEMBER,
  capturedAt: null,
  live: false,
};

export type RosterPreview = {
  initials: string[];
  total: number;
  live: boolean;
};

export async function getRosterPreview(): Promise<RosterPreview> {
  if (!process.env.DATABASE_URL) return { initials: [], total: 0, live: false };

  try {
    const snapshot = await getPrisma().guildSnapshot.findFirst({
      orderBy: { capturedAt: "desc" },
      include: {
        members: {
          include: { player: true },
          orderBy: { galacticPower: "desc" },
          take: 3,
        },
      },
    });
    if (!snapshot) return { initials: [], total: 0, live: false };

    return {
      initials: snapshot.members.map((member) => member.player.currentName.trim().charAt(0).toUpperCase() || "?"),
      total: snapshot.memberCount,
      live: true,
    };
  } catch {
    return { initials: [], total: 0, live: false };
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!process.env.DATABASE_URL) return fallbackSummary;

  try {
    const snapshot = await getPrisma().guildSnapshot.findFirst({
      orderBy: { capturedAt: "desc" },
    });
    if (!snapshot) return fallbackSummary;

    return {
      memberCount: snapshot.memberCount,
      capacity: CAPACITY,
      guildPower: snapshot.galacticPower,
      dailyTickets: snapshot.raidTickets ?? 0,
      ticketTarget: snapshot.memberCount * TICKET_TARGET_PER_MEMBER,
      capturedAt: snapshot.capturedAt,
      live: true,
    };
  } catch {
    return fallbackSummary;
  }
}
