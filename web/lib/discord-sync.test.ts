import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeName,
  levenshteinDistance,
  calculateMatchScore,
} from "./discord-sync";

test("normalizeName strips guild prefixes, emojis, and punctuation cleanly", () => {
  assert.equal(normalizeName("[BB] Elwood"), "elwood");
  assert.equal(normalizeName("(BB) Jake Blues"), "jake blues");
  assert.equal(normalizeName("BB | Darth Dougie"), "darth dougie");
  assert.equal(normalizeName("BB - Joliet_Jake"), "joliet jake");
  assert.equal(normalizeName("✨ [BB] Elwood Blues ✨"), "elwood blues");
  assert.equal(normalizeName("[Blues Brothers] Cab Calloway"), "cab calloway");
  assert.equal(normalizeName("Darth.Vader_99"), "darth vader 99");
});

test("levenshteinDistance computes accurate edit distances", () => {
  assert.equal(levenshteinDistance("elwood", "elwood"), 0);
  assert.equal(levenshteinDistance("jake", "lake"), 1);
  assert.equal(levenshteinDistance("elwood", "elward"), 2);
  assert.equal(levenshteinDistance("", "test"), 4);
});

test("calculateMatchScore scores exact and guild-tagged nicknames with 100% confidence", () => {
  const match1 = calculateMatchScore("Elwood", {
    username: "elwood_disc",
    globalName: "Elwood",
    nickname: "[BB] Elwood",
  });
  assert.equal(match1.score, 100);
  assert.equal(match1.confidence, "EXACT");

  const match2 = calculateMatchScore("Joliet Jake", {
    username: "jake_official",
    globalName: "Jake",
    nickname: "BB | Joliet Jake",
  });
  assert.equal(match2.score, 100);
  assert.equal(match2.confidence, "EXACT");
});

test("calculateMatchScore handles substring and fuzzy nickname variations with high confidence", () => {
  const subMatch = calculateMatchScore("Elwood Blues", {
    username: "elwood_b",
    globalName: "Elwood",
    nickname: "Elwood",
  });
  assert.ok(subMatch.score >= 80);
  assert.ok(subMatch.confidence === "HIGH" || subMatch.confidence === "EXACT");

  const fuzzyMatch = calculateMatchScore("General Grievous", {
    username: "grievous99",
    globalName: "Gen Grievous",
    nickname: "General Grevious", // slight typo
  });
  assert.ok(fuzzyMatch.score >= 80);
});

test("calculateMatchScore assigns LOW confidence to unrelated users", () => {
  const mismatch = calculateMatchScore("Princess Leia", {
    username: "boba_fett",
    globalName: "Boba",
    nickname: "Boba Fett",
  });
  assert.ok(mismatch.score < 50);
  assert.equal(mismatch.confidence, "LOW");
});
