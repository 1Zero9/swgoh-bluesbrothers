import { getPrisma } from "@/lib/prisma";
import { getRosterMembers } from "@/lib/members";

type JsonRecord = Record<string, unknown>;

export type RaidParticipant = {
  playerId: string;
  name: string;
  damage: number;
  rank: number;
};

export type RaidSummary = {
  raidId: string;
  label: string;
  outcome: number;
  outcomeLabel: string;
  durationSeconds: number;
  endedAt: string | null;
  participants: RaidParticipant[];
};

export type RaidRoom = {
  capturedAt: string | null;
  raids: RaidSummary[];
};

const RAID_LABELS: Record<string, string> = {
  sith_raid: "Krayt Dragon",
  rancor_challenge: "Rancor",
  aat_challenge: "Tank Takedown",
};

const OUTCOME_LABELS: Record<number, string> = {
  0: "Not attempted",
  1: "Completed",
  2: "Expired",
  3: "In progress",
  4: "Abandoned",
  5: "Simmed",
};

function record(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function records(value: unknown) {
  return Array.isArray(value) ? value.map(record).filter((item): item is JsonRecord => Boolean(item)) : [];
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: unknown) {
  const parsed = numberValue(value);
  if (!parsed) return null;
  return new Date(parsed < 1_000_000_000_000 ? parsed * 1000 : parsed);
}

function labelFor(raidId: string) {
  if (RAID_LABELS[raidId]) return RAID_LABELS[raidId];
  return raidId.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function getRaidRoom(): Promise<RaidRoom> {
  const empty: RaidRoom = { capturedAt: null, raids: [] };
  if (!process.env.DATABASE_URL) return empty;

  try {
    const prisma = getPrisma();
    const [roster, snapshot] = await Promise.all([
      getRosterMembers(),
      prisma.guildSnapshot.findFirst({
        orderBy: { capturedAt: "desc" },
        select: { capturedAt: true, rawPayload: true },
      }),
    ]);

    const nameById = new Map(roster.map((member) => [member.playerId, member.name]));
    const guild = record(record(snapshot?.rawPayload)?.guild);
    const results = records(guild?.recentRaidResult);

    const raids = results
      .map((result): RaidSummary => {
        const raidId = String(result.raidId ?? "unknown");
        const participants = records(result.raidMember)
          .map((member) => ({
            playerId: String(member.playerId ?? ""),
            name: nameById.get(String(member.playerId ?? "")) ?? "Former or unknown member",
            damage: numberValue(member.memberProgress),
          }))
          .filter((member) => member.playerId)
          .sort((a, b) => b.damage - a.damage)
          .map((member, index) => ({ ...member, rank: index + 1 }));

        return {
          raidId,
          label: labelFor(raidId),
          outcome: numberValue(result.outcome),
          outcomeLabel: OUTCOME_LABELS[numberValue(result.outcome)] ?? "Unknown",
          durationSeconds: numberValue(result.duration),
          endedAt: dateValue(result.endTime)?.toISOString() ?? null,
          participants,
        };
      })
      .filter((raid) => raid.participants.length > 0)
      .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""));

    return { capturedAt: snapshot?.capturedAt?.toISOString() ?? null, raids };
  } catch {
    return empty;
  }
}
