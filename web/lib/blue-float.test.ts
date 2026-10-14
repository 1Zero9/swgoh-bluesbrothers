import assert from "node:assert/strict";
import test from "node:test";
import { EDGE, FLOAT_SIZE, fromPixels, isTap, parsePos, toPixels } from "./blue-float";

test("a stored position round-trips through pixels", () => {
  const pos = fromPixels(500, 300, 1400, 900);
  const back = toPixels(pos, 1400, 900);
  assert.ok(Math.abs(back.x - 500) < 1 && Math.abs(back.y - 300) < 1);
});

test("the icon always stays fully on screen", () => {
  const far = toPixels({ fx: 1, fy: 1 }, 400, 700);
  assert.equal(far.x, 400 - FLOAT_SIZE - EDGE);
  assert.equal(far.y, 700 - FLOAT_SIZE - EDGE);
  const near = toPixels({ fx: 0, fy: 0 }, 400, 700);
  assert.deepEqual(near, { x: EDGE, y: EDGE });
  const clamped = fromPixels(-50, 9999, 400, 700);
  assert.deepEqual(clamped, { fx: 0, fy: 1 });
});

test("the same share lands in the same relative spot on a smaller window", () => {
  const pos = { fx: 0.5, fy: 0.5 };
  const big = toPixels(pos, 1600, 1000);
  const small = toPixels(pos, 800, 500);
  assert.ok(small.x < big.x && small.y < big.y);
});

test("bad saved data is ignored", () => {
  assert.equal(parsePos("nope"), null);
  assert.equal(parsePos('{"fx":"a"}'), null);
  assert.deepEqual(parsePos('{"fx":2,"fy":-1}'), { fx: 1, fy: 0 });
});

test("a tiny movement is a tap", () => {
  assert.equal(isTap(2, 3), true);
  assert.equal(isTap(20, 0), false);
});
