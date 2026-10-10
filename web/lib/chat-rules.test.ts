import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanMessage, MAX_MESSAGE_LENGTH, postingAllowed, resetPostingLimits, webhookDisplayName } from "./chat-rules";
import { enabledChatChannels } from "./chat-config";

test("only listed channels can be switched on, general by default", () => {
  assert.deepEqual(enabledChatChannels(undefined).map((c) => c.key), ["general"]);
  assert.deepEqual(enabledChatChannels("general, tw").map((c) => c.key), ["general", "tw"]);
  assert.deepEqual(enabledChatChannels("officers,general").map((c) => c.key), ["general"]); // unknown names are ignored
});

test("messages are trimmed, limited and empty ones rejected", () => {
  assert.equal(cleanMessage("  hello \n\n\n\n there "), "hello \n\n there");
  assert.equal(cleanMessage("   "), null);
  assert.equal(cleanMessage(42), null);
  assert.equal(cleanMessage("x".repeat(5000))?.length, MAX_MESSAGE_LENGTH);
});

test("names Discord would refuse are tidied", () => {
  assert.equal(webhookDisplayName("Clyde the Great"), "• the Great");
  assert.equal(webhookDisplayName("Hesstan"), "Hesstan");
  assert.equal(webhookDisplayName("@everyone"), "everyone");
  assert.equal(webhookDisplayName(""), "Guild member");
});

test("posting is limited to one every two seconds and 15 a minute", () => {
  resetPostingLimits();
  const t = 1_000_000;
  assert.equal(postingAllowed("a", t), true);
  assert.equal(postingAllowed("a", t + 500), false);
  assert.equal(postingAllowed("a", t + 2500), true);
  assert.equal(postingAllowed("b", t + 2500), true); // other members are unaffected
  for (let i = 0; i < 15; i += 1) assert.equal(postingAllowed("c", t + i * 2100), true);
  assert.equal(postingAllowed("c", t + 15 * 2100), false); // the 16th within a minute
});
