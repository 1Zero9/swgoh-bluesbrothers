import { getPrisma } from "@/lib/prisma";
import { ARSENAL_CATEGORIES, UNIT_CHECKLIST, type ArsenalCategory } from "@/lib/unit-checklist";

type StoredRosterUnit = {
  definitionId?: unknown;
  currentRarity?: unknown;
  currentTier?: unknown;
  relic?: { currentTier?: unknown } | null;
};

type StoredPlayerProfile = {
  rosterUnit?: unknown;
};

export type GuildArsenalUnit = {
  definitionId: string;
  name: string;
  owned: number;
  sevenStar: number;
  relic: number;
  relicFive: number;
  averageRelic: number;
};

export type GuildArsenalCategory = {
  name: ArsenalCategory;
  coverage: number;
  units: GuildArsenalUnit[];
};

export type GuildArsenal = {
  memberCount: number;
  syncedMembers: number;
  categories: GuildArsenalCategory[];
};

function numeric(value: unknown) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function rosterFromProfile(payload: unknown): StoredRosterUnit[] | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const roster = (payload as StoredPlayerProfile).rosterUnit;
  if (!Array.isArray(roster)) return null;
  return roster.filter((unit): unit is StoredRosterUnit => Boolean(unit) && typeof unit === "object" && !Array.isArray(unit));
}

function baseDefinitionId(value: unknown) {
  return String(value ?? "").split(":")[0];
}

export async function getGuildArsenal(): Promise<GuildArsenal> {
  if (!process.env.DATABASE_URL) return { memberCount: 0, syncedMembers: 0, categories: [] };

  try {
    const snapshot = await getPrisma().guildSnapshot.findFirst({
      orderBy: { capturedAt: "desc" },
      include: {
        members: {
          include: {
            player: { select: { profilePayload: true } },
          },
        },
      },
    });
    if (!snapshot) return { memberCount: 0, syncedMembers: 0, categories: [] };

    const rosters = snapshot.members.flatMap((member) => {
      const roster = rosterFromProfile(member.player.profilePayload);
      return roster ? [new Map(roster.map((unit) => [baseDefinitionId(unit.definitionId), unit]))] : [];
    });
    const syncedMembers = rosters.length;

    const categories = ARSENAL_CATEGORIES.map((categoryName) => {
      const units = UNIT_CHECKLIST[categoryName].map((checklistUnit) => {
        const ownedUnits = rosters.flatMap((roster) => {
          const unit = roster.get(checklistUnit.definitionId);
          return unit ? [unit] : [];
        });
        const relicLevels = ownedUnits.map((unit) => Math.max(0, numeric(unit.relic?.currentTier) - 2));
        return {
          ...checklistUnit,
          owned: ownedUnits.length,
          sevenStar: ownedUnits.filter((unit) => numeric(unit.currentRarity) >= 7).length,
          relic: relicLevels.filter((level) => level > 0).length,
          relicFive: relicLevels.filter((level) => level >= 5).length,
          averageRelic: relicLevels.length
            ? Math.round((relicLevels.reduce((total, level) => total + level, 0) / relicLevels.length) * 10) / 10
            : 0,
        };
      });
      const ownedSlots = units.reduce((total, unit) => total + unit.owned, 0);
      const possibleSlots = syncedMembers * units.length;
      return {
        name: categoryName,
        coverage: possibleSlots ? Math.round((ownedSlots / possibleSlots) * 100) : 0,
        units: units.sort((a, b) => b.owned - a.owned || a.name.localeCompare(b.name)),
      };
    });

    return { memberCount: snapshot.members.length, syncedMembers, categories };
  } catch {
    return { memberCount: 0, syncedMembers: 0, categories: [] };
  }
}
