import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCallout, type CalloutRoster } from "./tb-callout-match";

const roster = (playerName: string, units: [string, number, number][] | null): CalloutRoster => ({
  playerName,
  units: units ? new Map(units.map(([id, stars, relic]) => [id, { stars, relic }])) : null,
});

const need = { unitId: "GLREY", minStars: 7, minRelic: 7, needed: 2 };

test("members are split into ready, close, missing and unsynced", () => {
  const result = evaluateCallout(need, [
    roster("Bro", [["GLREY", 7, 9]]),
    roster("Dex", [["GLREY", 7, 5]]),
    roster("Carsen", [["GLREY", 6, 3]]),
    roster("Hesstan", [["LORDVADER", 7, 9]]),
    roster("Ghost", null),
  ]);
  assert.deepEqual(result.ready.map((m) => m.name), ["Bro"]);
  assert.deepEqual(result.close.map((m) => m.name), ["Dex", "Carsen"]);
  assert.equal(result.close[0].gap, "R5 → R7");
  assert.equal(result.close[1].gap, "6★ → 7★, R3 → R7");
  assert.deepEqual(result.missing, ["Hesstan"]);
  assert.deepEqual(result.unsynced, ["Ghost"]);
  assert.equal(result.complete, false);
});

test("a callout completes when enough members are ready", () => {
  const result = evaluateCallout(need, [
    roster("Bro", [["GLREY", 7, 9]]),
    roster("Dex", [["GLREY", 7, 7]]),
  ]);
  assert.equal(result.readyCount, 2);
  assert.equal(result.complete, true);
});

test("a callout with no target count never auto-completes", () => {
  const result = evaluateCallout({ ...need, needed: null }, [roster("Bro", [["GLREY", 7, 9]])]);
  assert.equal(result.complete, false);
});
