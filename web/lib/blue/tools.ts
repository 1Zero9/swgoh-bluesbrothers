import { tool } from "ai";
import { z } from "zod";
import { listCounters, loadMemberUnits } from "@/lib/counters-data";
import { getMyPage } from "@/lib/my-page";
import { getSquadAdvice } from "@/lib/roster-advice";
import { calloutHeadline, listCallouts } from "@/lib/tb-callouts";
import { getActiveTbPlanDetail, getActiveTwPlanDetail, getCurrentTbEventId, getCurrentTwEventId, getDefaultGuildId } from "@/lib/tw-plans";
import { buildMyOrders } from "@/lib/tw-my-orders";
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
