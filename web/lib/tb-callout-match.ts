export type CalloutRequirement = {
  unitId: string;
  minStars: number;
  minRelic: number;
  needed: number | null;
};

export type CalloutRoster = {
  playerName: string;
  /** null when the member's profile hasn't synced yet. */
  units: Map<string, { stars: number; relic: number }> | null;
};

export type CalloutMember = { name: string; stars: number; relic: number; gap: string };

export type CalloutProgress = {
  ready: CalloutMember[];
  close: CalloutMember[];
  missing: string[];
  unsynced: string[];
  readyCount: number;
  needed: number | null;
  complete: boolean;
};

/** Gap from where a member is to what the callout asks for, as a short label. */
function describeGap(have: { stars: number; relic: number }, need: CalloutRequirement) {
  const parts: string[] = [];
  if (have.stars < need.minStars) parts.push(`${have.stars}★ → ${need.minStars}★`);
  if (need.minRelic > 0 && have.relic < need.minRelic) parts.push(`R${have.relic} → R${need.minRelic}`);
  return parts.join(", ");
}

function gapSize(have: { stars: number; relic: number }, need: CalloutRequirement) {
  return Math.max(0, need.minStars - have.stars) * 3 + Math.max(0, need.minRelic - have.relic);
}

export function evaluateCallout(need: CalloutRequirement, rosters: CalloutRoster[]): CalloutProgress {
  const ready: CalloutMember[] = [];
  const close: (CalloutMember & { size: number })[] = [];
  const missing: string[] = [];
  const unsynced: string[] = [];

  for (const roster of rosters) {
    if (!roster.units) {
      unsynced.push(roster.playerName);
      continue;
    }
    const have = roster.units.get(need.unitId);
    if (!have) {
      missing.push(roster.playerName);
      continue;
    }
    const size = gapSize(have, need);
    const member = { name: roster.playerName, stars: have.stars, relic: have.relic, gap: size ? describeGap(have, need) : "" };
    if (size === 0) ready.push(member);
    else close.push({ ...member, size });
  }

  ready.sort((a, b) => b.relic - a.relic || a.name.localeCompare(b.name));
  close.sort((a, b) => a.size - b.size || a.name.localeCompare(b.name));
  missing.sort((a, b) => a.localeCompare(b));

  return {
    ready,
    close: close.map((entry) => ({ name: entry.name, stars: entry.stars, relic: entry.relic, gap: entry.gap })),
    missing,
    unsynced,
    readyCount: ready.length,
    needed: need.needed,
    complete: need.needed !== null && ready.length >= need.needed,
  };
}
