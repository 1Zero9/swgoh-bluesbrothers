import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRequirements } from "./requirements";

test("a player meeting both requirements qualifies", () => {
  const result = evaluateRequirements({ galacticPower: 12_400_000, galacticLegends: 6 });
  assert.equal(result.meets, true);
  assert.deepEqual(result.checks.map((c) => c.ok), [true, true]);
});

test("each requirement is reported separately", () => {
  const result = evaluateRequirements({ galacticPower: 9_900_000, galacticLegends: 5 });
  assert.equal(result.meets, false);
  assert.deepEqual(result.checks.map((c) => [c.label, c.ok]), [["Galactic Power", false], ["Galactic Legends", true]]);
  assert.equal(result.checks[0].have, "9.9M");
  assert.equal(result.checks[0].need, "10.0M+");
});

test("exactly on the line counts", () => {
  assert.equal(evaluateRequirements({ galacticPower: 10_000_000, galacticLegends: 5 }).meets, true);
});
