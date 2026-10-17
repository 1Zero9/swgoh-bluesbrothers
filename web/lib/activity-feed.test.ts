import assert from "node:assert/strict";
import test from "node:test";
import { agoLabel } from "./activity-feed";

test("times read like the in-game chat", () => {
  const now = Date.UTC(2026, 9, 17, 12, 0, 0);
  const ago = (ms: number) => agoLabel(new Date(now - ms), now);
  assert.equal(ago(30_000), "now");
  assert.equal(ago(5 * 60_000), "5m");
  assert.equal(ago(17 * 3_600_000), "17h");
  assert.equal(ago(3 * 86_400_000), "3d");
  assert.equal(agoLabel(new Date(now + 60_000), now), "now");
});
