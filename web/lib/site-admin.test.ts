import assert from "node:assert/strict";
import test from "node:test";
import { adminIds, isSiteAdmin } from "./site-admin";

test("only the listed Discord ids are admin", () => {
  assert.deepEqual(adminIds(" 123 , \"456\" ,"), ["123", "456"]);
  assert.equal(isSiteAdmin({ discordUserId: "123" }, "123,456"), true);
  assert.equal(isSiteAdmin({ discordUserId: "999" }, "123,456"), false);
});

test("with nothing set, or no Discord id, nobody is admin", () => {
  assert.equal(isSiteAdmin({ discordUserId: "123" }, ""), false);
  assert.equal(isSiteAdmin({ discordUserId: "123" }, undefined), false);
  assert.equal(isSiteAdmin({}, "123"), false);
});
