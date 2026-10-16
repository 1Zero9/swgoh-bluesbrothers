import { listCounters } from "@/lib/counters-data";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import { getPrisma } from "@/lib/prisma";

/** What the Home control panel's "My squads" tab shows for one member. */
export type MySquads = {
  /** Counters this member saved, newest first, with whether they can run each one now. */
  saved: { id: string; title: string; enemy: string; mode: string; units: string[]; ready: boolean | null; gap: string | null }[];
  /** Published counters this member marked "This is what I use". */
  uses: { id: string; attacker: string; defender: string; mode: string }[];
};

export const EMPTY_SQUADS: MySquads = { saved: [], uses: [] };

const MODE_SHORT: Record<string, string> = { TW: "Territory War", GAC: "Grand Arena", BOTH: "Any mode" };

export async function getMySquads(playerId: string | null | undefined): Promise<MySquads> {
  if (!playerId) return EMPTY_SQUADS;
  const [counters, marks] = await Promise.all([
    listCounters({ youPlayerId: playerId, createdById: playerId, limit: 6 }),
    getPrisma().kbUse.findMany({
      where: { playerId, matchup: { status: "PUBLISHED" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { matchup: { select: { id: true, mode: true, attacker: { select: { label: true, team: { select: { name: true } } } }, defender: { select: { label: true, team: { select: { name: true } } } } } } },
    }),
  ]);
  const teamName = (variant: { label: string | null; team: { name: string } }) => (variant.label ? `${variant.team.name} (${variant.label})` : variant.team.name);
  return {
    saved: counters.map((counter) => ({
      id: counter.id,
      title: counter.title,
      enemy: counter.enemy.name,
      mode: MODE_SHORT[counter.mode] ?? counter.mode,
      units: counter.squad.map((slot) => slot.name),
      ready: counter.readiness.you ? counter.readiness.you.ready : null,
      gap: counter.readiness.you && !counter.readiness.you.ready ? (counter.readiness.you.gaps[0] ?? null) : null,
    })),
    uses: marks.map((mark) => ({
      id: mark.matchup.id,
      attacker: teamName(mark.matchup.attacker),
      defender: teamName(mark.matchup.defender),
      mode: MODE_LABELS[mark.matchup.mode as KbMode] ?? mark.matchup.mode,
    })),
  };
}
