import assert from "node:assert/strict";
import test from "node:test";
import { BODY_MAX, TITLE_MAX, TITLE_MIN, BODY_MIN } from "./notes";
import { STARTER_ENTRIES, starterNotes } from "./starter-list";

test("the starter list has 50 squads, each with a lineup and counters", () => {
  assert.equal(STARTER_ENTRIES.length, 50);
  for (const entry of STARTER_ENTRIES) assert.ok(entry.defence && entry.lineup && entry.counters, entry.defence);
});

test("every tip fits the note limits and titles are unique, so the import can be repeated safely", () => {
  const notes = starterNotes();
  const titles = new Set(notes.map((n) => n.title));
  assert.equal(titles.size, notes.length);
  for (const note of notes) {
    assert.ok(note.title.length >= TITLE_MIN && note.title.length <= TITLE_MAX, note.title);
    assert.ok(note.body.length >= BODY_MIN && note.body.length <= BODY_MAX, note.title);
  }
});
