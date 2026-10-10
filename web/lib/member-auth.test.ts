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
