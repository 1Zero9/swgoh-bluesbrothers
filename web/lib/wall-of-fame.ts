import { TICKET_TARGET_PER_MEMBER } from "@/lib/dashboard";
import { getLatestGuildSnapshot } from "@/lib/guild-snapshot";

export type WallOfFameEntry = {
  playerId: string;
  name: string;
  value: number;
  displayValue: string;
  rank: number;
  badge: string | null;
};

export type WallOfFameCategory = {
  key: "power" | "tickets" | "legends" | "relics" | "datacrons";
  label: string;
  unit: string;
  entries: WallOfFameEntry[];
};

const MAX_ENTRIES = 5;
const MIN_GUILD_SIZE = 4;

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("en-GB");
}

function rankedCategory(
  key: WallOfFameCategory["key"],
  label: string,
  unit: string,
  members: { playerId: string; name: string; value: number }[],
  format: (value: number) => string,
  badgeFor?: (value: number, rank: number) => string | null,
): WallOfFameCategory {
  const ranked = [...members].sort((a, b) => b.value - a.value).slice(0, MAX_ENTRIES);
  return {
    key,
    label,
    unit,
    entries: ranked.map((member, index) => ({
      playerId: member.playerId,
      name: member.name,
      value: member.value,
      displayValue: format(member.value),
      rank: index + 1,
      badge: badgeFor ? badgeFor(member.value, index) : null,
    })),
  };
}

export async function getWallOfFame(): Promise<WallOfFameCategory[]> {
  const snapshot = await getLatestGuildSnapshot();
  if (!snapshot || snapshot.members.length < MIN_GUILD_SIZE) return [];

  const base = snapshot.members.map((member) => {
    const profile = member.player.profileSnapshots[0];
    return {
      playerId: member.playerId,
      name: member.player.currentName,
      galacticPower: Number(member.galacticPower),
      raidTickets: member.raidTickets ?? 0,
      galacticLegends: profile?.galacticLegends ?? 0,
      relicUnits: profile?.relicUnits ?? 0,
      datacrons: profile?.datacrons ?? 0,
    };
  });

  const categories: WallOfFameCategory[] = [
    rankedCategory(
      "power",
      "Galactic power",
      "GP",
      base.map((member) => ({ playerId: member.playerId, name: member.name, value: member.galacticPower })),
      formatCompact,
      (_value, rank) => (rank === 0 ? "Top gun in the guild" : null),
    ),
    rankedCategory(
      "tickets",
      "Raid tickets",
      "tickets",
      base.map((member) => ({ playerId: member.playerId, name: member.name, value: member.raidTickets })),
      (value) => value.toLocaleString("en-GB"),
      (value) => (value >= TICKET_TARGET_PER_MEMBER ? "Maxed raid tickets" : null),
    ),
    rankedCategory(
      "legends",
      "Galactic Legends",
      "GLs",
      base.map((member) => ({ playerId: member.playerId, name: member.name, value: member.galacticLegends })),
      (value) => value.toLocaleString("en-GB"),
    ),
    rankedCategory(
      "relics",
      "Relic units",
      "units",
      base.map((member) => ({ playerId: member.playerId, name: member.name, value: member.relicUnits })),
      (value) => value.toLocaleString("en-GB"),
    ),
    rankedCategory(
      "datacrons",
      "Datacrons",
      "equipped",
      base.map((member) => ({ playerId: member.playerId, name: member.name, value: member.datacrons })),
      (value) => value.toLocaleString("en-GB"),
    ),
  ];

  return categories.filter((category) => category.key === "power" || category.entries.some((entry) => entry.value > 0));
}
