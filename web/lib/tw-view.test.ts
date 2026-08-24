import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAssignmentRecords, buildEffectiveZones, buildPool } from "./tw-view";
import { SQUAD_KEYS } from "./tw-squads";

function boolAllocation(trueKeys: string[] = []) {
  return Object.fromEntries(SQUAD_KEYS.map((key) => [key, trueKeys.includes(key)])) as Record<
    (typeof SQUAD_KEYS)[number],
    boolean
  >;
}

test("buildEffectiveZones falls back to defaults and applies overrides", () => {
  const zones = buildEffectiveZones([
    { id: "z1", zoneId: 1, purpose: "Trap", targetCapacity: 10, note: "test", updatedBy: null },
  ]);
  assert.equal(zones.length, 10);
  assert.equal(zones[0]?.purpose, "Trap");
  assert.equal(zones[0]?.targetCapacity, 10);
  assert.equal(zones[1]?.purpose, "Hard Wall");
});

test("buildAssignmentRecords resolves zonePlanId to zoneId", () => {
  const records = buildAssignmentRecords(
    [{ id: "zp1", zoneId: 3, purpose: null, targetCapacity: 25, note: null, updatedBy: null }],
    [
      {
        id: "a1",
        zonePlanId: "zp1",
        playerId: "p1",
        squadKey: "lordVader",
        priority: 0,
        status: "PLACED",
        source: "MANUAL",
        locked: true,
        officerNote: null,
        createdBy: null,
        updatedBy: null,
      },
      {
        id: "a2",
        zonePlanId: "unknown",
        playerId: "p2",
        squadKey: "jabba",
        priority: 1,
        status: "SUGGESTED",
        source: "RECOMMENDED",
        locked: false,
        officerNote: null,
        createdBy: null,
        updatedBy: null,
      },
    ]
  );
  assert.equal(records.length, 1);
  assert.equal(records[0]?.zoneId, 3);
});

test("buildPool joins squad pool with member names and GP", () => {
  const pool = buildPool(
    [{ playerId: "p1", joined: true, squads: boolAllocation(["lordVader"]) }],
    [{ playerId: "p1", name: "Solo", galacticPower: "5000000" }]
  );
  assert.equal(pool[0]?.name, "Solo");
  assert.equal(pool[0]?.galacticPower, 5_000_000);
});
