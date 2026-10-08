import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWeeklyDigest } from "./wins-digest";

test("no wins means no post", () => {
  assert.equal(buildWeeklyDigest([]), null);
});

test("headline wins are named, smaller ones are summarised", () => {
  const digest = buildWeeklyDigest([
    { who: "Hesstan", kind: "GL_UNLOCK", subject: "GLREY", value: 7 },
    { who: "Bro", kind: "RELIC", subject: "GENERALKENOBI", value: 5 },
    { who: "Dex", kind: "DATACRON", subject: "", value: 12 },
  ]);
  assert.ok(digest);
  assert.match(digest.description, /\*\*Hesstan\*\* unlocked Rey/);
  assert.match(digest.description, /Plus 2 smaller upgrades/);
  assert.match(digest.description, /\*\*3 members\*\*/);
  assert.doesNotMatch(digest.description, /\*\*Bro\*\*/);
});

test("long weeks are capped under Discord's description limit", () => {
  const wins = Array.from({ length: 80 }, (_, i) => ({
    who: `Member${i}`, kind: "GL_UNLOCK" as const, subject: "", value: i + 1,
  }));
  const digest = buildWeeklyDigest(wins);
  assert.ok(digest);
  assert.ok(digest.description.length < 3500);
  assert.match(digest.description, /…and 68 more/);
});

test("linked members are tagged by Discord id, others by name", () => {
  const digest = buildWeeklyDigest([
    { who: "Hesstan", discordUserId: "111", kind: "GL_UNLOCK", subject: "GLREY", value: 7 },
    { who: "Dex", discordUserId: null, kind: "ULTIMATE", subject: "", value: 3 },
  ]);
  assert.ok(digest);
  assert.match(digest.description, /<@111> unlocked Rey/);
  assert.match(digest.description, /\*\*Dex\*\*/);
  assert.deepEqual(digest.mentionUserIds, ["111"]);
});
