import assert from "node:assert/strict";
import test from "node:test";
import { parsePins, pinnedLinks, togglePin } from "./nav-pins";

test("saved pins are read safely", () => {
  assert.deepEqual(parsePins('["/raids","/raids","/wins","x",3]'), ["/raids", "/wins"]);
  assert.deepEqual(parsePins("{bad"), []);
  assert.deepEqual(parsePins(""), []);
});

test("toggling pins and unpins, new ones at the end", () => {
  assert.deepEqual(togglePin(["/raids"], "/wins"), ["/raids", "/wins"]);
  assert.deepEqual(togglePin(["/raids", "/wins"], "/raids"), ["/wins"]);
});

test("pinned links keep pin order and drop ones that no longer exist", () => {
  const available = [{ href: "/wins", label: "Wins" }, { href: "/raids", label: "Raids" }];
  assert.deepEqual(pinnedLinks(["/raids", "/gone", "/wins"], available).map((l) => l.label), ["Raids", "Wins"]);
});
