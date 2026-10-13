import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWelcome, joinedLabel } from "./welcome";

const now = Date.parse("2026-10-13T12:00:00Z");
const daysAgo = (days: number) => new Date(now - days * 86_400_000);

test("nobody new, no banner", () => {
  assert.equal(buildWelcome([], now), null);
  assert.equal(buildWelcome([{ name: "Old", joinedAt: daysAgo(25) }], now), null);
});

test("names the fresh arrivals, newest first, and says when the latest joined", () => {
  const welcome = buildWelcome([{ name: "A", joinedAt: daysAgo(1) }, { name: "B", joinedAt: daysAgo(10) }, { name: "Old", joinedAt: daysAgo(40) }], now)!;
  assert.deepEqual(welcome.names, ["A", "B"]);
  assert.equal(welcome.latest, "yesterday");
  assert.equal(welcome.single, false);
  assert.equal(welcome.more, 0);
});

test("caps the names and counts the rest", () => {
  const many = Array.from({ length: 6 }, (_, i) => ({ name: `M${i}`, joinedAt: daysAgo(i) }));
  const welcome = buildWelcome(many, now)!;
  assert.equal(welcome.names.length, 4);
  assert.equal(welcome.more, 2);
});

test("labels today and older days", () => {
  assert.equal(joinedLabel(daysAgo(0), now), "today");
  assert.equal(joinedLabel(daysAgo(16), now), "16 days ago");
});
