import { getPrisma } from "@/lib/prisma";
import { getRosterMembers } from "@/lib/members";

type JsonRecord = Record<string, unknown>;

export type TerritoryWarMember = {
  playerId: string;
  name: string;
  role: string;
  galacticPower: string;
  characterPower: string;
  shipPower: string;
  galacticLegends: number | null;
  relicUnits: number | null;
  datacrons: number | null;
  lastActivityAt: string | null;
  profileSyncedAt: string | null;
  joined: boolean;
  eligible: boolean | null;
  lockedPower: number | null;
  joinTime: string | null;
};

export type TerritoryWarZone = {
  id: string;
  command: string | null;
  score: number;
  squads: number;
  capacity: number;
  defeated: number;
};

export type TerritoryWarRoom = {
  capturedAt: Date | null;
  active: boolean;
  instanceId: string | null;
  definitionId: string | null;
  round: number | null;
  roundEndsAt: Date | null;
  opponentName: string | null;
  opponentPower: bigint | null;
  guildPower: bigint | null;
  guildScore: number;
  opponentScore: number;
  joinedCount: number;
  eligibleCount: number;
  joinedPower: bigint;
  members: TerritoryWarMember[];
  homeZones: TerritoryWarZone[];
  opponentZones: TerritoryWarZone[];
  lastResult: {
    opponentName: string | null;
    score: number;
    opponentScore: number;
    endedAt: Date | null;
  } | null;
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

function guildProfile(status: JsonRecord | null) {
  return record(status?.profile);
}

function zones(status: JsonRecord | null): TerritoryWarZone[] {
  return records(status?.conflictStatus).map((zone, index) => {
    const zoneStatus = record(zone.zoneStatus);
    return {
      id: String(zoneStatus?.zoneId ?? `Zone ${index + 1}`),
      command: zoneStatus?.commandMessage ? String(zoneStatus.commandMessage) : null,
      score: numberValue(zoneStatus?.score),
      squads: numberValue(zone.squadCount),
      capacity: numberValue(zone.squadCapacity),
      defeated: numberValue(zone.defeatedSquadCount),
    };
  });
}

function scoreFor(status: JsonRecord | null) {
  return zones(status).reduce((total, zone) => total + zone.score, 0);
}

function currentWarFromRawPayload(payload: unknown): JsonRecord | null {
  const guild = record(record(payload)?.guild);
  return records(guild?.territoryWarStatus)[0] ?? null;
}

function resultView(value: unknown): TerritoryWarRoom["lastResult"] {
  const result = record(value);
  if (!result) return null;
  const opponent = record(result.opponentGuildProfile);
  return {
    opponentName: opponent?.name ? String(opponent.name) : null,
    score: numberValue(result.score),
    opponentScore: numberValue(result.opponentScore),
    endedAt: dateValue(result.endTimeSeconds),
  };
}

export async function getTerritoryWarRoom(): Promise<TerritoryWarRoom> {
  const empty: TerritoryWarRoom = {
    capturedAt: null,
    active: false,
    instanceId: null,
    definitionId: null,
    round: null,
    roundEndsAt: null,
    opponentName: null,
    opponentPower: null,
    guildPower: null,
    guildScore: 0,
    opponentScore: 0,
    joinedCount: 0,
    eligibleCount: 0,
    joinedPower: BigInt(0),
    members: [],
    homeZones: [],
    opponentZones: [],
    lastResult: null,
  };
  if (!process.env.DATABASE_URL) return empty;

  try {
    const prisma = getPrisma();
    const [roster, snapshot, eventSnapshot, latestResult] = await Promise.all([
      getRosterMembers(),
      prisma.guildSnapshot.findFirst({
        orderBy: { capturedAt: "desc" },
        select: { capturedAt: true, guildId: true, rawPayload: true },
      }),
      prisma.eventSnapshot.findFirst({
        where: { event: { type: "TERRITORY_WAR" } },
        orderBy: { capturedAt: "desc" },
        include: { event: true },
      }),
      prisma.guildEvent.findMany({
        where: { type: "TERRITORY_WAR" },
        orderBy: { endsAt: "desc" },
        select: { finalResult: true },
        take: 10,
      }),
    ]);

    let war = currentWarFromRawPayload(snapshot?.rawPayload);
    let capturedAt = snapshot?.capturedAt ?? null;
    const eventIsCurrent = eventSnapshot
      && Date.now() - eventSnapshot.capturedAt.getTime() < 2 * 60 * 60 * 1000
      && (!eventSnapshot.event.endsAt || eventSnapshot.event.endsAt.getTime() > Date.now() - 12 * 60 * 60 * 1000);
    if (!war && eventIsCurrent) {
      war = record(eventSnapshot.payload);
      capturedAt = eventSnapshot.capturedAt;
    }

    const fallbackResult = (() => {
      const guild = record(record(snapshot?.rawPayload)?.guild);
      return records(guild?.recentTerritoryWarResult)[0] ?? null;
    })();
    const lastResult = resultView(latestResult.find((event) => event.finalResult)?.finalResult ?? fallbackResult);
    const guildId = snapshot?.guildId;
    const home = record(war?.homeGuild);
    const away = record(war?.awayGuild);
    const awayProfile = guildProfile(away);
    const ownIsAway = Boolean(guildId && awayProfile?.id === guildId);
    const own = ownIsAway ? away : home;
    const opponent = ownIsAway ? home : away;
    const ownProfile = guildProfile(own);
    const opponentProfile = guildProfile(opponent);

    const participants = records(war?.optedInMember);
    const participantIds = new Set([
      ...participants.map((item) => String(item.memberId ?? "")).filter(Boolean),
      ...(Array.isArray(war?.optedInMemberId) ? war.optedInMemberId.map(String) : []),
    ]);
    const participantById = new Map(participants.map((item) => [String(item.memberId ?? ""), item]));
    const members = roster.map((member): TerritoryWarMember => {
      const participant = participantById.get(member.playerId);
      return {
        playerId: member.playerId,
        name: member.name,
        role: member.memberRole,
        galacticPower: member.galacticPower.toString(),
        characterPower: member.characterPower.toString(),
        shipPower: member.shipPower.toString(),
        galacticLegends: member.galacticLegends,
        relicUnits: member.relicUnits,
        datacrons: member.datacrons,
        lastActivityAt: member.lastActivityAt?.toISOString() ?? null,
        profileSyncedAt: member.profileSyncedAt?.toISOString() ?? null,
        joined: participantIds.has(member.playerId),
        eligible: participant?.eligible === undefined ? null : Boolean(participant.eligible),
        lockedPower: participant?.power === undefined ? null : numberValue(participant.power),
        joinTime: participant?.joinTime ? dateValue(participant.joinTime)?.toISOString() ?? null : null,
      };
    });
    const joinedPower = participants.reduce((total, item) => total + BigInt(Math.trunc(numberValue(item.power))), BigInt(0));

    return {
      ...empty,
      capturedAt,
      active: Boolean(war),
      instanceId: war?.instanceId ? String(war.instanceId) : null,
      definitionId: war?.definitionId ? String(war.definitionId) : null,
      round: war?.currentRound === undefined ? null : numberValue(war.currentRound),
      roundEndsAt: dateValue(war?.currentRoundEndTime),
      opponentName: opponentProfile?.name ? String(opponentProfile.name) : null,
      opponentPower: opponentProfile?.guildGalacticPower === undefined ? null : BigInt(Math.trunc(numberValue(opponentProfile.guildGalacticPower))),
      guildPower: ownProfile?.guildGalacticPower === undefined ? null : BigInt(Math.trunc(numberValue(ownProfile.guildGalacticPower))),
      guildScore: scoreFor(own),
      opponentScore: scoreFor(opponent),
      joinedCount: participantIds.size,
      eligibleCount: participants.filter((item) => item.eligible !== false).length,
      joinedPower,
      members,
      homeZones: zones(own),
      opponentZones: zones(opponent),
      lastResult,
    };
  } catch {
    return empty;
  }
}
