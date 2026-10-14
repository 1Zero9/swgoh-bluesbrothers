import assert from "node:assert/strict";
import test from "node:test";
import { buildStatusRow } from "./home-status";

const base = { tw: { wins: 0, losses: 0, recent: [] }, openCallouts: null, tickets: null, lastRaid: null };

test("with no data every card still says something useful", () => {
  const [tw, tb, raids] = buildStatusRow(base);
  assert.equal(tw.headline, "No wars recorded yet");
  assert.equal(tb.headline, "See the planets");
  assert.equal(raids.headline, "Tickets and results");
  assert.equal(raids.bar, null);
});

test("the war card reports the last finished war, not a live score", () => {
  const [tw] = buildStatusRow({ ...base, tw: { wins: 7, losses: 3, recent: [{ opponent: "Rebel Scum", score: 1200000, opponentScore: 900000, won: true, endedAt: new Date("2026-10-10T12:00:00Z") }] } });
  assert.equal(tw.headline, "Won vs Rebel Scum");
  assert.equal(tw.tone, "good");
  assert.equal(tw.bar, 70);
  assert.match(tw.detail, /7 wins in the last 10/);
});

test("open callouts and ticket progress", () => {
  const [, tb, raids] = buildStatusRow({ ...base, openCallouts: 2, tickets: { today: 1500, target: 3000 }, lastRaid: { label: "Krayt Dragon", outcomeLabel: "Completed" } });
  assert.equal(tb.headline, "2 callouts open");
  assert.equal(tb.tone, "warn");
  assert.equal(raids.bar, 50);
  assert.match(raids.detail, /Krayt Dragon, completed/);
  assert.equal(buildStatusRow({ ...base, openCallouts: 1 })[1].headline, "1 callout open");
  assert.equal(buildStatusRow({ ...base, openCallouts: 0 })[1].headline, "No callouts open");
});
