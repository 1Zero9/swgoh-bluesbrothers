import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { discordPublicKey, verifyDiscordSignature } from "./discord-signature";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicHex = publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
const body = JSON.stringify({ type: 1 });
const timestamp = "1760000000";
const signature = sign(null, Buffer.from(timestamp + body), privateKey).toString("hex");

test("a genuine signature is accepted", () => {
  assert.equal(verifyDiscordSignature(publicHex, signature, timestamp, body), true);
});

test("a changed body, timestamp, signature or key is rejected", () => {
  assert.equal(verifyDiscordSignature(publicHex, signature, timestamp, body + " "), false);
  assert.equal(verifyDiscordSignature(publicHex, signature, "1760000001", body), false);
  assert.equal(verifyDiscordSignature(publicHex, signature.replace(/^./, (c) => (c === "a" ? "b" : "a")), timestamp, body), false);
  const other = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  assert.equal(verifyDiscordSignature(other, signature, timestamp, body), false);
  assert.equal(verifyDiscordSignature("not hex", signature, timestamp, body), false);
  assert.equal(verifyDiscordSignature("", "", "", ""), false);
});

test("the public key is found under either variable name and trimmed", () => {
  assert.equal(discordPublicKey({ DISCORD_APP_PUBLIC_KEY: "abc" }), "abc");
  assert.equal(discordPublicKey({ DISCORD_PUBLIC_KEY: "  def\n" }), "def");
  assert.equal(discordPublicKey({ DISCORD_APP_PUBLIC_KEY: "first", DISCORD_PUBLIC_KEY: "second" }), "first");
  assert.equal(discordPublicKey({}), undefined);
  assert.equal(discordPublicKey({ DISCORD_PUBLIC_KEY: "   " }), undefined);
});
