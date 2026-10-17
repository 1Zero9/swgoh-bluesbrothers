import assert from "node:assert/strict";
import test from "node:test";
import { agoLabel, isOnSite, parseActivity, SITE_ONLINE_MS } from "./presence";

test("a member is on the site while the last heartbeat is recent", () => {
  const now = 1_000_000_000_000;
  assert.equal(isOnSite(now - 60_000, now), true);
  assert.equal(isOnSite(now - SITE_ONLINE_MS - 1, now), false);
});

test("game activity is read from milliseconds or seconds, text or number", () => {
  assert.equal(parseActivity("1760000000000")?.getTime(), 1_760_000_000_000);
  assert.equal(parseActivity(1_760_000_000)?.getTime(), 1_760_000_000_000);
  assert.equal(parseActivity("soon"), null);
  assert.equal(parseActivity(undefined), null);
  assert.equal(parseActivity("0"), null);
});

test("ago labels are plain", () => {
  const now = 1_000_000_000_000;
  assert.equal(agoLabel(now - 30_000, now), "just now");
  assert.equal(agoLabel(now - 10 * 60_000, now), "10 min ago");
  assert.equal(agoLabel(now - 2 * 3_600_000, now), "2 h ago");
});
