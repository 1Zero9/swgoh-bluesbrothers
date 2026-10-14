import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBlueText, parseInline } from "./format";

test("bold and italic are picked out, the rest stays plain", () => {
  assert.deepEqual(parseInline("Use **Veers** and *Piett* now"), [
    { kind: "text", text: "Use " }, { kind: "bold", text: "Veers" }, { kind: "text", text: " and " }, { kind: "italic", text: "Piett" }, { kind: "text", text: " now" },
  ]);
  assert.deepEqual(parseInline("2 * 3 = 6"), [{ kind: "text", text: "2 * 3 = 6" }]);
});

test("bullets and numbered lines become lists, kept together", () => {
  const blocks = parseBlueText("Intro line\n\n1. **First**\n   * why\n   * roster\n2. Second\n\nDone");
  assert.equal(blocks[0].kind, "paragraph");
  assert.equal(blocks[1].kind, "numbers");
  assert.equal(blocks[2].kind, "bullets");
  assert.equal((blocks[2] as { items: unknown[] }).items.length, 2);
  assert.equal(blocks[3].kind, "numbers");
  assert.equal((blocks[3] as { start: number }).start, 2); // carries on at 2, not back to 1
  assert.equal(blocks[4].kind, "paragraph");
});

test("markup in the text is never treated as HTML", () => {
  const blocks = parseBlueText("<script>alert(1)</script> **ok**");
  assert.equal(blocks.length, 1);
  assert.equal((blocks[0] as { inline: { text: string }[] }).inline[0].text, "<script>alert(1)</script> ");
});
