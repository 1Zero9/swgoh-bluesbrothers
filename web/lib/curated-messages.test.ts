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

import { slotsOpenPost, weeklyPublicPost, type WeeklyPublicStats } from "./curated-messages";

const stats: WeeklyPublicStats = {
  members: 50,
  capacity: 50,
  week: { galacticLegends: 4, ultimates: 1, relicLevels: 61, newRelicNine: 3 },
  totals: { galacticLegends: 118, relicNine: 143, relicSevenPlus: 1204 },
  lastWar: { won: true, score: 15450, opponentScore: 15176 },
  requirements: { minGalacticPower: 10_000_000, minGalacticLegends: 5 },
  siteUrl: "https://example.test",
};

test("the weekly public post is numbers only and shows a full guild as x/50", () => {
  const post = weeklyPublicPost(stats);
  assert.match(post.description, /50\/50\. Full house\. Stay tuned for open slots/);
  assert.match(post.description, /4 new Galactic Legends/);
  assert.match(post.description, /3 new Relic 9 units/);
  assert.match(post.description, /118 Galactic Legends/);
  assert.match(post.description, /victory last time out, 15,450–15,176/);
  assert.match(post.description, /10M GP and 5\+ Galactic Legends/);
});

test("open seats and quiet weeks are worded correctly", () => {
  const open = weeklyPublicPost({ ...stats, members: 49, week: { galacticLegends: 0, ultimates: 0, relicLevels: 0, newRelicNine: 0 }, lastWar: null });
  assert.match(open.description, /49\/50\. 1 seat open on the stage/);
  assert.match(open.description, /quiet one on the roster/);
  assert.doesNotMatch(open.description, /Territory War/);
});

test("the vacancy post speaks Blues Brothers and states the bar", () => {
  const post = slotsOpenPost({ spaces: 1, requirements: stats.requirements, siteUrl: "https://example.test" });
  assert.equal(post.title, "We're putting the band back together");
  assert.match(post.description, /A seat has just opened/);
  assert.match(post.description, /mission from the Force/);
  assert.match(slotsOpenPost({ spaces: 3, requirements: stats.requirements, siteUrl: "x" }).description, /3 seats have/);
});

import { promptPost } from "./curated-messages";

test("the weekly prompt is the question plus a light nudge", () => {
  const post = promptPost({ text: "Jake or Elwood: who is your main, and why?" });
  assert.equal(post.title, "Question of the week");
  assert.match(post.description, /Jake or Elwood/);
  assert.match(post.description, /Answer in here/);
});

import { anniversaryPost, milestonePost } from "./curated-messages";

test("milestone posts celebrate the member and use a mention when given", () => {
  assert.match(milestonePost({ name: "Hesstan", kind: "FIRST_R9", unitName: "General Kenobi" }).description, /\*\*Hesstan\*\* just took General Kenobi to \*\*Relic 9\*\*/);
  assert.match(milestonePost({ name: "Hesstan", mention: "<@1>", kind: "GL_5" }).description, /<@1> has unlocked their \*\*5th Galactic Legend/);
  assert.equal(milestonePost({ name: "x", kind: "GL_10" }).title, "Ten Galactic Legends");
});

test("anniversaries count years", () => {
  assert.equal(anniversaryPost({ name: "Bro", years: 1 }).title, "One year with the band");
  assert.match(anniversaryPost({ name: "Bro", years: 5 }).description, /5 years ago today/);
});
