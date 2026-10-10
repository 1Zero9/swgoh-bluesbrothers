import { test } from "node:test";
import assert from "node:assert/strict";
import { PROMPTS, isPromptWindow, pickPrompt } from "./prompts";

test("every prompt has a unique id and reads as a question or an invitation", () => {
  assert.ok(PROMPTS.length >= 40);
  assert.equal(new Set(PROMPTS.map((p) => p.id)).size, PROMPTS.length);
  for (const prompt of PROMPTS) assert.ok(prompt.text.length > 20 && prompt.text.length < 200, prompt.id);
});

test("prompts are not repeated until every one has been used", () => {
  const first = pickPrompt([]);
  const second = pickPrompt([first.id]);
  assert.notEqual(second.id, first.id);
  assert.equal(pickPrompt(PROMPTS.map((p) => p.id)).id, PROMPTS[0].id);
});

test("the prompt only goes out in daylight on Wednesday evening or Thursday (UK time)", () => {
  // 14 Oct 2026 is a Wednesday and the clocks are still on summer time (UTC+1).
  assert.equal(isPromptWindow(new Date("2026-10-14T14:30:00Z")), false); // 15:30 UK, too early
  assert.equal(isPromptWindow(new Date("2026-10-14T15:30:00Z")), true);  // 16:30 UK
  assert.equal(isPromptWindow(new Date("2026-10-14T21:30:00Z")), false); // 22:30 UK, too late
  assert.equal(isPromptWindow(new Date("2026-10-15T06:30:00Z")), false); // Thu 07:30 UK, too early
  assert.equal(isPromptWindow(new Date("2026-10-15T09:30:00Z")), true);  // Thu 10:30 UK
  assert.equal(isPromptWindow(new Date("2026-10-16T10:00:00Z")), false); // Friday
  assert.equal(isPromptWindow(new Date("2026-10-12T17:00:00Z")), false); // Monday
});
