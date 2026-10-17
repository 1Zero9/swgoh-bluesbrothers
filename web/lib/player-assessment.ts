/** Plain-words read on a member: what they bring to the guild, and what to keep an eye on. Pure, so it is tested. */

export type PlayerFacts = {
  gpRank: number;
  members: number;
  galacticPower: number;
  averageGp: number;
  /** GP change over the history we have, as a fraction (0.04 = +4%). null when there is not enough history. */
  gpChange: number | null;
  galacticLegends: number | null;
  relicUnits: number | null;
  raidTickets: number;
  ticketTarget: number;
  hoursSinceActive: number | null;
  tenureDays: number;
  /** Of the last few raids: how many they joined, out of how many. */
  raidsJoined: number;
  raidsTotal: number;
  /** null when no war is on or unknown. */
  joinedWar: boolean | null;
  wins30d: number;
  countersAdded: number;
  tipsPublished: number;
  profileStale: boolean;
};

export type Assessment = { headline: "Pillar of the band" | "Pulling their weight" | "Needs a nudge"; strengths: string[]; watch: string[] };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function assessPlayer(f: PlayerFacts): Assessment {
  const strengths: string[] = [];
  const watch: string[] = [];

  if (f.members >= 6 && f.gpRank <= Math.ceil(f.members / 3)) strengths.push(`Top third for power (#${f.gpRank} of ${f.members})`);
  if ((f.galacticLegends ?? 0) >= 5) strengths.push(`${plural(f.galacticLegends ?? 0, "Galactic Legend")}: a big help in Territory War and raids`);
  if ((f.relicUnits ?? 0) >= 25) strengths.push(`${f.relicUnits} units at relic level`);
  if (f.raidsTotal >= 3 && f.raidsJoined === f.raidsTotal) strengths.push(`Joined all of the last ${f.raidsTotal} raids`);
  if (f.raidTickets >= f.ticketTarget) strengths.push("Raid tickets on target");
  if (f.hoursSinceActive !== null && f.hoursSinceActive <= 24) strengths.push("Active in the last day");
  if (f.gpChange !== null && f.gpChange >= 0.03) strengths.push(`Growing: power up ${(f.gpChange * 100).toFixed(1)}%`);
  if (f.tenureDays >= 180) strengths.push(`Long-standing: ${Math.round(f.tenureDays / 30)} months in the band`);
  if (f.countersAdded + f.tipsPublished > 0) strengths.push(`Shares what they know: ${[f.countersAdded ? plural(f.countersAdded, "counter") : "", f.tipsPublished ? plural(f.tipsPublished, "tip or idea") : ""].filter(Boolean).join(" and ")}`);
  if (f.wins30d >= 5) strengths.push(`${plural(f.wins30d, "upgrade")} in the last 30 days`);

  if (f.hoursSinceActive === null || f.hoursSinceActive > 48) watch.push(f.hoursSinceActive === null ? "No sign of activity" : `Quiet for ${Math.round(f.hoursSinceActive / 24)} days`);
  if (f.raidTickets < f.ticketTarget * 0.5) watch.push(`Raid tickets low (${f.raidTickets} of ${f.ticketTarget})`);
  if (f.raidsTotal >= 2 && f.raidsTotal - f.raidsJoined >= 2) watch.push(`Missed ${f.raidsTotal - f.raidsJoined} of the last ${f.raidsTotal} raids`);
  if (f.joinedWar === false) watch.push("Did not join the current war");
  if (f.averageGp > 0 && f.galacticPower > 0 && f.galacticPower < f.averageGp * 0.65) watch.push("Power well below the guild average");
  if (f.gpChange !== null && f.gpChange <= -0.02) watch.push(`Power is down ${(Math.abs(f.gpChange) * 100).toFixed(1)}%`);
  if (f.profileStale) watch.push("Roster detail is out of date, so some numbers may be old");

  const headline = watch.length >= 2 ? "Needs a nudge" : strengths.length >= 4 && watch.length === 0 ? "Pillar of the band" : "Pulling their weight";
  return { headline, strengths, watch };
}
