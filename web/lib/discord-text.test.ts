import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDiscordText } from "./discord-text";

const ctx = { users: new Map([["1", "Hesstan"]]), channels: new Map([["2", "general"]]) };

test("mentions, channels and emoji become readable text", () => {
  const out = parseDiscordText("hi <@1> and <@!1>, see <#2> <:wave:99> <@7>", ctx);
  assert.deepEqual(out.filter((s) => s.type === "mention").map((s) => s.text), ["@Hesstan", "@Hesstan", "#general", "@someone"]);
  assert.ok(out.some((s) => s.type === "text" && s.text.includes(":wave:")));
});

test("markdown links and bare links become links, sentence punctuation stays outside", () => {
  const out = parseDiscordText("Read [this story](https://example.test/a) or https://example.test/b.", ctx);
  const links = out.filter((s) => s.type === "link");
  assert.deepEqual(links.map((s) => (s as { url: string }).url), ["https://example.test/a", "https://example.test/b"]);
  assert.equal((out[out.length - 1] as { text: string }).text, ".");
});

test("bold and code are recognised, and HTML is never interpreted", () => {
  const out = parseDiscordText("**Win** against `Alpha` <script>alert(1)</script>", ctx);
  assert.deepEqual(out.map((s) => s.type), ["bold", "text", "code", "text"]);
  assert.ok((out[3] as { text: string }).text.includes("<script>"), "kept as plain text for React to escape");
});

test("javascript: links are not treated as links", () => {
  const out = parseDiscordText("[click](javascript:alert(1)) javascript:alert(2)", ctx);
  assert.equal(out.some((s) => s.type === "link"), false);
});
