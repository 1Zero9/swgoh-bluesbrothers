import assert from "node:assert/strict";
import test from "node:test";
import { adminEnvProblems, adminIds, isSiteAdmin } from "./site-admin";

test("only the listed Discord ids are admin", () => {
  assert.deepEqual(adminIds(" 123456789012345678 , \"456456456456456456\" ,"), ["123456789012345678", "456456456456456456"]);
  assert.equal(isSiteAdmin({ discordUserId: "123456789012345678" }, "123456789012345678,456456456456456456"), true);
  assert.equal(isSiteAdmin({ discordUserId: "999999999999999999" }, "123456789012345678"), false);
});

test("with nothing set, or no Discord id, nobody is admin", () => {
  assert.equal(isSiteAdmin({ discordUserId: "123456789012345678" }, ""), false);
  assert.equal(isSiteAdmin({ discordUserId: "123456789012345678" }, undefined), false);
  assert.equal(isSiteAdmin({}, "123456789012345678"), false);
});

test("an extra Discord account linked to the member also counts", () => {
  assert.equal(isSiteAdmin({ discordUserId: "999999999999999999", discordUserIds: ["999999999999999999", "123456789012345678"] }, "123456789012345678"), true);
  assert.equal(isSiteAdmin({ discordUserIds: ["555555555555555555"] }, "123456789012345678"), false);
});

test("a username in the setting is not mistaken for an id, and is reported", () => {
  assert.deepEqual(adminIds("dex7707"), []);
  assert.deepEqual(adminEnvProblems("dex7707, 123456789012345678"), ["dex7707"]);
  assert.equal(isSiteAdmin({ discordUserId: "7707" }, "dex7707"), false);
});
