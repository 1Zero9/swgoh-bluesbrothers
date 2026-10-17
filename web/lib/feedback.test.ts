import assert from "node:assert/strict";
import test from "node:test";
import { sortItems, validateFeedback, validateUpdate } from "./feedback";

test("a post needs a title and some detail", () => {
  assert.equal(validateFeedback({ kind: "FEATURE", title: "Hi", body: "long enough body" }).ok, false);
  assert.equal(validateFeedback({ kind: "FEATURE", title: "Dark mode", body: "short" }).ok, false);
  const ok = validateFeedback({ kind: "BUG", title: "  Raid page   broken ", body: "It shows nothing\n\n\n\nafter I log in" });
  assert.ok(ok.ok);
  if (ok.ok) { assert.equal(ok.value.title, "Raid page broken"); assert.equal(ok.value.body, "It shows nothing\n\nafter I log in"); }
});

test("an unknown kind becomes a feature request", () => {
  const r = validateFeedback({ kind: "nope", title: "Add a thing", body: "I would like a thing please" });
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.value.kind, "FEATURE");
});

test("officer edits: status and note", () => {
  assert.deepEqual(validateUpdate({ status: "DONE" }), { ok: true, value: { status: "DONE" } });
  assert.deepEqual(validateUpdate({ reply: "  Shipped in 1.3  " }), { ok: true, value: { reply: "Shipped in 1.3" } });
  assert.deepEqual(validateUpdate({ reply: "" }), { ok: true, value: { reply: null } });
  assert.equal(validateUpdate({ status: "WAT" }).ok, false);
  assert.equal(validateUpdate({}).ok, false);
});

test("to do comes before done, busiest first", () => {
  const items = [
    { id: "a", status: "DONE", votes: 9, createdAt: "2026-10-01" },
    { id: "b", status: "OPEN", votes: 1, createdAt: "2026-10-02" },
    { id: "c", status: "OPEN", votes: 4, createdAt: "2026-10-03" },
    { id: "d", status: "IN_PROGRESS", votes: 0, createdAt: "2026-10-04" },
    { id: "e", status: "DECLINED", votes: 7, createdAt: "2026-10-05" },
  ];
  assert.deepEqual(sortItems(items).map((i) => i.id), ["d", "c", "b", "a", "e"]);
});
