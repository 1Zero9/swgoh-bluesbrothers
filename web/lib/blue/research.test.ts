import assert from "node:assert/strict";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { researchCounters } from "./research";

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 10, text: 10, reasoning: 0 } };
const result = (content: unknown[]) => ({ content, finishReason: { unified: "stop", raw: "stop" }, usage, warnings: [] }) as never;

const good = { defenderUnits: ["Lord Vader", "Darth Maul", "Royal Guard", "Snowtrooper", "Death Trooper"], attackerUnits: ["Boba Fett", "Bossk", "Cad Bane", "Greedo", "Dengar"], strategy: "Open with Cad Bane.", sourceUrl: "https://www.reddit.com/r/SWGalaxyOfHeroes/comments/abc", evidenceType: "COMMUNITY_REPORT" };
const invented = { ...good, attackerUnits: ["Boba Fett", "Bossk", "Cad Bane", "Greedo", "Fives"], sourceUrl: "https://totally-made-up.example/counter" };
const badUnit = { ...good, attackerUnits: ["Boba Fett", "Nobody Real", "Cad Bane", "Greedo", "Dengar"] };
const threeUnits = { ...good, attackerUnits: ["Boba Fett", "Bossk", "Cad Bane"] };

test("research files only counters that pass every check, and says why it set the rest aside", async () => {
  const model = new MockLanguageModelV4({
    doGenerate: [
      result([{ type: "text", text: "Reddit thread says bounty hunters beat Vader in TW." }, { type: "source", sourceType: "url", id: "1", url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/x", title: "reddit.com" }]),
      result([{ type: "text", text: JSON.stringify({ counters: [good, invented, badUnit, threeUnits] }) }]),
    ],
  });
  const filed: unknown[] = [];
  const report = await researchCounters(
    { leaderUnitId: "LORDVADER", mode: "TW", officer: "Tester", officerId: null },
    { model: model as never, file: (async (input: unknown, ctx: { via: string }) => { filed.push({ input, ctx }); return { id: "m1", created: true, status: "CANDIDATE", evidenceAdded: 1 }; }) as never },
  );
  assert.equal(report.filed.length, 1);
  assert.equal(report.rejected.length, 3);
  assert.match(report.rejected.map((r) => r.reason).join(" | "), /search actually found/);
  assert.match(report.rejected.map((r) => r.reason).join(" | "), /Nobody Real/);
  assert.match(report.rejected.map((r) => r.reason).join(" | "), /5 units/);
  assert.equal(filed.length, 1);
  assert.equal((filed[0] as { ctx: { via: string } }).ctx.via, "BLUE"); // never filed as anything that can publish
  assert.equal(report.filed[0].status, "CANDIDATE");
});

test("if the search finds nothing, nothing is filed", async () => {
  const model = new MockLanguageModelV4({ doGenerate: [result([{ type: "text", text: "" }])] });
  const report = await researchCounters({ leaderUnitId: "LORDVADER", mode: "TW", officer: "T", officerId: null }, { model: model as never, file: (async () => { throw new Error("must not file"); }) as never });
  assert.equal(report.filed.length, 0);
});
