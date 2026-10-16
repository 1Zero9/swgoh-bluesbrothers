import assert from "node:assert/strict";
import test from "node:test";
import { compactLayout, layoutRows, parseLayout, resolveLayout, rowsFor } from "./home-layout";

const boxes = [
  { id: "ask", w: 6, rows: 4 },
  { id: "war", w: 6, rows: 6 },
  { id: "act", w: 6, rows: 20 },
];

test("with nothing saved the boxes stack down the left half", () => {
  assert.deepEqual(resolveLayout(boxes, {}), { ask: { c: 0, r: 0 }, war: { c: 0, r: 4 }, act: { c: 0, r: 10 } });
});

test("a box moved to the right half stays put and others do not move", () => {
  const out = resolveLayout(boxes, { ask: { c: 6, r: 2 } }, "ask");
  assert.deepEqual(out.ask, { c: 6, r: 2 });
  assert.deepEqual(out.war, { c: 0, r: 0 });
  assert.deepEqual(out.act, { c: 0, r: 6 });
});

test("a box dropped on another pushes the other one down", () => {
  const out = resolveLayout(boxes, { ask: { c: 0, r: 0 }, war: { c: 0, r: 4 }, act: { c: 0, r: 10 } }, "war");
  assert.deepEqual(out.war, { c: 0, r: 4 });
  const moved = resolveLayout(boxes, { ask: { c: 0, r: 0 }, war: { c: 0, r: 0 }, act: { c: 0, r: 10 } }, "war");
  assert.deepEqual(moved.war, { c: 0, r: 0 });
  assert.deepEqual(moved.ask, { c: 0, r: 6 });
});

test("columns are kept inside the grid", () => {
  const out = resolveLayout(boxes, { ask: { c: 11, r: 0 } }, "ask");
  assert.equal(out.ask.c, 6);
});

test("saved data is checked", () => {
  assert.deepEqual(parseLayout('{"ask":{"c":2,"r":3},"war":{"c":-1,"r":0},"x":5}'), { ask: { c: 2, r: 3 } });
  assert.deepEqual(parseLayout("{bad"), {});
  assert.deepEqual(parseLayout("[1]"), {});
});

test("row counts and total height", () => {
  assert.equal(rowsFor(100), 5);
  assert.equal(layoutRows(boxes, resolveLayout(boxes, {})), 30);
});

test("sizes are kept when valid and dropped when not", () => {
  assert.deepEqual(parseLayout('{"a":{"c":0,"r":2,"w":8,"h":12},"b":{"c":1,"r":1,"w":1,"h":2},"c":{"c":0,"r":0,"w":99}}'), { a: { c: 0, r: 2, w: 8, h: 12 }, b: { c: 1, r: 1 }, c: { c: 0, r: 0 } });
});

test("tidy up slides boxes up and keeps columns and sizes", () => {
  const list = [{ id: "a", w: 6, rows: 4 }, { id: "b", w: 6, rows: 4 }, { id: "c", w: 6, rows: 4 }];
  const out = compactLayout(list, { a: { c: 0, r: 10, w: 6 }, b: { c: 6, r: 30 }, c: { c: 0, r: 20 } });
  assert.deepEqual(out, { a: { c: 0, r: 0, w: 6 }, b: { c: 6, r: 0 }, c: { c: 0, r: 4 } });
});
