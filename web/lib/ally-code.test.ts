import assert from "node:assert/strict";
import test from "node:test";
import { formatAllyCode, isCompleteAllyCode } from "./ally-code";
import { linkProblem } from "./link-help";

test("an ally code is formatted as it is typed", () => {
  assert.equal(formatAllyCode("1"), "1");
  assert.equal(formatAllyCode("1234"), "123-4");
  assert.equal(formatAllyCode("123456789"), "123-456-789");
  assert.equal(formatAllyCode("123 456 789 0000"), "123-456-789");
  assert.equal(formatAllyCode("abc"), "");
});

test("only nine digits count as complete", () => {
  assert.equal(isCompleteAllyCode("123-456-789"), true);
  assert.equal(isCompleteAllyCode("123-456-78"), false);
});

test("each failure points to one next step", () => {
  assert.equal(linkProblem(401, null).next, "sign-in-again");
  assert.equal(linkProblem(404, "We couldn't find that ally code.").next, "retry");
  assert.equal(linkProblem(403, "x").next, "ask-officer");
  assert.equal(linkProblem(409, "x").next, "ask-officer");
  assert.equal(linkProblem(500, null).message, "That didn't work.");
});
