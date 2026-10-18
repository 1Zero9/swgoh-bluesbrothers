import assert from "node:assert/strict";
import test from "node:test";
import { GRACE_MS, whenDatabaseDown } from "./access-fallback";

const known = { access: { role: "MEMBER" as const, isAuthorized: true, isOfficer: false, isMember: true, playerId: "p1", playerName: "Dex", discordUserId: "123", membershipState: "ACTIVE" as const }, at: 1_000_000 };

test("a member with a valid cookie is not signed out when the database is down", () => {
  const access = whenDatabaseDown("p1", false, undefined, 2_000_000);
  assert.equal(access.isMember, true);
  assert.equal(access.playerId, "p1");
  assert.equal(access.playerName, undefined);
});

test("a recent successful lookup is reused, including name and Discord id", () => {
  const access = whenDatabaseDown("p1", true, known, 1_000_000 + 60_000);
  assert.equal(access.playerName, "Dex");
  assert.equal(access.discordUserId, "123");
  assert.equal(access.isOfficer, true);
  assert.equal(access.role, "OFFICER");
});

test("an old or someone else's remembered lookup is not reused", () => {
  assert.equal(whenDatabaseDown("p1", false, known, 1_000_000 + GRACE_MS + 1).playerName, undefined);
  assert.equal(whenDatabaseDown("p2", false, known, 1_000_100).playerName, undefined);
});
