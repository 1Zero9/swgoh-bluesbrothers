import assert from "node:assert/strict";
import test from "node:test";
import { hashSignInToken, looksLikeToken, newSignInToken } from "./signin-link";

test("tokens are long, URL-safe and unique, and only their hash is kept", () => {
  const a = newSignInToken();
  const b = newSignInToken();
  assert.notEqual(a, b);
  assert.equal(looksLikeToken(a), true);
  assert.notEqual(hashSignInToken(a), a);
  assert.equal(hashSignInToken(a), hashSignInToken(a));
  assert.equal(hashSignInToken(a).length, 64);
});

test("anything that is not a plausible token is rejected before the database", () => {
  assert.equal(looksLikeToken("short"), false);
  assert.equal(looksLikeToken("../../etc/passwd" + "a".repeat(30)), false);
  assert.equal(looksLikeToken(undefined), false);
});
