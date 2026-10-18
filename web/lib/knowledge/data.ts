import { postDiscordAnnouncement } from "@/lib/discord";
import { callToArmsMessage, type RequestInput } from "@/lib/knowledge/requests";
import { getPrisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import { freshness, nextStatus, type KbAction } from "@/lib/knowledge/lifecycle";
import { mayAutoPublish, type Via } from "@/lib/knowledge/permissions";
import { searchMatchups, type MatchupRow, type SearchQuery } from "@/lib/knowledge/search";
import { variantKey, type KbMember } from "@/lib/knowledge/squad";
import { MODE_LABELS, type KbMode, type SquadKind } from "@/lib/knowledge/modes";
import type { SubmissionInput } from "@/lib/knowledge/validate";
import { allUnitNames } from "@/lib/wins";

const names = new Map(allUnitNames().map((unit) => [unit.id, unit.name]));
export const unitLabel = (unitId: string) => names.get(unitId) ?? unitId;
export const knownUnitIds = new Set(names.keys());

const ACTIVE = ["CANDIDATE", "PUBLISHED", "DISPUTED"];

type Db = ReturnType<typeof getPrisma>;

/** Finds or creates the team family and exact variant for a squad. The same squad always resolves to the same row. */
async function ensureVariant(db: Db, kind: SquadKind, members: KbMember[]) {
  const key = variantKey(kind, members);
  const existing = await db.kbVariant.findUnique({ where: { key } });
  if (existing) return existing;
  const leader = members.find((member) => member.role === "LEADER")!.unitId;
  const teamKey = `${kind.toLowerCase()}-${leader.toLowerCase()}`;
  const team = await db.kbTeam.upsert({
    where: { key: teamKey },
    create: { key: teamKey, name: unitLabel(leader), aliases: [], kind, leaderUnitId: leader, tags: [] },
    update: {},
  });
  return db.kbVariant.upsert({ where: { key }, create: { teamId: team.id, key, members }, update: {} });
}

export type SubmitContext = { via: Via; who: string; whoId: string | null; importKey?: string | null };
export type SubmitResult = { id: string; created: boolean; status: string; evidenceAdded: number };

/**
 * Stores a validated submission. A match-up that already exists (same defender, attacker and mode, not rejected or outdated)
 * is not duplicated: the new evidence is attached to it instead. Everything starts as a candidate unless a trusted
 * import rule (see permissions.ts) applies.
 */
export async function submitMatchup(input: SubmissionInput, context: SubmitContext): Promise<SubmitResult> {
  const db = getPrisma();
  const defender = await ensureVariant(db, input.defender.kind, input.defender.members);
  const attacker = await ensureVariant(db, input.attacker.kind, input.attacker.members);

  const byImportKey = context.importKey ? await db.kbMatchup.findUnique({ where: { importKey: context.importKey }, select: { id: true } }) : null;
  const existing = byImportKey ?? await db.kbMatchup.findFirst({ where: { defenderId: defender.id, attackerId: attacker.id, mode: input.mode, status: { in: ACTIVE } }, select: { id: true } });

  const evidenceData = (matchupId: string) => input.evidence.map((item) => ({ matchupId, ...item }));

  if (existing) {
    // Don't repeat evidence we already hold from the same source reference.
    const held = await db.kbEvidence.findMany({ where: { matchupId: existing.id }, select: { sourceProvider: true, sourceRef: true } });
    const fresh = evidenceData(existing.id).filter((item) => !(item.sourceRef && held.some((h) => h.sourceProvider === item.sourceProvider && h.sourceRef === item.sourceRef)));
    if (fresh.length) {
      await db.kbEvidence.createMany({ data: fresh });
      await db.kbEvent.create({ data: { matchupId: existing.id, action: "EVIDENCE_ADDED", actorName: context.who, note: `${fresh.length} source${fresh.length === 1 ? "" : "s"} from ${context.via}` } });
    }
    const row = await db.kbMatchup.findUniqueOrThrow({ where: { id: existing.id }, select: { status: true } });
    return { id: existing.id, created: false, status: row.status, evidenceAdded: fresh.length };
  }

  const publish = mayAutoPublish(context.via, input.evidence[0]?.sourceProvider ?? "", input.evidence);
  const created = await db.kbMatchup.create({
    data: {
      defenderId: defender.id, attackerId: attacker.id, mode: input.mode,
      strategy: input.strategy, opening: input.opening, targetPriority: input.targetPriority, failureConditions: input.failureConditions,
      relicGuidance: input.relicGuidance, speedNotes: input.speedNotes, oneShot: input.oneShot, freshEnemyOnly: input.freshEnemyOnly,
      requirements: input.requirements ?? undefined, datacronDependent: input.datacronDependent, datacronExpiresAt: input.datacronExpiresAt,
      status: publish ? "PUBLISHED" : "CANDIDATE", via: context.via, submittedById: context.whoId, submittedByName: context.who,
      importKey: context.importKey ?? null,
      evidence: { create: input.evidence },
      events: { create: [{ action: "SUBMITTED", actorName: context.who, note: `via ${context.via}` }, ...(publish ? [{ action: "PUBLISHED", actorName: "trusted import rule", note: null }] : [])] },
    },
    select: { id: true, status: true },
  });
  return { id: created.id, created: true, status: created.status, evidenceAdded: input.evidence.length };
}

const matchupInclude = {
  defender: { include: { team: true } },
  attacker: { include: { team: true } },
} as const;

type Loaded = Awaited<ReturnType<typeof loadMatchups>>[number];

function squadView(variant: { key: string; members: unknown; team: { name: string; aliases: string[]; leaderUnitId: string | null } }) {
  const members = (Array.isArray(variant.members) ? variant.members : []) as KbMember[];
  return { teamName: variant.team.name, aliases: variant.team.aliases, leaderUnitId: variant.team.leaderUnitId, memberIds: members.map((member) => member.unitId), variantKey: variant.key, members };
}

export type MatchupListing = MatchupRow & {
  strategy: string | null;
  defender: ReturnType<typeof squadView>;
  attacker: ReturnType<typeof squadView>;
  via: string;
  submittedByName: string;
  evidenceCount: number;
  useCount: number;
  usedByMe?: boolean;
  requirements: unknown;
  oneShot: boolean | null;
  freshEnemyOnly: boolean | null;
  /** The counter this one was suggested to improve or swap into (set when a member suggests it). */
  supersedesId?: string | null;
  /** Plain words for reviewers: which counter it would replace. */
  improves?: string | null;
};

async function loadMatchups(where: object, take = 1500) {
  return getPrisma().kbMatchup.findMany({ where, include: { ...matchupInclude, _count: { select: { evidence: true, uses: true } } }, orderBy: { updatedAt: "desc" }, take });
}

function toListing(row: Loaded): MatchupListing {
  return {
    id: row.id, status: row.status, mode: row.mode, strategy: row.strategy,
    defender: squadView(row.defender), attacker: squadView(row.attacker),
    datacronDependent: row.datacronDependent, datacronExpiresAt: row.datacronExpiresAt, reviewedAt: row.reviewedAt, createdAt: row.createdAt,
    via: row.via, submittedByName: row.submittedByName, evidenceCount: row._count.evidence, useCount: row._count.uses,
    requirements: row.requirements, oneShot: row.oneShot, freshEnemyOnly: row.freshEnemyOnly, supersedesId: row.supersedesId,
  };
}

/** Search the knowledge base. Members see published records only; reviewers can include the rest. */
export async function findMatchups(query: SearchQuery, viewerPlayerId?: string | null) {
  const rows = await loadMatchups(query.includeUnpublished ? {} : { status: "PUBLISHED" });
  const hits = searchMatchups(rows.map(toListing), query, unitLabel, Date.now());
  if (!viewerPlayerId || !hits.length) return hits;
  const mine = new Set((await getPrisma().kbUse.findMany({ where: { playerId: viewerPlayerId, matchupId: { in: hits.map((hit) => hit.id) } }, select: { matchupId: true } })).map((use) => use.matchupId));
  return hits.map((hit) => ({ ...hit, usedByMe: mine.has(hit.id) }));
}

export async function getMatchupDetail(id: string) {
  const row = await getPrisma().kbMatchup.findUnique({ where: { id }, include: { ...matchupInclude, evidence: { orderBy: { createdAt: "asc" } }, events: { orderBy: { createdAt: "asc" } }, _count: { select: { evidence: true, uses: true } } } });
  if (!row) return null;
  return { ...toListing(row as unknown as Loaded), evidence: row.evidence, events: row.events, reviewNote: row.reviewNote, reviewedByName: row.reviewedByName };
}

export async function reviewQueue() {
  const rows = await loadMatchups({ status: { in: ["CANDIDATE", "DISPUTED"] } }, 200);
  const listings = rows.map(toListing).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  // For suggestions ("a better counter", "swap X for Y"), say which published counter they are about.
  const originalIds = [...new Set(listings.map((row) => row.supersedesId).filter((id): id is string => Boolean(id)))];
  if (!originalIds.length) return listings;
  const originals = new Map((await loadMatchups({ id: { in: originalIds } }, 200)).map((row) => { const l = toListing(row); return [l.id, `${l.attacker.members.map((m) => unitLabel(m.unitId)).join(", ")} vs ${unitLabel(l.defender.members[0]?.unitId ?? "")}`] as const; }));
  return listings.map((row) => (row.supersedesId ? { ...row, improves: originals.get(row.supersedesId) ?? null } : row));
}

export type ReviewResult = { ok: true; status: string } | { ok: false; error: string };

/** A reviewer's decision. Only the moves in lifecycle.ts are allowed, and every one is written to the history. */
export async function reviewMatchup(id: string, action: KbAction, actor: string, note: string | null): Promise<ReviewResult> {
  const db = getPrisma();
  const row = await db.kbMatchup.findUnique({ where: { id }, select: { status: true } });
  if (!row) return { ok: false, error: "That counter no longer exists." };
  const to = nextStatus(row.status as never, action);
  if (!to) return { ok: false, error: `A ${row.status.toLowerCase()} counter can't be ${action.toLowerCase()}ed.` };
  await db.kbMatchup.update({ where: { id }, data: { status: to, reviewedByName: actor, reviewedAt: new Date(), reviewNote: note } });
  if (to === "PUBLISHED") {
    // A counter for this enemy leader in this mode now exists, so any open call for help for it is answered.
    const published = await db.kbMatchup.findUnique({ where: { id }, select: { mode: true, defender: { select: { team: { select: { leaderUnitId: true } } } } } });
    const leader = published?.defender.team.leaderUnitId;
    if (leader) {
      const waiting = await db.kbRequest.findMany({ where: { status: "OPEN", mode: published.mode, leaderUnitId: leader }, select: { id: true, requestedById: true } });
      await db.kbRequest.updateMany({ where: { status: "OPEN", mode: published.mode, leaderUnitId: leader }, data: { status: "ANSWERED", answeredById: id } });
      await tellRequesters(waiting.map((w) => w.requestedById), unitLabel(leader), published.mode);
    }
  }
  await db.kbEvent.create({ data: { matchupId: id, action, actorName: actor, note } });
  return { ok: true, status: to };
}

export async function countRecentSubmissions(whoId: string, hours = 24) {
  return getPrisma().kbMatchup.count({ where: { submittedById: whoId, createdAt: { gte: new Date(Date.now() - hours * 3_600_000) } } });
}

export type Coverage = {
  teams: number; variants: number; evidence: number;
  byStatus: Record<string, number>;
  byMode: Record<string, number>;
  needRefresh: { id: string; label: string }[];
  expiredDatacron: { id: string; label: string }[];
};

/** What the knowledge base holds, by status and mode, and which published records need another look. */
export async function coverage(): Promise<Coverage> {
  const db = getPrisma();
  const [teams, variants, evidence, grouped, published] = await Promise.all([
    db.kbTeam.count(), db.kbVariant.count(), db.kbEvidence.count(),
    db.kbMatchup.groupBy({ by: ["status", "mode"], _count: true }),
    loadMatchups({ status: "PUBLISHED" }),
  ]);
  const byStatus: Record<string, number> = {};
  const byMode: Record<string, number> = {};
  for (const group of grouped) {
    byStatus[group.status] = (byStatus[group.status] ?? 0) + group._count;
    if (group.status === "PUBLISHED") byMode[group.mode] = (byMode[group.mode] ?? 0) + group._count;
  }
  const now = Date.now();
  const label = (row: Loaded) => `${row.attacker.team.name} into ${row.defender.team.name} (${row.mode})`;
  return {
    teams, variants, evidence, byStatus, byMode,
    needRefresh: published.filter((row) => freshness(row, now).needsRefresh).map((row) => ({ id: row.id, label: label(row) })),
    expiredDatacron: published.filter((row) => freshness(row, now).datacronExpired).map((row) => ({ id: row.id, label: label(row) })),
  };
}

/** "This is what I use": toggles a member's mark on a published counter. One per member per counter. */
export async function setUse(matchupId: string, playerId: string, using: boolean): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const db = getPrisma();
  const row = await db.kbMatchup.findUnique({ where: { id: matchupId }, select: { status: true } });
  if (!row || row.status !== "PUBLISHED") return { ok: false, error: "You can only mark a published counter." };
  if (using) await db.kbUse.upsert({ where: { matchupId_playerId: { matchupId, playerId } }, create: { matchupId, playerId }, update: {} });
  else await db.kbUse.deleteMany({ where: { matchupId, playerId } });
  return { ok: true, count: await db.kbUse.count({ where: { matchupId } }) };
}

export async function countRecentRequests(playerId: string, hours = 24) {
  return getPrisma().kbRequest.count({ where: { requestedById: playerId, createdAt: { gte: new Date(Date.now() - hours * 3_600_000) } } });
}

export type RequestListing = { id: string; mode: string; leaderUnitId: string; leaderName: string; note: string | null; requestedByName: string; createdAt: Date; mine: boolean };

export async function openRequests(viewerPlayerId: string | null): Promise<RequestListing[]> {
  const rows = await getPrisma().kbRequest.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 30 });
  return rows.map((row) => ({ id: row.id, mode: row.mode, leaderUnitId: row.leaderUnitId, leaderName: unitLabel(row.leaderUnitId), note: row.note, requestedByName: row.requestedByName, createdAt: row.createdAt, mine: row.requestedById === viewerPlayerId }));
}

/**
 * A call for help. An open call for the same enemy leader and mode is shared, not repeated. A new one is posted to the
 * counters Discord channel (DISCORD_COUNTERS_WEBHOOK_URL) when that is set up; without it the call still shows on the site.
 */
export async function createRequest(input: RequestInput, requester: { id: string; name: string }): Promise<{ id: string; created: boolean; posted: boolean }> {
  const db = getPrisma();
  const existing = await db.kbRequest.findFirst({ where: { status: "OPEN", mode: input.mode, leaderUnitId: input.leaderUnitId }, select: { id: true, discordPosted: true } });
  if (existing) return { id: existing.id, created: false, posted: existing.discordPosted };

  const created = await db.kbRequest.create({ data: { mode: input.mode, leaderUnitId: input.leaderUnitId, note: input.note, requestedById: requester.id, requestedByName: requester.name }, select: { id: true } });
  let posted = false;
  const webhook = process.env.DISCORD_COUNTERS_WEBHOOK_URL;
  if (webhook) {
    try {
      const message = callToArmsMessage({ mode: input.mode as never, leaderName: unitLabel(input.leaderUnitId), note: input.note, requester: requester.name, link: `${siteUrl()}/knowledge` });
      posted = await postDiscordAnnouncement({ ...message, color: 0xf59e0b, websiteUrl: `${siteUrl()}/knowledge`, footer: "Blues Brothers · Counter help" }, webhook);
      if (posted) await db.kbRequest.update({ where: { id: created.id }, data: { discordPosted: true } });
    } catch (error) {
      console.error("knowledge: call for help not posted to Discord", error instanceof Error ? error.message : "unknown error");
    }
  }
  return { id: created.id, created: true, posted };
}

/** Take a call for help off the Wanted list. Only the member who asked, or an officer, and only while it is still open. */
export async function closeRequest(id: string, viewer: { playerId: string | null; isOfficer: boolean }): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const db = getPrisma();
  const row = await db.kbRequest.findUnique({ where: { id }, select: { status: true, requestedById: true } });
  if (!row || row.status !== "OPEN") return { ok: false, error: "That request is already gone.", status: 404 };
  if (!viewer.isOfficer && row.requestedById !== viewer.playerId) return { ok: false, error: "Only the person who asked, or an officer, can remove it.", status: 403 };
  await db.kbRequest.update({ where: { id }, data: { status: "CLOSED" } });
  return { ok: true };
}

/** Tell the members who asked that a counter now exists: a Discord mention in the counters channel, and a push if they have it on. Never fails the review. */
async function tellRequesters(playerIds: string[], leaderName: string, mode: string) {
  const ids = [...new Set(playerIds)];
  if (!ids.length) return;
  const link = `${siteUrl()}/ask?tab=counters`;
  try {
    const players = await getPrisma().player.findMany({ where: { id: { in: ids } }, select: { discordUserId: true } });
    const mentions = players.map((p) => p.discordUserId).filter((d): d is string => Boolean(d));
    const webhook = process.env.DISCORD_COUNTERS_WEBHOOK_URL;
    if (webhook && mentions.length) {
      await postDiscordAnnouncement({ title: `A counter for ${leaderName} is ready`, description: `You asked for a counter to **${leaderName}** in **${MODE_LABELS[mode as KbMode] ?? mode}**. An officer has checked one.\n${link}`, color: 0x22c55e, websiteUrl: link, footer: "Blues Brothers · Counter help", mentionUserIds: mentions }, webhook);
    }
  } catch (error) {
    console.error("knowledge: requester not told on Discord", error instanceof Error ? error.message : "unknown error");
  }
  try {
    const { notifyPlayers } = await import("@/lib/push");
    await notifyPlayers(ids, { title: `A counter for ${leaderName} is ready`, body: "An officer checked one. Tap to see it.", url: "/ask?tab=counters", tag: "counter" });
  } catch { /* push is optional */ }
}

/** A member's suggestion points back at the counter it would improve, so reviewers can compare. The old counter stays live until an officer decides. */
export async function linkSuggestion(newId: string, oldId: string, kind: "BETTER" | "SWAP", who: string) {
  const db = getPrisma();
  const old = await db.kbMatchup.findUnique({ where: { id: oldId }, select: { id: true } });
  if (!old || old.id === newId) return false;
  await db.kbMatchup.update({ where: { id: newId }, data: { supersedesId: oldId } });
  await db.kbEvent.create({ data: { matchupId: newId, action: "SUGGESTED", actorName: who, note: kind === "SWAP" ? "Suggested as a swap on an existing counter" : "Suggested as a better counter than an existing one" } });
  return true;
}
