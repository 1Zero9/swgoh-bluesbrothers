import assert from "node:assert/strict";
import { test } from "node:test";
import { BLUE_INSTRUCTIONS, instructionsFor } from "./prompt";

test("with web search B-Lue3 is told nothing extra", () => {
  assert.equal(instructionsFor(true), BLUE_INSTRUCTIONS);
});

test("without web search he is told not to claim it, and to say it failed just now", () => {
  const text = instructionsFor(false);
  assert.ok(text.startsWith(BLUE_INSTRUCTIONS));
  assert.match(text, /NOT available/);
  assert.match(text, /couldn't search the web just now/);
});
