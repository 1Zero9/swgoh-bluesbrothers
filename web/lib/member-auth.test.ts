import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "./member-auth";

test("only same-site page paths are accepted after sign-in", () => {
  assert.equal(safeNextPath("/wins"), "/wins");
  assert.equal(safeNextPath("/territory-battles#callouts"), "/territory-battles#callouts");
  assert.equal(safeNextPath(null), "/");
  assert.equal(safeNextPath("https://evil.example"), "/");
  assert.equal(safeNextPath("//evil.example"), "/");
  assert.equal(safeNextPath("/\\evil.example"), "/");
  assert.equal(safeNextPath("/api/officer/session"), "/");
  assert.equal(safeNextPath("/ok\r\nSet-Cookie: x=1"), "/");
});

import { createMemberCookieValue, memberSessionDiscordId, verifyMemberCookieValue } from "./member-auth";

test("a member session remembers which Discord account signed in, and a link session has none", () => {
  process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || "test-secret-test-secret-test-secret";
  const discord = createMemberCookieValue("player1", "123456789012345678");
  assert.equal(verifyMemberCookieValue(discord.value), "player1");
  assert.equal(memberSessionDiscordId(discord.value), "123456789012345678");
  const link = createMemberCookieValue("player1");
  assert.equal(verifyMemberCookieValue(link.value), "player1");
  assert.equal(memberSessionDiscordId(link.value), undefined);
  assert.equal(memberSessionDiscordId(discord.value.slice(0, -2) + "xx"), undefined);
});
