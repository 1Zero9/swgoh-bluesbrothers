import assert from "node:assert/strict";
import { test } from "node:test";
import { isSwitchOn } from "./ask";

test("on, however it was typed or pasted", () => {
  for (const value of ["on", "ON", "On", " on ", "on\n", "\"on\"", "'on'", "on\u00a0", "\ufeffon", "true", "yes", "1"]) assert.equal(isSwitchOn(value), true, JSON.stringify(value));
});

test("anything else is off", () => {
  for (const value of [undefined, "", "off", "no", "0", "false", "onn", "of"]) assert.equal(isSwitchOn(value), false, String(value));
});
