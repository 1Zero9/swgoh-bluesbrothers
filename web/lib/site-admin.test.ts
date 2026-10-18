import assert from "node:assert/strict";
import test from "node:test";
import { adminEnvProblems, adminIds, includesAdminAccount, isSiteAdmin } from "./site-admin";

const ADMIN = "123456789012345678";
const OTHER = "999999999999999999";

test("only the listed Discord ids are admin, and only when that account signed in", () => {
  assert.deepEqual(adminIds(` ${ADMIN} , "${OTHER}" ,`), [ADMIN, OTHER]);
  assert.equal(isSiteAdmin({ sessionDiscordUserId: ADMIN }, ADMIN), true);
  assert.equal(isSiteAdmin({ sessionDiscordUserId: OTHER }, ADMIN), false);
});

test("with nothing set, or a session without a Discord account, nobody is admin", () => {
  assert.equal(isSiteAdmin({ sessionDiscordUserId: ADMIN }, ""), false);
  assert.equal(isSiteAdmin({ sessionDiscordUserId: ADMIN }, undefined), false);
  assert.equal(isSiteAdmin({}, ADMIN), false);
});

test("a username in the setting is not mistaken for an id, and is reported", () => {
  assert.deepEqual(adminIds("dex7707"), []);
  assert.deepEqual(adminEnvProblems(`dex7707, ${ADMIN}`), ["dex7707"]);
  assert.equal(isSiteAdmin({ sessionDiscordUserId: "7707" }, "dex7707"), false);
});

test("a player with the admin's Discord account attached is recognised, so no sign-in link can be made for them", () => {
  assert.equal(includesAdminAccount([null, ADMIN], ADMIN), true);
  assert.equal(includesAdminAccount([OTHER], ADMIN), false);
  assert.equal(includesAdminAccount([ADMIN], ""), false);
});
