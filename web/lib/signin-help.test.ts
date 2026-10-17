import assert from "node:assert/strict";
import test from "node:test";
import { validateHelp } from "./signin-help";

test("a name is needed and the rest is tidied", () => {
  assert.equal(validateHelp({ name: "x" }).ok, false);
  const ok = validateHelp({ name: "  Dougie  ", contact: "dougie\n#1234", problem: "white", note: "  iPad " });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.value, { name: "Dougie", contact: "dougie #1234", problem: "white", note: "iPad" });
});

test("bots filling the hidden field are refused and odd problems become other", () => {
  assert.equal(validateHelp({ name: "Real Name", website: "http://spam" }).ok, false);
  const r = validateHelp({ name: "Real Name", problem: "<script>" });
  assert.equal(r.ok && r.value.problem, "other");
});
