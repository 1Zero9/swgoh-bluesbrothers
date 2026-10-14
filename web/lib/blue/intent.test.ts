import assert from "node:assert/strict";
import { test } from "node:test";
import { detectIntent, detectMode, findUnit } from "./intent";

const units = [
  { id: "LORDVADER", name: "Lord Vader" }, { id: "DARTHREVAN", name: "Darth Revan" }, { id: "MOTHERTALZIN", name: "Mother Talzin" },
  { id: "GLHONDO", name: "Pirate King Hondo Ohnaka" }, { id: "HONDO", name: "Hondo Ohnaka" }, { id: "GENERALSKYWALKER", name: "General Skywalker" },
  { id: "REVAN", name: "Revan" }, { id: "JABBATHEHUTT", name: "Jabba the Hutt" },
];

test("counter questions are recognised, with aliases and the mode", () => {
  const night = detectIntent("can you suggest a counter team against night sisters", units);
  assert.ok(night.kind === "counter" && night.unit.id === "MOTHERTALZIN" && night.mode === null);
  const gas = detectIntent("how do I beat GAS in tw?", units);
  assert.ok(gas.kind === "counter" && gas.unit.id === "GENERALSKYWALKER" && gas.mode === "TW");
  const hondo = detectIntent("I need a counter team for pirate king hondo", units);
  assert.ok(hondo.kind === "counter" && hondo.unit.id === "GLHONDO");
});

test("the unit after 'against / for' is the subject, and the longest name wins", () => {
  assert.equal(findUnit("I have Darth Revan, how do I beat Lord Vader", units)?.id, "LORDVADER");
  assert.equal(findUnit("counter for Darth Revan", units)?.id, "DARTHREVAN"); // not the shorter "Revan"
});

test("an ambiguous or missing name is left to the AI", () => {
  assert.equal(findUnit("beat hondo", units), null); // two units answer to plain "hondo", so don't guess
  assert.equal(detectIntent("how do I beat hondo", units).kind, "other"); // the AI can ask which one
  assert.equal(detectIntent("what should I farm next?", units).kind, "other");
  assert.equal(detectIntent("hello there", units).kind, "other");
});

test("who has", () => {
  const r = detectIntent("who has Jabba the Hutt?", units);
  assert.ok(r.kind === "whohas" && r.unit.id === "JABBATHEHUTT");
});

test("modes", () => {
  assert.equal(detectMode("in Territory War"), "TW");
  assert.equal(detectMode("for gac 3v3"), "GAC_3V3");
  assert.equal(detectMode("grand arena"), "GAC_5V5");
  assert.equal(detectMode("any ideas"), null);
});
