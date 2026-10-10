import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSquadAdvice } from "./roster-advice";
import type { CalloutRoster } from "./tb-callout-match";

const roster = (playerId: string, units: [string, number, number][]): CalloutRoster => ({
  playerId,
  playerName: playerId,
  units: new Map(units.map(([id, stars, relic]) => [id, { stars, relic }])),
});

test("a member is ready, close or missing for each squad, and thin squads come first", () => {
  const rosters = [
    roster("me", [["LORDVADER", 7, 9], ["THIRDSISTER", 7, 5]]), // ready for Vader, close to Reva (needs R7)
    roster("a", [["THIRDSISTER", 7, 8]]),                        // only qualifier for Reva
    roster("b", [["LORDVADER", 7, 8]]),
  ];
  const advice = buildSquadAdvice(rosters, "me");
  assert.ok(advice);
  assert.deepEqual(advice.ready.map((i) => i.key), ["lordVader"]);
  const reva = advice.close.find((i) => i.key === "reva");
  assert.ok(reva);
  assert.equal(reva.qualifiers, 1);
  assert.equal(reva.thin, true);
  assert.match(reva.gap, /R5 → R7 \(2 more levels\)/);
  assert.ok(advice.missing.some((i) => i.key === "jabba"));
});

test("no advice for a member whose roster hasn't synced", () => {
  assert.equal(buildSquadAdvice([{ playerId: "x", playerName: "x", units: null }], "x"), null);
  assert.equal(buildSquadAdvice([], "nobody"), null);
});
