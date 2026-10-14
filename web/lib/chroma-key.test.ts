import assert from "node:assert/strict";
import { test } from "node:test";
import { keyGreen } from "./chroma-key";

const px = (r: number, g: number, b: number) => new Uint8ClampedArray([r, g, b, 255]);

test("studio green goes fully transparent", () => {
  const data = px(40, 180, 50);
  keyGreen(data);
  assert.equal(data[3], 0);
});

test("blue, cyan, grey and black stay opaque and untouched", () => {
  for (const colour of [[30, 110, 255], [60, 200, 230], [120, 120, 120], [10, 10, 10]]) {
    const data = px(colour[0], colour[1], colour[2]);
    keyGreen(data);
    assert.deepEqual([...data], [colour[0], colour[1], colour[2], 255]);
  }
});

test("a greenish edge fades out and loses its green tint", () => {
  const data = px(60, 120, 60); // greenness 60: mostly keyed
  keyGreen(data);
  assert.ok(data[3] > 0 && data[3] < 255);
  assert.equal(data[1], 60);
});
