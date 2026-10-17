import assert from "node:assert/strict";
import test from "node:test";
import { launchRows, type LaunchFacts } from "./launch-check";

const base: LaunchFacts = { blueAi: true, webSearch: true, published: 20, candidates: 0, savedWaiting: 0, tips: 2, ideas: 1, openRequests: 0, activeMembers: 50, discordLinked: 50, seenThisWeek: 40, helpWaiting: 0, botConfigured: true, countersWebhook: true, officerWebhook: true, discordWidget: true };
const flat = (f: LaunchFacts) => launchRows(f).flatMap((g) => g.rows);

test("a fully ready guild is all good", () => {
  assert.equal(flat(base).every((r) => r.tone === "good"), true);
});

test("an empty counter knowledge base and AI off are called out plainly", () => {
  const rows = flat({ ...base, published: 0, blueAi: false });
  assert.equal(rows.find((r) => r.label === "Counters members can find")?.tone, "bad");
  assert.equal(rows.find((r) => r.label === "B-Lue3 AI chat")?.tone, "bad");
});

test("unlinked members and waiting help requests show", () => {
  const rows = flat({ ...base, discordLinked: 12, helpWaiting: 2 });
  assert.match(rows.find((r) => r.label === "Discord accounts linked")?.detail ?? "", /38 members/);
  assert.equal(rows.find((r) => r.label.includes("Obi-Wan"))?.tone, "bad");
});
