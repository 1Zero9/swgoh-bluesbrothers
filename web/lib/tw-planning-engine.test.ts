import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateRecommendations,
  detectWarnings,
  computeOffenceReserve,
  computeWorkload,
  buildDiscordGuildMessage,
  buildDiscordPersonalMessage,
  type EligiblePlayer,
  type ZoneInfo,
  type AssignmentRecord,
} from "./tw-planning-engine";
import { SQUAD_KEYS } from "./tw-squads";

function player(
  id: string,
  overrides: Partial<Omit<EligiblePlayer, "squads">> & { squads?: Partial<Record<(typeof SQUAD_KEYS)[number], boolean>> } = {}
): EligiblePlayer {
  return {
    playerId: id,
    name: overrides.name ?? id,
    joined: overrides.joined ?? true,
    galacticPower: overrides.galacticPower ?? 5_000_000,
    squads: { ...emptyAllocationBool(), ...overrides.squads },
  };
}

function emptyAllocationBool(): Record<(typeof SQUAD_KEYS)[number], boolean> {
  return Object.fromEntries(SQUAD_KEYS.map((key) => [key, false])) as Record<(typeof SQUAD_KEYS)[number], boolean>;
}

const zones: ZoneInfo[] = [
  { zoneId: 1, name: "Zone 1 (Top Front)", type: "ground", purpose: "Hard Wall", targetCapacity: 2 },
  { zoneId: 9, name: "Zone 9 (Fleet Front)", type: "fleet", purpose: "Fleet Hold", targetCapacity: 2 },
];

test("generateRecommendations fills zones with eligible squads, skipping locked players", () => {
  const pool: EligiblePlayer[] = [
    player("p1", { squads: { lordVader: true }, galacticPower: 9_000_000 }),
    player("p2", { squads: { lordVader: true }, galacticPower: 7_000_000 }),
    player("p3", { squads: { leviathan: true } }),
  ];
  const recs = generateRecommendations(pool, zones, []);
  assert.ok(recs.length > 0);
  const zone1 = recs.filter((r) => r.zoneId === 1);
  assert.equal(zone1[0]?.playerId, "p1");
  const zone9 = recs.filter((r) => r.zoneId === 9);
  assert.equal(zone9[0]?.playerId, "p3");
});

test("generateRecommendations applies template squadPriority and zonePriority overrides", () => {
  const pool: EligiblePlayer[] = [
    player("p1", { squads: { lordVader: true, jabba: true }, galacticPower: 9_000_000 }),
  ];
  // Zone 1 defaults to Hard Wall (priority 0); flipping its zonePriority behind
  // Zone 9's should not change who gets picked here, but confirms no crash/behavioural
  // regression when zonePriority is supplied. squadPriority forces jabba ahead of
  // lordVader even though lordVader would normally be preferred by zoneHint.
  const recs = generateRecommendations(pool, zones, [], {
    zonePriority: { 9: 0, 1: 1 },
    squadPriority: { 1: ["jabba"] },
  });
  const zone1 = recs.filter((r) => r.zoneId === 1);
  assert.equal(zone1[0]?.squadKey, "jabba");
});

test("generateRecommendations does not reassign locked/manual players", () => {
  const pool: EligiblePlayer[] = [
    player("p1", { squads: { lordVader: true } }),
  ];
  const existing: AssignmentRecord[] = [
    {
      id: "a1",
      zoneId: 5,
      playerId: "p1",
      squadKey: "lordVader",
      priority: 0,
      status: "PLACED",
      source: "MANUAL",
      locked: true,
      officerNote: null,
      createdBy: null,
      updatedBy: null,
    },
  ];
  const recs = generateRecommendations(pool, zones, existing);
  assert.equal(recs.find((r) => r.playerId === "p1"), undefined);
});

test("detectWarnings flags duplicate assignments and not-joined players", () => {
  const pool: EligiblePlayer[] = [
    player("p1", { squads: { lordVader: true }, joined: false }),
  ];
  const assignments: AssignmentRecord[] = [
    { id: "a1", zoneId: 1, playerId: "p1", squadKey: "lordVader", priority: 0, status: "SUGGESTED", source: "RECOMMENDED", locked: false, officerNote: null, createdBy: null, updatedBy: null },
    { id: "a2", zoneId: 9, playerId: "p1", squadKey: "lordVader", priority: 1, status: "SUGGESTED", source: "RECOMMENDED", locked: false, officerNote: null, createdBy: null, updatedBy: null },
  ];
  const warnings = detectWarnings(zones, assignments, pool);
  assert.ok(warnings.some((w) => w.code === "DUPLICATE_ASSIGNMENT"));
  assert.ok(warnings.some((w) => w.code === "NOT_JOINED"));
});

test("detectWarnings flags empty zones", () => {
  const warnings = detectWarnings(zones, [], []);
  assert.equal(warnings.filter((w) => w.code === "EMPTY_ZONE").length, 2);
});

test("computeOffenceReserve reports unassigned squad-capable players and a health tier", () => {
  const pool: EligiblePlayer[] = [
    player("p1", { squads: { lordVader: true } }),
    player("p2", { squads: { jabba: true } }),
  ];
  const reserve = computeOffenceReserve(pool, []);
  assert.equal(reserve.reservedCount, 2);
  assert.ok(["Strong", "Acceptable", "At Risk", "Critical"].includes(reserve.health));
});

test("computeWorkload flags players with more than one assignment", () => {
  const pool: EligiblePlayer[] = [player("p1")];
  const assignments: AssignmentRecord[] = [
    { id: "a1", zoneId: 1, playerId: "p1", squadKey: "lordVader", priority: 0, status: "SUGGESTED", source: "RECOMMENDED", locked: false, officerNote: null, createdBy: null, updatedBy: null },
    { id: "a2", zoneId: 9, playerId: "p1", squadKey: "leviathan", priority: 1, status: "SUGGESTED", source: "RECOMMENDED", locked: false, officerNote: null, createdBy: null, updatedBy: null },
  ];
  const workload = computeWorkload(pool, assignments);
  assert.equal(workload[0]?.overloaded, true);
  assert.equal(workload[0]?.assignmentCount, 2);
});

test("buildDiscordGuildMessage lists assignments grouped by zone", () => {
  const pool: EligiblePlayer[] = [player("p1", { name: "Solo" })];
  const assignments: AssignmentRecord[] = [
    { id: "a1", zoneId: 1, playerId: "p1", squadKey: "lordVader", priority: 0, status: "PLACED", source: "MANUAL", locked: true, officerNote: null, createdBy: null, updatedBy: null },
  ];
  const message = buildDiscordGuildMessage("TW Round 3", zones, assignments, pool);
  assert.match(message, /Solo/);
  assert.match(message, /Lord Vader GL/);
});

test("buildDiscordPersonalMessage handles unassigned players", () => {
  const message = buildDiscordPersonalMessage(player("p1", { name: "Solo" }), [], zones);
  assert.match(message, /no defensive assignment yet/);
});
