import { TICKET_TARGET_PER_MEMBER } from "@/lib/dashboard";
import { getLatestGuildSnapshot } from "@/lib/guild-snapshot";
import { getRosterMembers } from "@/lib/members";
import { getPrisma } from "@/lib/prisma";
import { getRaidRoom } from "@/lib/raids";
import { getTerritoryWarRoom } from "@/lib/territory-war";

export type OfficerRosterRow = {
  playerId: string;
  name: string;
  role: string | null;
  state: "ACTIVE" | "LEFT";
  joinedAt: Date;
  leftAt: Date | null;
  tenureDays: number;
  galacticPower: bigint | null;
  raidTickets: number | null;
  ticketTarget: number;
  lastActivityAt: Date | null;
  raidLabel: string | null;
  raidParticipated: boolean | null;
  raidDamage: number | null;
  twLabel: string | null;
  twJoined: boolean | null;
  flags: string[];
  needsAttention: boolean;
};

export type OfficerRosterReport = {
  capturedAt: Date | null;
  raidLabel: string | null;
  twLabel: string | null;
  rows: OfficerRosterRow[];
};

const empty: OfficerRosterReport = { capturedAt: null, raidLabel: null, twLabel: null, rows: [] };

function tenureDays(joinedAt: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - joinedAt.getTime()) / 86_400_000));
}

export async function getOfficerRosterReport(): Promise<OfficerRosterReport> {
  if (!process.env.DATABASE_URL) return empty;

  try {
    const snapshot = await getLatestGuildSnapshot();
    if (!snapshot?.guildId) return empty;

    const prisma = getPrisma();
    const [roster, terms, raidRoom, twRoom] = await Promise.all([
      getRosterMembers(),
      prisma.membershipTerm.findMany({
        where: { guildId: snapshot.guildId },
        include: { player: { select: { currentName: true } } },
        orderBy: { joinedAt: "desc" },
      }),
      getRaidRoom(),
      getTerritoryWarRoom(),
    ]);

    if (!terms.length) return empty;

    const latestTermByPlayer = new Map<string, (typeof terms)[number]>();
    for (const term of terms) {
      if (!latestTermByPlayer.has(term.playerId)) latestTermByPlayer.set(term.playerId, term);
    }

    const activeByPlayer = new Map(roster.map((member) => [member.playerId, member]));

    const latestRaid = raidRoom.raids[0] ?? null;
    const raidDataAvailable = Boolean(latestRaid);
    const raidByPlayer = new Map((latestRaid?.participants ?? []).map((entry) => [entry.playerId, entry]));

    const twDataAvailable = twRoom.active;
    const twJoinedByPlayer = new Map(
      twDataAvailable ? twRoom.members.map((member) => [member.playerId, member.joined]) : [],
    );
    const twLabel = twDataAvailable
      ? twRoom.opponentName
        ? `Current war vs ${twRoom.opponentName}`
        : "Current war"
      : null;

    const now = new Date();
    const rows: OfficerRosterRow[] = Array.from(latestTermByPlayer.values()).map((term) => {
      const state = term.state as "ACTIVE" | "LEFT";
      const active = state === "ACTIVE" ? activeByPlayer.get(term.playerId) : undefined;
      const end = term.leftAt ?? now;

      const raidEntry = raidDataAvailable ? raidByPlayer.get(term.playerId) : undefined;
      const raidParticipated = state !== "ACTIVE" ? null : raidDataAvailable ? Boolean(raidEntry) : null;

      const twJoined = state !== "ACTIVE" ? null : twDataAvailable ? twJoinedByPlayer.get(term.playerId) ?? false : null;

      const flags = state === "ACTIVE" ? [...(active?.attentionReasons ?? [])] : [];
      if (state === "ACTIVE" && raidParticipated === false) flags.push("Sat out the last raid");
      if (state === "ACTIVE" && twJoined === false) flags.push("Didn't join the last war");

      return {
        playerId: term.playerId,
        name: active?.name ?? term.player.currentName,
        role: active?.memberRole ?? null,
        state,
        joinedAt: term.joinedAt,
        leftAt: term.leftAt,
        tenureDays: tenureDays(term.joinedAt, end),
        galacticPower: active?.galacticPower ?? null,
        raidTickets: active?.raidTickets ?? null,
        ticketTarget: TICKET_TARGET_PER_MEMBER,
        lastActivityAt: active?.lastActivityAt ?? null,
        raidLabel: latestRaid?.label ?? null,
        raidParticipated,
        raidDamage: raidEntry?.damage ?? null,
        twLabel,
        twJoined,
        flags,
        needsAttention: state === "ACTIVE" && flags.length > 0,
      };
    });

    rows.sort((a, b) => {
      if (a.state !== b.state) return a.state === "ACTIVE" ? -1 : 1;
      if (a.state === "ACTIVE") {
        if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
        return (b.galacticPower ?? BigInt(0)) > (a.galacticPower ?? BigInt(0)) ? 1 : -1;
      }
      return (b.leftAt?.getTime() ?? 0) - (a.leftAt?.getTime() ?? 0);
    });

    return {
      capturedAt: raidRoom.capturedAt ? new Date(raidRoom.capturedAt) : twRoom.capturedAt,
      raidLabel: latestRaid?.label ?? null,
      twLabel,
      rows,
    };
  } catch {
    return empty;
  }
}
