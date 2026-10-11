import { test } from "node:test";
import assert from "node:assert/strict";
import { counterReadiness, squadStatus, validateCounter, type MemberUnits } from "./counters";
import type { UnitMatch } from "./who-has";

const units: UnitMatch[] = [
  { id: "LORDVADER", name: "Lord Vader" },
  { id: "JEDIMASTERKENOBI", name: "Jedi Master Kenobi" },
  { id: "BOKATAN", name: "Bo-Katan" },
  { id: "GLREY", name: "Rey" },
];
const nameOf = (id: string) => units.find((u) => u.id === id)?.name ?? id;
const member = (playerId: string, name: string, owned: [string, number, number][]): MemberUnits => ({
  playerId, name, units: new Map(owned.map(([id, stars, relic]) => [id, { stars, relic, gear: 13 }])),
});
const squad = [{ unitId: "JEDIMASTERKENOBI", minStars: 7, minRelic: 7 }, { unitId: "BOKATAN", minStars: 7, minRelic: 5 }];

test("a new counter is cleaned up and checked", () => {
  const ok = validateCounter({ enemyLeaderId: "LORDVADER", title: "  JMK squad ", mode: "TW", squad: [{ unitId: "JEDIMASTERKENOBI", minStars: 9, minRelic: -2 }, { unitId: "BOKATAN" }], notes: " go first " }, units);
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.counter.title, "JMK squad");
    assert.deepEqual(ok.counter.squad, [{ unitId: "JEDIMASTERKENOBI", minStars: 7, minRelic: 0 }, { unitId: "BOKATAN", minStars: 7, minRelic: 0 }]);
    assert.equal(ok.counter.notes, "go first");
  }
  const bad = (body: unknown) => validateCounter(body, units);
  assert.equal(bad({ enemyLeaderId: "NOPE", title: "x", squad: [{ unitId: "BOKATAN" }] }).ok, false);
  assert.equal(bad({ enemyLeaderId: "LORDVADER", title: "", squad: [{ unitId: "BOKATAN" }] }).ok, false);
  assert.equal(bad({ enemyLeaderId: "LORDVADER", title: "x", squad: [] }).ok, false);
  assert.equal(bad({ enemyLeaderId: "LORDVADER", title: "x", squad: [{ unitId: "BOKATAN" }, { unitId: "BOKATAN" }] }).ok, false);
  assert.equal(bad({ enemyLeaderId: "LORDVADER", title: "x", squad: [{ unitId: "MADEUP" }] }).ok, false);
});

test("a member is ready, close with exact gaps, or missing a unit", () => {
  assert.equal(squadStatus(squad, member("a", "A", [["JEDIMASTERKENOBI", 7, 9], ["BOKATAN", 7, 5]]), nameOf).ready, true);
  const close = squadStatus(squad, member("b", "B", [["JEDIMASTERKENOBI", 7, 5], ["BOKATAN", 7, 5]]), nameOf);
  assert.equal(close.ready, false);
  assert.deepEqual(close.gaps, ["Jedi Master Kenobi: R5 → R7"]);
  const missing = squadStatus(squad, member("c", "C", [["JEDIMASTERKENOBI", 7, 9]]), nameOf);
  assert.deepEqual(missing.gaps, ["Bo-Katan: not owned"]);
  assert.equal(Number.isFinite(missing.effort), false);
});

test("readiness lists who can run it, who is closest, and your own standing", () => {
  const members = [
    member("a", "Bro", [["JEDIMASTERKENOBI", 7, 9], ["BOKATAN", 7, 8]]),
    member("b", "Dex", [["JEDIMASTERKENOBI", 7, 5], ["BOKATAN", 7, 5]]),
    member("c", "Hesstan", [["JEDIMASTERKENOBI", 7, 3], ["BOKATAN", 7, 5]]),
    member("d", "Nobody", [["JEDIMASTERKENOBI", 7, 9]]),
  ];
  const result = counterReadiness(squad, members, nameOf, "b");
  assert.deepEqual(result.ready, ["Bro"]);
  assert.deepEqual(result.close.map((c) => c.name), ["Dex", "Hesstan"]); // Dex is 2 levels off, Hesstan 4; "Nobody" can't run it at all
  assert.deepEqual(result.you?.gaps, ["Jedi Master Kenobi: R5 → R7"]);
  assert.equal(counterReadiness(squad, members, nameOf, "zzz").you?.ready, false);
});

import { formatCounters } from "./counters";

test("the Discord reply shows the squad, your status and who is ready", () => {
  const reply = formatCounters("Lord Vader", [{
    title: "JMK squad", mode: "BOTH", createdByName: "Carsen", notes: "Lead with Bo-Katan",
    squad: [{ name: "Jedi Master Kenobi", minStars: 7, minRelic: 7 }, { name: "Bo-Katan", minStars: 7, minRelic: 0 }],
    readiness: { ready: ["Bro", "BDB"], close: [], you: { ready: false, gaps: ["Jedi Master Kenobi: R5 → R7"], effort: 2 } },
  }], "https://example.test/counters");
  assert.match(reply, /\*\*Counters to Lord Vader\*\*/);
  assert.match(reply, /\*\*1\. JMK squad\*\* \(TW \+ GAC\) · by Carsen/);
  assert.match(reply, /Jedi Master Kenobi R7\+, Bo-Katan 7★/);
  assert.match(reply, /❌ Jedi Master Kenobi: R5 → R7/);
  assert.match(reply, /Ready now \(2\): Bro, BDB/);
  assert.match(formatCounters("Rey", [], "https://example.test/counters"), /Nobody has added a counter to \*\*Rey\*\* yet/);
});
