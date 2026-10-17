import { TICKET_TARGET_PER_MEMBER } from "@/lib/dashboard";
import { getRosterMembers } from "@/lib/members";
import { assessPlayer, type Assessment } from "@/lib/player-assessment";
import { getPrisma } from "@/lib/prisma";
import { getRaidRoom } from "@/lib/raids";
import { getTerritoryWarRoom } from "@/lib/territory-war";
import { describeWin, type WinKind } from "@/lib/wins";

export type PlayerCard = {
  playerId: string;
  name: string;
  role: string | null;
  level: number | null;
  joinedAt: string | null;
  tenureDays: number;
  discordLinked: boolean;
  lastActivityAt: string | null;
  power: { galacticPower: string; characterPower: string; shipPower: string; rank: number; members: number; averageGp: string; changePct: number | null; history: number[] };
  roster: { galacticLegends: number | null; relicUnits: number | null; datacrons: number | null; sevenStars: number | null; ultimates: number | null; relic9: number | null };
  tickets: { now: number; target: number; average: number | null };
  raids: { label: string; joined: boolean; damage: number | null; rank: number | null; of: number }[];
  war: { joined: boolean | null; label: string | null };
  contribution: { countersAdded: number; countersUsed: number; tipsPublished: number; ideasPublished: number; feedbackPosts: number; wins30d: number };
  recent: { text: string; at: string }[];
  flags: string[];
  assessment: Assessment;
  profileSyncedAt: string | null;
};

type Unit = { definitionId?: string; currentRarity?: number | string; relic?: { currentTier?: number | string }; purchasedAbilityId?: string[] };

function rosterFacts(payload: unknown) {
  const units = (payload && typeof payload === "object" && Array.isArray((payload as { rosterUnit?: unknown }).rosterUnit) ? (payload as { rosterUnit: Unit[] }).rosterUnit : null);
  if (!units) return { sevenStars: null, ultimates: null, relic9: null };
  const relic = (unit: Unit) => { const t = Number(unit.relic?.currentTier ?? 0); return t > 2 ? t - 2 : 0; };
  return {
    sevenStars: units.filter((unit) => Number(unit.currentRarity ?? 0) >= 7).length,
    ultimates: units.reduce((sum, unit) => sum + (unit.purchasedAbilityId ?? []).filter((id) => id.startsWith("ultimateability_")).length, 0),
    relic9: units.filter((unit) => relic(unit) >= 9).length,
  };
}

/** Everything we know about one member, on one card. Officers only: the caller checks. */
export async function getPlayerCard(playerId: string): Promise<PlayerCard | null> {
  const db = getPrisma();
  const [roster, raidRoom, war] = await Promise.all([getRosterMembers(), getRaidRoom(), getTerritoryWarRoom()]);
  const member = roster.find((entry) => entry.playerId === playerId);
  if (!member) return null;

  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [player, history, term, wins, countersAdded, countersUsed, tips, feedbackPosts] = await Promise.all([
    db.player.findUnique({ where: { id: playerId }, select: { level: true, discordUserId: true, profilePayload: true, profileSyncedAt: true } }),
    db.memberSnapshot.findMany({ where: { playerId }, orderBy: { guildSnapshot: { capturedAt: "desc" } }, take: 40, select: { galacticPower: true, raidTickets: true } }),
    db.membershipTerm.findFirst({ where: { playerId, state: "ACTIVE" }, orderBy: { joinedAt: "desc" }, select: { joinedAt: true } }),
    db.guildWin.findMany({ where: { playerId, occurredAt: { gte: since30 } }, orderBy: { occurredAt: "desc" }, take: 40 }),
    db.counter.count({ where: { createdById: playerId } }),
    db.kbUse.count({ where: { playerId } }),
    db.kbNote.findMany({ where: { submittedById: playerId, status: "PUBLISHED" }, select: { kind: true } }),
    db.feedbackItem.count({ where: { submittedById: playerId } }),
  ]);

  const powers = history.map((row) => Number(row.galacticPower)).reverse();
  const gpChange = powers.length >= 3 && powers[0] > 0 ? (powers[powers.length - 1] - powers[0]) / powers[0] : null;
  const tickets = history.map((row) => row.raidTickets).filter((value): value is number => typeof value === "number");
  const averageGp = roster.length ? Math.round(roster.reduce((sum, entry) => sum + Number(entry.galacticPower), 0) / roster.length) : 0;
  const rank = [...roster].sort((a, b) => (a.galacticPower > b.galacticPower ? -1 : 1)).findIndex((entry) => entry.playerId === playerId) + 1;

  const recentRaids = raidRoom.raids.slice(0, 5);
  const raids = recentRaids.map((raid) => {
    const entry = raid.participants.find((participant) => participant.playerId === playerId);
    return { label: raid.label, joined: Boolean(entry), damage: entry?.damage ?? null, rank: entry?.rank ?? null, of: raid.participants.length };
  });
  const warMember = war.active ? war.members.find((entry) => entry.playerId === playerId) : undefined;
  const joinedWar = war.active ? Boolean(warMember?.joined) : null;

  const joinedAt = term?.joinedAt ?? member.joinedAt;
  const tenureDays = joinedAt ? Math.max(0, Math.round((Date.now() - joinedAt.getTime()) / 86_400_000)) : 0;
  const facts = rosterFacts(player?.profilePayload);
  const hoursSinceActive = member.lastActivityAt ? (Date.now() - member.lastActivityAt.getTime()) / 3_600_000 : null;
  const profileStale = !member.profileSyncedAt || Date.now() - member.profileSyncedAt.getTime() > 7 * 86_400_000;
  const ideas = tips.filter((note) => note.kind === "IDEA").length;
  const tipCount = tips.length - ideas;

  const assessment = assessPlayer({
    gpRank: rank, members: roster.length, galacticPower: Number(member.galacticPower), averageGp, gpChange,
    galacticLegends: member.galacticLegends, relicUnits: member.relicUnits, raidTickets: member.raidTickets, ticketTarget: TICKET_TARGET_PER_MEMBER,
    hoursSinceActive, tenureDays, raidsJoined: raids.filter((raid) => raid.joined).length, raidsTotal: raids.length, joinedWar,
    wins30d: wins.length, countersAdded, tipsPublished: tips.length, profileStale,
  });

  return {
    playerId, name: member.name, role: member.memberRole || null, level: player?.level ?? member.playerLevel ?? null,
    joinedAt: joinedAt?.toISOString() ?? null, tenureDays, discordLinked: Boolean(player?.discordUserId),
    lastActivityAt: member.lastActivityAt?.toISOString() ?? null,
    power: { galacticPower: member.galacticPower.toString(), characterPower: member.characterPower.toString(), shipPower: member.shipPower.toString(), rank, members: roster.length, averageGp: String(averageGp), changePct: gpChange === null ? null : Math.round(gpChange * 1000) / 10, history: powers },
    roster: { galacticLegends: member.galacticLegends, relicUnits: member.relicUnits, datacrons: member.datacrons, ...facts },
    tickets: { now: member.raidTickets, target: TICKET_TARGET_PER_MEMBER, average: tickets.length ? Math.round(tickets.reduce((a, b) => a + b, 0) / tickets.length) : null },
    raids, war: { joined: joinedWar, label: war.active ? (war.opponentName ? `vs ${war.opponentName}` : "Current war") : null },
    contribution: { countersAdded, countersUsed, tipsPublished: tipCount, ideasPublished: ideas, feedbackPosts, wins30d: wins.length },
    recent: wins.slice(0, 6).map((win) => ({ text: describeWin({ kind: win.kind as WinKind, subject: win.subject, value: win.value }).text, at: win.occurredAt.toISOString() })),
    flags: member.attentionReasons, assessment, profileSyncedAt: member.profileSyncedAt?.toISOString() ?? null,
  };
}

export type MemberListing = { playerId: string; name: string; role: string | null; galacticPower: string; flags: number };

export async function listMembersForCards(): Promise<MemberListing[]> {
  const roster = await getRosterMembers();
  return roster.map((member) => ({ playerId: member.playerId, name: member.name, role: member.memberRole || null, galacticPower: member.galacticPower.toString(), flags: member.attentionReasons.length })).sort((a, b) => a.name.localeCompare(b.name));
}
