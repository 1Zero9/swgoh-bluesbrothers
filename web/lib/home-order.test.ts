import assert from "node:assert/strict";
import test from "node:test";
import { arrangeById } from "./home-order";

const items = [{ id: "ask" }, { id: "war" }, { id: "act" }, { id: "wins" }];
const ids = (list: { id: string }[]) => list.map((item) => item.id);

test("no saved order keeps the default", () => {
  assert.deepEqual(ids(arrangeById(items, "")), ["ask", "war", "act", "wins"]);
});

test("a saved order wins, and new boxes go at the end", () => {
  assert.deepEqual(ids(arrangeById(items, JSON.stringify(["wins", "ask"]))), ["wins", "ask", "war", "act"]);
});

test("unknown, repeated or broken saved data is ignored", () => {
  assert.deepEqual(ids(arrangeById(items, JSON.stringify(["gone", "war", "war"]))), ["war", "ask", "act", "wins"]);
  assert.deepEqual(ids(arrangeById(items, "{not json")), ["ask", "war", "act", "wins"]);
  assert.deepEqual(ids(arrangeById(items, JSON.stringify({ a: 1 }))), ["ask", "war", "act", "wins"]);
});
