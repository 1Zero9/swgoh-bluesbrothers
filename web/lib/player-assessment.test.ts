import assert from "node:assert/strict";
import test from "node:test";
import { assessPlayer, type PlayerFacts } from "./player-assessment";

const base: PlayerFacts = { gpRank: 20, members: 50, galacticPower: 10_000_000, averageGp: 12_000_000, gpChange: 0, galacticLegends: 2, relicUnits: 5, raidTickets: 500, ticketTarget: 600, hoursSinceActive: 10, tenureDays: 40, raidsJoined: 3, raidsTotal: 3, joinedWar: true, wins30d: 1, countersAdded: 0, tipsPublished: 0, profileStale: false };

test("a strong, active member is a pillar", () => {
  const r = assessPlayer({ ...base, gpRank: 3, galacticLegends: 8, relicUnits: 40, raidTickets: 600, gpChange: 0.05, countersAdded: 2 });
  assert.equal(r.headline, "Pillar of the band");
  assert.ok(r.strengths.length >= 4);
  assert.deepEqual(r.watch, []);
});

test("quiet, missing raids and low tickets needs a nudge", () => {
  const r = assessPlayer({ ...base, hoursSinceActive: 120, raidTickets: 100, raidsJoined: 0, raidsTotal: 3, joinedWar: false });
  assert.equal(r.headline, "Needs a nudge");
  assert.ok(r.watch.some((w) => /Quiet for 5 days/.test(w)));
  assert.ok(r.watch.some((w) => /Missed 3 of the last 3 raids/.test(w)));
});

test("an ordinary member is pulling their weight, and missing data does not raise false alarms", () => {
  const r = assessPlayer({ ...base, gpChange: null, joinedWar: null, galacticLegends: null, relicUnits: null });
  assert.equal(r.headline, "Pulling their weight");
  assert.deepEqual(r.watch, []);
});

test("power slipping is called out", () => {
  const r = assessPlayer({ ...base, gpChange: -0.05, galacticPower: 6_000_000 });
  assert.ok(r.watch.some((w) => /Power is down 5.0%/.test(w)));
  assert.ok(r.watch.some((w) => /below the guild average/.test(w)));
});
