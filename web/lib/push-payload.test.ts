import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPayload, chatPushAllowed, cleanTopics, resetChatPushThrottle, truncate, validSubscription } from "./push-payload";

test("notification text is plain, short and free of markup", () => {
  assert.equal(truncate("**Win** against [Disfunktionalz](https://x.test) <@123> <:wave:9>"), "Win against Disfunktionalz :wave:");
  assert.equal(truncate("a".repeat(300), 20).length, 20);
  const payload = buildPayload({ title: "Territory War: victory", body: "15,450 – 15,176", url: "/chat" });
  assert.equal(payload.url, "/chat");
  assert.equal(buildPayload({ title: "x", body: "y", url: "https://evil.test" }).url, "/"); // only on-site links
});

test("only well-formed https subscriptions are accepted", () => {
  const good = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "p", auth: "a" } };
  assert.deepEqual(validSubscription(good), { endpoint: good.endpoint, p256dh: "p", auth: "a" });
  assert.equal(validSubscription({ ...good, endpoint: "http://insecure.test/x" }), null);
  assert.equal(validSubscription({ endpoint: "https://x.test", keys: {} }), null);
  assert.equal(validSubscription(null), null);
});

test("topics are limited to the known ones", () => {
  assert.deepEqual(cleanTopics(["chat", "nonsense", "droid"]), ["chat", "droid"]);
  assert.deepEqual(cleanTopics("chat"), []);
});

test("chat notifications are throttled per channel", () => {
  resetChatPushThrottle();
  assert.equal(chatPushAllowed("general", 1000), true);
  assert.equal(chatPushAllowed("general", 20_000), false);
  assert.equal(chatPushAllowed("tw", 20_000), true);
  assert.equal(chatPushAllowed("general", 40_000), true);
});
