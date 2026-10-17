import assert from "node:assert/strict";
import test from "node:test";
import { topUnits } from "./my-roster";

const unit = (id: string, stars: number, tier: number) => ({ definitionId: `${id}:SEVEN_STAR`, currentRarity: stars, relic: { currentTier: tier } });

test("strongest units first: relic, then stars", () => {
  const picks = topUnits({ rosterUnit: [unit("GENERALVEERS", 7, 3), unit("LORDVADER", 7, 11), unit("MERRIN", 5, 1), unit("OLDDAKA", 7, 1)] });
  assert.deepEqual(picks.map((p) => [p.id, p.relic]), [["LORDVADER", 9], ["GENERALVEERS", 1], ["OLDDAKA", 0], ["MERRIN", 0]]);
});

test("odd data gives nothing rather than an error, and the list is capped", () => {
  assert.deepEqual(topUnits(null), []);
  assert.deepEqual(topUnits({ rosterUnit: "x" }), []);
  assert.equal(topUnits({ rosterUnit: Array.from({ length: 90 }, (_, i) => unit(`U${i}`, 7, 1)) }, 10).length, 10);
});
