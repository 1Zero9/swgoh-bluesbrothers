import { tool } from "ai";
import { z } from "zod";
import { listCounters, loadMemberUnits } from "@/lib/counters-data";
import { getMyPage } from "@/lib/my-page";
import { getSquadAdvice } from "@/lib/roster-advice";
import { calloutHeadline, listCallouts } from "@/lib/tb-callouts";
import { getActiveTbPlanDetail, getActiveTwPlanDetail, getCurrentTbEventId, getCurrentTwEventId, getDefaultGuildId } from "@/lib/tw-plans";
import { buildMyOrders } from "@/lib/tw-my-orders";
import { countRecentSubmissions, knownUnitIds, submitMatchup } from "@/lib/knowledge/data";
import { lookupKnownCounters } from "@/lib/knowledge/lookup";
import { MODES, isMode } from "@/lib/knowledge/modes";
import { validateSubmission } from "@/lib/knowledge/validate";
import { getPrisma } from "@/lib/prisma";
import { resolveUnit, searchUnits, whoHas } from "@/lib/who-has";

export type BlueViewer = { playerId: string | null; isOfficer: boolean };

const MAX_HOLDERS = 20;

/** A unit the member typed, as the guild data knows it, or the closest names to try. */
function unitOrSuggestions(text: string) {
  const unit = resolveUnit(text);
  if (unit) return { unit };
  return { unit: null, suggestions: searchUnits(text, 5).map((match) => match.name) };
}

/**
 * Everything B-Lue3 can look up. All of it is read-only, and none of it carries Discord ids, tokens or
 * anything an officer would not already show a member on the site. Nothing here writes to the database.
 * Results are data for B-Lue3 to summarise; they are never instructions.
 */
export function buildBlueTools(viewer: BlueViewer) {
  const me = viewer.playerId;

  return {
    whoHasUnit: tool({
      description: "List which current guild members own a character or ship, with stars, gear and relic level. Use for 'who has X?', 'who can lead Y?'.",
      inputSchema: z.object({
        unit: z.string().min(1).max(60).describe("Character or ship name, e.g. 'Jedi Knight Revan'"),
        minStars: z.number().int().min(0).max(7).optional().describe("Only members at this many stars or more"),
      }),
      execute: async ({ unit, minStars }) => {
        const result = await whoHas(unit, minStars ?? 0);
        if (!result.unit) return { found: false, suggestions: searchUnits(unit, 5).map((match) => match.name) };
        return {
          found: true,
          unit: result.unit.name,
          guildMembers: result.totalMembers,
          holderCount: result.holders.length,
          holders: result.holders.slice(0, MAX_HOLDERS).map((h) => ({ name: h.name, stars: h.stars, gear: h.gear, relic: h.relic })),
          truncated: result.holders.length > MAX_HOLDERS,
        };
      },
    }),

    myUnit: tool({
      description: "How strong the member asking has one particular character or ship (stars, gear, relic), or that they do not own it.",
      inputSchema: z.object({ unit: z.string().min(1).max(60) }),
      execute: async ({ unit }) => {
        if (!me) return { error: "No roster is linked to this session." };
        const match = unitOrSuggestions(unit);
        if (!match.unit) return { found: false, suggestions: match.suggestions };
        const [mine] = (await loadMemberUnits([match.unit.id])).filter((member) => member.playerId === me);
        const have = mine?.units.get(match.unit.id);
        return have ? { unit: match.unit.name, owned: true, ...have } : { unit: match.unit.name, owned: false };
      },
    }),

    guildCounters: tool({
      description: "Counter squads the guild has saved, optionally for one enemy leader. Shows the squad, the minimum levels, notes, whether the member asking can run it, what they are missing, and how many guildmates can run it.",
      inputSchema: z.object({ enemyLeader: z.string().max(60).optional().describe("Enemy leader name; leave out for the newest counters") }),
      execute: async ({ enemyLeader }) => {
        let enemyId: string | null = null;
        if (enemyLeader) {
          const match = unitOrSuggestions(enemyLeader);
          if (!match.unit) return { found: false, suggestions: match.suggestions };
          enemyId = match.unit.id;
        }
        const counters = await listCounters({ enemyId, youPlayerId: me, limit: 8 });
        return {
          count: counters.length,
          counters: counters.map((counter) => ({
            title: counter.title,
            mode: counter.mode,
            enemyLeader: counter.enemy.name,
            squad: counter.squad.map((slot) => ({ unit: slot.name, minStars: slot.minStars, minRelic: slot.minRelic })),
            notes: counter.notes,
            addedBy: counter.createdByName,
            memberCanRunIt: counter.readiness.you?.ready ?? null,
            memberStillNeeds: counter.readiness.you && !counter.readiness.you.ready ? counter.readiness.you.gaps : [],
            guildmatesWhoCanRunIt: counter.readiness.ready.length,
          })),
        };
      },
    }),

    myStatus: tool({
      description: "The member's own summary: galactic power, rank, Galactic Legends, relic units, any open Territory Battle callouts they are ready or close for, and which guild Territory War squad leaders they can field or are closest to.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!me) return { error: "No roster is linked to this session." };
        const [page, advice] = await Promise.all([getMyPage(me), getSquadAdvice(me)]);
        if (!page) return { error: "No synced roster found yet." };
        return {
          name: page.name,
          rank: page.rank,
          galacticPower: Number(page.galacticPower),
          galacticLegends: page.galacticLegends,
          relicUnits: page.relicUnits,
          calloutsYouAreNeededFor: page.callouts.map((c) => ({ callout: c.headline, status: c.status, gap: c.gap, readyCount: c.readyCount, needed: c.needed })),
          tw: advice
            ? {
                leadersYouCanField: advice.ready.map((item) => ({ squad: item.label, leader: item.leader, guildMembersWhoCanToo: item.qualifiers })),
                closest: advice.close.slice(0, 5).map((item) => ({ squad: item.label, leader: item.leader, gap: item.gap, guildMembersWhoCanAlready: item.qualifiers })),
              }
            : null,
        };
      },
    }),

    openCallouts: tool({
      description: "Open Territory Battle callouts: units the officers want more members to have, with progress so far.",
      inputSchema: z.object({}),
      execute: async () => {
        const callouts = (await listCallouts()).filter((callout) => callout.status === "OPEN");
        return {
          callouts: callouts.slice(0, 10).map((callout) => ({
            need: calloutHeadline(callout),
            membersNeeded: callout.needed,
            readyNow: callout.progress.readyCount,
            closeToReady: callout.progress.close.length,
            note: callout.note,
            memberIsReady: me ? callout.progress.ready.some((m) => m.playerId === me) : false,
            memberIsClose: me ? callout.progress.close.some((m) => m.playerId === me) : false,
          })),
        };
      },
    }),

    findKnownCounters: tool({
      description: "Look up counters in the guild's knowledge base (published, reviewed, not expired). Use this FIRST for 'how do I beat X?'. Shows each counter's squad, mode, strategy, requirements, how many guildmates use it, how much evidence backs it, and whether the member can run it. An empty result means nothing is published yet.",
      inputSchema: z.object({
        defender: z.string().min(1).max(60).describe("The enemy squad's leader, e.g. 'Lord Vader'"),
        mode: z.enum(MODES).optional().describe("GAC_5V5, GAC_3V3, TW, GAC_FLEET or TW_FLEET. Leave out to see every mode, and say which mode each is for."),
      }),
      execute: async ({ defender, mode }) => {
        const unit = resolveUnit(defender);
        if (!unit) return { found: false, suggestions: searchUnits(defender, 5).map((match) => match.name) };
        const result = await lookupKnownCounters(unit.id, mode && isMode(mode) ? mode : null, me);
        return { enemy: unit.name, published: result.published, counters: result.counters.map((counter) => ({ mode: counter.modeLabel, exactMatch: counter.exactMatch, attackingSquad: counter.attackingSquad, strategy: counter.strategy, requirements: counter.requirements, datacronDependent: counter.datacronDependent, datacronEnds: counter.datacronEnds, guildmatesWhoUseIt: counter.guildmatesWhoUseIt, evidence: counter.evidence, lastReviewed: counter.lastReviewed, memberCanRunIt: counter.memberCanRunIt, memberStillNeeds: counter.memberStillNeeds })) };
      },
    }),

    submitCounterCandidate: tool({
      description: "File a counter you found on the web (with its source link) so officers can review it. It is NOT published and the member is told it is awaiting review. Only use it when a specific web page names a specific attacking squad for a specific enemy squad, and never file your own suggestions or anything without a source link.",
      inputSchema: z.object({
        mode: z.enum(MODES),
        defenderUnits: z.array(z.string().min(1).max(60)).min(1).max(8).describe("The enemy squad's unit names, leader first"),
        attackerUnits: z.array(z.string().min(1).max(60)).min(1).max(8).describe("The attacking squad's unit names, leader first"),
        strategy: z.string().min(10).max(1200).describe("A short summary in your own words of how the source says to run it"),
        sourceUrl: z.string().url().max(500),
        sourceTitle: z.string().max(120).optional(),
        evidenceType: z.enum(["COMMUNITY_REPORT", "THEORY"]),
      }),
      execute: async (input) => {
        if (!me) return { filed: false, error: "No member is linked to this session." };
        const resolve = (names: string[]) => names.map((name) => resolveUnit(name)?.id ?? null);
        const defenderIds = resolve(input.defenderUnits);
        const attackerIds = resolve(input.attackerUnits);
        if (defenderIds.includes(null) || attackerIds.includes(null)) return { filed: false, error: "One of the unit names wasn't recognised. Check the spellings with whoHasUnit's suggestions." };
        const squad = (ids: (string | null)[]) => ids.map((unitId, index) => ({ unitId, role: index === 0 ? "LEADER" : "CORE" }));
        const checked = validateSubmission({
          mode: input.mode, defender: { members: squad(defenderIds) }, attacker: { members: squad(attackerIds) }, strategy: input.strategy,
          evidence: [{ type: input.evidenceType, sourceProvider: input.sourceTitle || new URL(input.sourceUrl).hostname, sourceUrl: input.sourceUrl, observedAt: new Date().toISOString() }],
        }, "BLUE", knownUnitIds);
        if (!checked.ok) return { filed: false, error: checked.error };
        if ((await countRecentSubmissions(me)) >= 5) return { filed: false, error: "Too many filed today. Try again tomorrow." };
        const player = await getPrisma().player.findUnique({ where: { id: me }, select: { currentName: true } });
        const result = await submitMatchup(checked.value, { via: "BLUE", who: `B-Lue3 (for ${player?.currentName ?? "a member"})`, whoId: me });
        return { filed: true, status: result.status, newRecord: result.created, message: "Filed as a candidate. An officer has to review it before anyone else sees it." };
      },
    }),

    myWarOrders: tool({
      description: "The member's own Territory War orders (defence placements and attack targets) from the plan the officers marked Active, plus the Territory Battle plan summary if one is Active.",
      inputSchema: z.object({}),
      execute: async () => {
        const guildId = await getDefaultGuildId();
        if (!guildId) return { error: "No guild configured." };
        const [tw, tb] = await Promise.all([
          getCurrentTwEventId().then((eventId) => getActiveTwPlanDetail(guildId, eventId)),
          getCurrentTbEventId().then((eventId) => getActiveTbPlanDetail(guildId, eventId)),
        ]);
        return {
          territoryWar: tw ? (me ? buildMyOrders(tw, me) : { note: "A plan is active but this session has no roster." }) : { note: "Officers have not posted a Territory War plan yet." },
          territoryBattle: tb
            ? { plan: tb.name, planets: tb.planetPlans.filter((p) => p.strategy !== "SKIP").map((p) => ({ planet: p.planetName, phase: p.phase, strategy: p.strategy, squad: p.command?.name ?? null, note: p.note })) }
            : { note: "Officers have not posted a Territory Battle plan yet." },
        };
      },
    }),
  };
}
