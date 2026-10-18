import { test } from "node:test";
import assert from "node:assert/strict";
import { findHolders, formatHolders, resolveUnit, searchUnits, type UnitMatch } from "./who-has";
import type { CalloutRoster } from "./tb-callout-match";

const units: UnitMatch[] = [
  { id: "YODADSV", name: "Yoda (Dark Side Vision)" },
  { id: "GRANDMASTERYODA", name: "Grand Master Yoda" },
  { id: "HERMITYODA", name: "Hermit Yoda" },
  { id: "GLREY", name: "Rey" },
];

const roster = (name: string, stars: number, relic: number, gear: number): CalloutRoster => ({
  playerName: name,
  units: new Map([["YODADSV", { stars, relic, gear }]]),
});

test("typing part of a name finds the unit, best matches first", () => {
  // Names that start with the query come first, then names that merely contain it, each alphabetically.
  assert.deepEqual(searchUnits("yoda", 10, units).map((u) => u.id), ["YODADSV", "GRANDMASTERYODA", "HERMITYODA"]);
  assert.equal(searchUnits("yoda dark", 5, units)[0].id, "YODADSV");
  assert.equal(searchUnits("rey", 5, units)[0].id, "GLREY");
  assert.deepEqual(searchUnits("", 5, units), []);
  assert.deepEqual(searchUnits("zzz", 5, units), []);
});

test("a unit is resolved from an id, an exact name or a fuzzy name", () => {
  assert.equal(resolveUnit("YODADSV", units)?.id, "YODADSV");
  assert.equal(resolveUnit("Hermit Yoda", units)?.id, "HERMITYODA");
  assert.equal(resolveUnit("dark yoda", units)?.id, "YODADSV");
  assert.equal(resolveUnit("   ", units), null);
});

test("holders are ranked by stars, then relic, then gear, and can be filtered by stars", () => {
  const rosters = [roster("Hesstan", 6, 0, 12), roster("BDB", 7, 3, 13), roster("Bro", 7, 4, 13), roster("Dex", 3, 0, 8), { playerName: "NoRoster", units: null }];
  assert.deepEqual(findHolders(rosters, "YODADSV").map((h) => h.name), ["Bro", "BDB", "Hesstan", "Dex"]);
  assert.deepEqual(findHolders(rosters, "YODADSV", 7).map((h) => h.name), ["Bro", "BDB"]);
  assert.deepEqual(findHolders(rosters, "GLREY"), []);
});

test("the Discord reply is readable and bounded", () => {
  const text = formatHolders(units[0], [{ name: "Bro", stars: 7, relic: 4, gear: 13 }, { name: "Hesstan", stars: 6, relic: 0, gear: 12 }], 0, 50);
  assert.match(text, /\*\*Yoda \(Dark Side Vision\)\*\*: 2 of 50 members/);
  assert.match(text, /\*\*7★\*\* R4 · Bro/);
  assert.match(text, /\*\*6★\*\* G12 · Hesstan/);
  assert.match(formatHolders(units[0], [], 7, 50), /Nobody in the guild has \*\*Yoda \(Dark Side Vision\)\*\* at 7★ or more/);
  const many = Array.from({ length: 80 }, (_, i) => ({ name: `Member${i}`, stars: 3, relic: 0, gear: 9 }));
  const long = formatHolders(units[0], many, 0, 80);
  assert.ok(long.length <= 1990);
  assert.match(long, /…and 40 more/);
});

test("the game's full unit names resolve even where the site shows a shorter one", () => {
  const units = [{ id: "GRANDMASTERLUKE", name: "Jedi Master Luke" }, { id: "LORDVADER", name: "Lord Vader" }];
  assert.equal(resolveUnit("Jedi Master Luke Skywalker", units)?.id, "GRANDMASTERLUKE");
  assert.equal(resolveUnit("Jedi Master Luke", units)?.id, "GRANDMASTERLUKE");
  assert.equal(resolveUnit("Totally Made Up Hero", units), null);
});
