import { test } from "node:test";
import assert from "node:assert/strict";
import { farewellPost, formatTenure, twResultPost, welcomePost } from "./curated-messages";

test("a close win reads as a win and names the scores", () => {
  const post = twResultPost({ opponent: "Disfunktionalz", score: 15450, opponentScore: 15176 }, "tw01D");
  assert.equal(post.title, "Territory War: victory");
  assert.match(post.description, /15,450 – 15,176/);
  assert.match(post.description, /Disfunktionalz/);
});

test("a loss is honest and asks for feedback", () => {
  const post = twResultPost({ opponent: "Aggressive negotiations", score: 17501, opponentScore: 25563 }, "tw01B");
  assert.equal(post.title, "Territory War: result");
  assert.match(post.description, /What would you change/);
});

test("tenure reads naturally", () => {
  assert.equal(formatTenure(1), "a day");
  assert.equal(formatTenure(20), "3 weeks");
  assert.equal(formatTenure(120), "4 months");
  assert.equal(formatTenure(800), "2.2 years");
});

test("welcome and farewell carry the name", () => {
  assert.match(welcomePost({ name: "Yyyyy", galacticPower: 12_400_000 }).description, /Yyyyy.*12\.4M GP/);
  assert.match(farewellPost({ name: "Xxxx", tenureDays: 800 }).description, /Xxxx.*2\.2 years/);
});
