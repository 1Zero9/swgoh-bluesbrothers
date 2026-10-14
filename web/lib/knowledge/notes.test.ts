import assert from "node:assert/strict";
import test from "node:test";
import { noteMatches, validateNote } from "./notes";

const good = { kind: "TIP", title: "Use tickets at reset", body: "Spend raid tickets right after reset so you never lose any.", topic: "Raids", howKnown: "I do this every week" };

test("a good tip is accepted and tidied", () => {
  const result = validateNote({ ...good, title: "  Use   tickets at reset " });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.title, "Use tickets at reset");
    assert.equal(result.value.kind, "TIP");
    assert.equal(result.value.topic, "Raids");
  }
});

test("kind, title and body are required", () => {
  assert.equal(validateNote({ ...good, kind: "RANT" }).ok, false);
  assert.equal(validateNote({ ...good, title: "Hi" }).ok, false);
  assert.equal(validateNote({ ...good, body: "short" }).ok, false);
  assert.equal(validateNote(null).ok, false);
});

test("a topic outside the list is dropped, not trusted", () => {
  const result = validateNote({ ...good, topic: "<script>" });
  assert.equal(result.ok && result.value.topic, null);
});

test("control characters are removed and long text is capped", () => {
  const result = validateNote({ ...good, body: `ok ok ok\u0000\u0007 ${"x".repeat(5000)}` });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.body.includes("\u0000"), false);
    assert.ok(result.value.body.length <= 1500);
  }
});

test("optional how-known may be empty", () => {
  const result = validateNote({ ...good, howKnown: "   " });
  assert.equal(result.ok && result.value.howKnown, null);
});

test("search needs every word to match somewhere", () => {
  const note = { title: "Use tickets at reset", body: "Spend raid tickets right after reset.", topic: "Raids" };
  assert.equal(noteMatches(note, "raid reset"), true);
  assert.equal(noteMatches(note, "raid conquest"), false);
  assert.equal(noteMatches(note, ""), true);
});
