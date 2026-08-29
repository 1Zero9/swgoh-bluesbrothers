import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_DATACRON_SETS,
  getGuildDatacronVault,
  parsePlayerDatacrons,
} from "./datacrons";

test("ACTIVE_DATACRON_SETS contains valid active seasons with Tier 3, 6, and 9 perks", () => {
  assert.ok(ACTIVE_DATACRON_SETS.length >= 2, "Expected at least 2 active datacron sets");
  for (const set of ACTIVE_DATACRON_SETS) {
    assert.ok(set.id, "Set must have an id");
    assert.ok(set.name, "Set must have a name");
    assert.ok(set.factions.length > 0, "Set must list factions");
    assert.ok(set.tier3Perks.length > 0, "Set must have Tier 3 alignment perks");
    assert.ok(set.tier6Perks.length > 0, "Set must have Tier 6 faction perks");
    assert.ok(set.tier9Perks.length > 0, "Set must have Tier 9 character perks");

    for (const t9 of set.tier9Perks) {
      assert.ok(t9.characterName, "Tier 9 perk must name a character");
      assert.ok(t9.squadPairing, "Tier 9 perk must provide squad pairing advice");
      assert.ok(t9.twTier, "Tier 9 perk must define a TW tier rating");
    }
  }
});

test("parsePlayerDatacrons extracts valid GuildDatacron instances from Comlink player payload", () => {
  const samplePayload = {
    datacron: [
      {
        id: "dc_user_1",
        setId: "set-20",
        tier: 9,
        affix: [
          { statType: "health", statValue: 542000 },
          { statType: "defense", statValue: 884000 },
        ],
        rerollCount: 5,
      },
      {
        id: "dc_user_2",
        setId: "set-18",
        tier: 6,
        affix: [
          { statType: "speed", statValue: 18 },
        ],
        rerollCount: 2,
      },
    ],
  };

  const parsed = parsePlayerDatacrons("Jake", "player_123", samplePayload);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].ownerName, "Jake");
  assert.equal(parsed[0].level, 9);
  assert.equal(parsed[0].tierCategory, "L9_CHARACTER");
  assert.equal(parsed[1].level, 6);
  assert.equal(parsed[1].tierCategory, "L6_FACTION");
});

test("parsePlayerDatacrons handles null and empty payloads gracefully", () => {
  assert.deepEqual(parsePlayerDatacrons("Elwood", "p_1", null), []);
  assert.deepEqual(parsePlayerDatacrons("Elwood", "p_1", {}), []);
  assert.deepEqual(parsePlayerDatacrons("Elwood", "p_1", { datacron: "invalid" }), []);
});

test("getGuildDatacronVault calculates accurate guild summary and metrics", async () => {
  const vault = await getGuildDatacronVault();
  assert.ok(vault.datacrons.length > 0, "Expected guild datacrons to be loaded");
  assert.ok(vault.summary.totalDatacrons >= vault.summary.level9Count);
  assert.ok(vault.summary.level9Count > 0, "Expected Level 9 character datacrons");
  assert.ok(vault.summary.topOwners.length > 0, "Expected top owners leaderboard");
  assert.ok(vault.activeSets.length > 0, "Expected active sets");
});
