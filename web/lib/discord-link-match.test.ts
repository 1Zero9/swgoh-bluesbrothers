import { test } from "node:test";
import assert from "node:assert/strict";
import { selectBulkLinkCandidates } from "./discord-link-match";
import type { DiscordGuildMember, PlayerDiscordStatus } from "./discord-sync";

const member = (id: string, username: string): DiscordGuildMember => ({
  id, username, globalName: null, nickname: null, roles: [], avatarUrl: null, joinedAt: null,
});

const player = (
  playerId: string,
  playerName: string,
  suggestions: [DiscordGuildMember, "EXACT" | "HIGH"][] = [],
  linked: DiscordGuildMember | null = null,
): PlayerDiscordStatus => ({
  playerId, playerName, playerLevel: 85, galacticPower: null, allyCode: null, state: "ACTIVE",
  linkedDiscordUser: linked,
  extraDiscordUsers: [],
  suggestedMatches: suggestions.map(([discordMember, confidence]) => ({ discordMember, score: 100, confidence, matchReason: "" })),
});

test("links only unambiguous exact matches", () => {
  const bro = member("1", "bro");
  const dex = member("2", "dex");
  const result = selectBulkLinkCandidates([
    player("a", "Bro", [[bro, "EXACT"]]),
    player("b", "Dex", [[dex, "HIGH"]]),
    player("c", "Nobody"),
  ]);
  assert.deepEqual(result.map((r) => r.playerName), ["Bro"]);
});

test("skips a Discord member claimed by two players or already linked", () => {
  const shared = member("1", "twin");
  const taken = member("2", "taken");
  const result = selectBulkLinkCandidates([
    player("a", "Twin", [[shared, "EXACT"]]),
    player("b", "Twin2", [[shared, "EXACT"]]),
    player("c", "Taken", [[taken, "EXACT"]]),
    player("d", "Owner", [], taken),
  ]);
  assert.deepEqual(result, []);
});
