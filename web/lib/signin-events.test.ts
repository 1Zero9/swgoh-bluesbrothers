import assert from "node:assert/strict";
import test from "node:test";
import { clientFrom, summariseSignIns } from "./signin-events";

const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPHONE_DISCORD = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Discord/200";

test("browser and device are told apart, and in-app browsers are spotted", () => {
  assert.deepEqual(clientFrom(IPAD), { device: "tablet", browser: "Safari", inApp: false });
  assert.equal(clientFrom(IPHONE_DISCORD).inApp, true);
  assert.equal(clientFrom("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120 Safari/537.36").browser, "Chrome");
  assert.equal(clientFrom(null).browser, "Other");
});

test("the summary counts attempts, finishes, stalls and splits by kind of device", () => {
  const rows = [
    { kind: "start", device: "tablet", browser: "Safari", inApp: false },
    { kind: "stall", device: "tablet", browser: "Safari", inApp: false },
    { kind: "start", device: "tablet", browser: "Safari", inApp: false },
    { kind: "success", device: "tablet", browser: "Safari", inApp: false },
    { kind: "start", device: "mobile", browser: "Safari", inApp: true },
    { kind: "help", device: "mobile", browser: "Safari", inApp: true },
  ];
  const summary = summariseSignIns(rows);
  assert.equal(summary.started, 3);
  assert.equal(summary.finished, 1);
  assert.equal(summary.stalled, 1);
  assert.equal(summary.helpAsked, 1);
  assert.equal(summary.segments[0].label, "Safari · tablet");
  assert.equal(summary.segments[0].rate, 0.5);
  assert.equal(summariseSignIns([]).rate, null);
});
