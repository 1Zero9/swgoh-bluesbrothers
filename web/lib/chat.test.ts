import { test } from "node:test";
import assert from "node:assert/strict";
import { shapeMessage } from "./chat";

const dir = {
  names: new Map([["500", "general"]]),
  members: new Map([["1", { name: "Hesstan (nick)", avatar: "https://cdn.discordapp.com/avatars/1/a.png?size=64" }]]),
};

const base = { type: 0, timestamp: "2026-10-11T10:00:00.000Z", edited_timestamp: null };

test("a member's message uses their server nickname, avatar and resolved mentions", () => {
  const message = shapeMessage(
    { ...base, id: "9", content: "hello <@2> in <#500>", author: { id: "1", username: "hess", global_name: "Hess" }, mentions: [{ id: "2", username: "bro", global_name: "Bro" }] },
    dir,
  );
  assert.equal(message.author.name, "Hesstan (nick)");
  assert.equal(message.author.app, false);
  assert.equal(message.author.avatarUrl, "https://cdn.discordapp.com/avatars/1/a.png?size=64");
  assert.deepEqual(message.segments.filter((s) => s.type === "mention").map((s) => s.text), ["@Bro", "#general"]);
});

test("bot and webhook posts keep their own name and are marked as app posts, with embeds readable", () => {
  const message = shapeMessage(
    { ...base, id: "10", content: "", webhook_id: "77", author: { id: "77", username: "Blues Brothers Droid", bot: true, avatar: "abc" },
      embeds: [{ title: "Question of the week", description: "Best squad? [guide](https://example.test/g)", color: 0x3c83ff }] },
    dir,
  );
  assert.equal(message.author.name, "Blues Brothers Droid");
  assert.equal(message.author.app, true);
  assert.equal(message.embeds[0].title, "Question of the week");
  assert.equal(message.embeds[0].color, "#3c83ff");
  assert.ok(message.embeds[0].segments.some((s) => s.type === "link"));
});

test("only Discord's own image hosts are shown as attachments", () => {
  const message = shapeMessage(
    { ...base, id: "11", content: "pics", author: { id: "1", username: "hess" },
      attachments: [
        { url: "https://cdn.discordapp.com/attachments/1/2/a.png", filename: "a.png", content_type: "image/png" },
        { url: "https://evil.example/a.png", filename: "b.png", content_type: "image/png" },
        { url: "http://cdn.discordapp.com/attachments/1/2/c.png", filename: "c.png", content_type: "image/png" },
      ] },
    dir,
  );
  assert.deepEqual(message.attachments.map((a) => a.name), ["a.png"]);
});
