import assert from "node:assert/strict";
import test from "node:test";
import unitNames from "./unit-names.json";
import { ALL_ABBR, expandUnitNicknames, meaningOf, splitAcronyms, UNIT_NICKNAMES, unitNameForNickname } from "./glossary";

test("every unit nickname points at a unit that really exists in the game's list", () => {
  const known = new Set(Object.values(unitNames as Record<string, string>).map((name) => name.toLowerCase()));
  for (const nick of UNIT_NICKNAMES) assert.ok(known.has(nick.name.toLowerCase()), `${nick.abbr} -> ${nick.name}`);
});

test("no short form is listed twice", () => {
  const seen = new Set<string>();
  for (const item of ALL_ABBR) { assert.ok(!seen.has(item.abbr.toLowerCase()), item.abbr); seen.add(item.abbr.toLowerCase()); }
});

test("nicknames are expanded in a question, and other words are left alone", () => {
  assert.equal(expandUnitNicknames("How do I beat JMK in TW?"), "How do I beat Jedi Master Kenobi in TW?");
  assert.equal(expandUnitNicknames("what about gas prices"), "what about gas prices");
  assert.equal(unitNameForNickname("slkr"), "Supreme Leader Kylo Ren");
  assert.equal(meaningOf("tm"), "Turn Meter");
});

test("text is split around known short forms", () => {
  const parts = splitAcronyms("Use CLS to cut TM, then go in");
  assert.deepEqual(parts.filter((p) => p.meaning).map((p) => p.text), ["CLS", "TM"]);
  assert.equal(parts.map((p) => p.text).join(""), "Use CLS to cut TM, then go in");
});
