import { test } from "node:test";
import assert from "node:assert/strict";
import { detectWins, describeWin, unitName } from "./wins";

const unit = (id: string, tier = 1, abilities: string[] = []) => ({
  definitionId: `${id}:SEVEN_STAR`,
  relic: { currentTier: tier },
  purchasedAbilityId: abilities,
});

test("no previous profile means no wins (first sync is a baseline)", () => {
  assert.deepEqual(detectWins(null, { rosterUnit: [unit("GLREY")] }), []);
});

test("a newly unlocked Galactic Legend is named and counted", () => {
  const wins = detectWins(
    { rosterUnit: [unit("LORDVADER", 9)] },
    { rosterUnit: [unit("LORDVADER", 9), unit("GLREY", 3)] },
  );
  assert.deepEqual(wins, [{ kind: "GL_UNLOCK", subject: "GLREY", value: 2 }]);
  assert.match(describeWin(wins[0]).text, /Rey.*2nd Galactic Legend/);
});

test("relic level-ups report the new level once per unit", () => {
  const wins = detectWins(
    { rosterUnit: [unit("GENERALKENOBI", 9)] },
    { rosterUnit: [unit("GENERALKENOBI", 10)] },
  );
  assert.deepEqual(wins, [{ kind: "RELIC", subject: "GENERALKENOBI", value: 8 }]);
});

test("a unit dropping out of the roster or losing relic levels is not a win", () => {
  assert.deepEqual(
    detectWins({ rosterUnit: [unit("GENERALKENOBI", 9)] }, { rosterUnit: [unit("GENERALKENOBI", 5)] }),
    [],
  );
  assert.deepEqual(detectWins({ rosterUnit: [unit("GENERALKENOBI", 9)] }, { rosterUnit: [] }), []);
});

test("ultimates and datacrons are detected", () => {
  const wins = detectWins(
    { rosterUnit: [unit("LORDVADER", 9)], datacron: [{}, {}] },
    { rosterUnit: [unit("LORDVADER", 9, ["ultimateability_lordvader"])], datacron: [{}, {}, {}] },
  );
  assert.deepEqual(wins.map((w) => w.kind).sort(), ["DATACRON", "ULTIMATE"]);
  assert.equal(wins.find((w) => w.kind === "DATACRON")?.value, 3);
});

test("units get proper game names, and unknown ones a readable fallback", () => {
  assert.equal(unitName("GARSAXON"), "Gar Saxon");
  assert.equal(unitName("JARJARBINKS"), "Jar Jar Binks");
  assert.equal(unitName("GLREY"), "Rey"); // curated name wins
  assert.equal(unitName("SOMENEWUNIT"), "Somenewunit");
  assert.equal(unitName(""), null);
});

test("a member's first Relic 9 is flagged once, and not when they already had one", () => {
  const first = detectWins(
    { rosterUnit: [unit("GENERALKENOBI", 10)] },
    { rosterUnit: [unit("GENERALKENOBI", 11)] },
  );
  assert.deepEqual(first.map((w) => w.kind).sort(), ["FIRST_R9", "RELIC"]);
  assert.equal(describeWin(first.find((w) => w.kind === "FIRST_R9")!).tier, "headline");

  const again = detectWins(
    { rosterUnit: [unit("GENERALKENOBI", 11), unit("REY", 10)] },
    { rosterUnit: [unit("GENERALKENOBI", 11), unit("REY", 11)] },
  );
  assert.deepEqual(again.map((w) => w.kind), ["RELIC"]);
});

test("star promotions and gear levels are detected, but not for a brand-new unit or a relic unit", () => {
  const u = (id: string, rarity: number, tier: number, relic = 1) => ({ definitionId: `${id}:SEVEN_STAR`, currentRarity: rarity, currentTier: tier, relic: { currentTier: relic } });
  const stars = detectWins({ rosterUnit: [u("GUNGANPHALANX", 6, 5)] }, { rosterUnit: [u("GUNGANPHALANX", 7, 5)] });
  assert.deepEqual(stars, [{ kind: "STAR", subject: "GUNGANPHALANX", value: 7 }]);
  assert.match(describeWin(stars[0]).text, /promoted .* to 7-Star/);
  const gear = detectWins({ rosterUnit: [u("BENSOLO", 7, 12)] }, { rosterUnit: [u("BENSOLO", 7, 13)] });
  assert.deepEqual(gear, [{ kind: "GEAR", subject: "BENSOLO", value: 13 }]);
  assert.match(describeWin(gear[0]).text, /gear to level XIII/);
  assert.deepEqual(detectWins({ rosterUnit: [] }, { rosterUnit: [u("NEWGUY", 3, 1)] }).map((w) => w.kind), ["UNIT_UNLOCK"]);
  assert.deepEqual(detectWins({ rosterUnit: [u("RELICGUY", 7, 13, 5)] }, { rosterUnit: [u("RELICGUY", 7, 13, 6)] }).map((w) => w.kind), ["RELIC"]);
});
