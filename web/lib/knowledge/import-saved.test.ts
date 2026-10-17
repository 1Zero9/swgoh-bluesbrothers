import assert from "node:assert/strict";
import test from "node:test";
import { modesFor, savedImportKey, savedToSubmissions, type SavedCounterRow } from "./import-saved";

const row = (mode: string): SavedCounterRow => ({
  id: "c1", enemyLeaderId: "LORDVADER", title: "JMK squad", mode, notes: "Taunt first.", createdById: "p1", createdByName: "Dex", createdAt: new Date("2026-09-01T10:00:00Z"),
  squad: [{ unitId: "JEDIMASTERKENOBI", minRelic: 7 }, { unitId: "PADMEAMIDALA", minRelic: 0 }],
});

test("modes are never guessed across: TW stays TW, GAC becomes 5v5, both comes in twice", () => {
  assert.deepEqual(modesFor("TW"), ["TW"]);
  assert.deepEqual(modesFor("GAC"), ["GAC_5V5"]);
  assert.deepEqual(modesFor("BOTH"), ["TW", "GAC_5V5"]);
});

test("a saved squad becomes a candidate with its author, relic needs and a plain source", () => {
  const [one] = savedToSubmissions(row("TW"));
  assert.equal(one.importKey, "saved:c1");
  assert.equal(one.input.defender.members[0].unitId, "LORDVADER");
  assert.deepEqual(one.input.attacker.members.map((m) => m.role), ["LEADER", "CORE"]);
  assert.deepEqual(one.input.requirements?.minRelic, { JEDIMASTERKENOBI: 7 });
  assert.equal(one.input.evidence[0].sourceRef, savedImportKey("c1"));
  assert.equal(one.input.evidence[0].attribution, "Dex");
  assert.equal(one.input.strategy, "Taunt first.");
});

test("a GAC counter asks the reviewer to confirm 5v5 or 3v3; a both-mode one has two distinct keys", () => {
  assert.match(savedToSubmissions(row("GAC"))[0].input.strategy ?? "", /confirm the mode/);
  const both = savedToSubmissions(row("BOTH"));
  assert.deepEqual(both.map((s) => s.importKey), ["saved:c1:TW", "saved:c1:GAC_5V5"]);
  assert.doesNotMatch(both[0].input.strategy ?? "", /confirm the mode/);
});
