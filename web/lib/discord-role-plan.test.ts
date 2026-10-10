import { test } from "node:test";
import assert from "node:assert/strict";
import { planOfficerRoleChanges } from "./discord-role-plan";

const ROLE = "officer-role";
const members = [
  { id: "1", roles: [] },
  { id: "2", roles: [ROLE] },
  { id: "3", roles: [ROLE] }, // linked to a player who is no longer an officer
  { id: "4", roles: [ROLE] }, // Discord-only moderator: not linked to any player
];

test("officers gain the role and ex-officers lose it", () => {
  const plan = planOfficerRoleChanges(
    [
      { name: "Newly Promoted", shouldBeOfficer: true, discordUserIds: ["1"] },
      { name: "Still Officer", shouldBeOfficer: true, discordUserIds: ["2"] },
      { name: "Demoted", shouldBeOfficer: false, discordUserIds: ["3"] },
    ],
    members,
    ROLE,
  );
  assert.deepEqual(plan.add.map((c) => c.playerName), ["Newly Promoted"]);
  assert.deepEqual(plan.remove.map((c) => c.playerName), ["Demoted"]);
});

test("unlinked Discord members and people not in the server are never touched", () => {
  const plan = planOfficerRoleChanges(
    [{ name: "Not In Server", shouldBeOfficer: true, discordUserIds: ["99"] }],
    members,
    ROLE,
  );
  assert.deepEqual(plan, { add: [], remove: [] });
});

test("a second Discord account of an officer is covered too", () => {
  const plan = planOfficerRoleChanges(
    [{ name: "Two Accounts", shouldBeOfficer: true, discordUserIds: ["2", "1"] }],
    members,
    ROLE,
  );
  assert.deepEqual(plan.add.map((c) => c.discordUserId), ["1"]);
});
