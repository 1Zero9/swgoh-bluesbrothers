import { createHash, createHmac } from "node:crypto";

type ComlinkMember = {
  playerId?: string;
  playerName?: string;
  galacticPower?: string | number;
  characterGalacticPower?: string | number;
  shipGalacticPower?: string | number;
  guildJoinTime?: string | number;
  lastActivityTime?: string | number;
  playerLevel?: string | number;
  memberLevel?: string | number;
  squadPower?: string | number;
  lifetimeSeasonScore?: string | number;
  leagueId?: string;
  guildXp?: string | number;
  memberContribution?: Array<{ type?: string | number; currentValue?: string | number }>;
};

export type TerritoryWarParticipant = {
  eligible?: boolean;
  joinTime?: string | number;
  memberId?: string;
  power?: string | number;
};

export type TerritoryWarGuildStatus = {
  conflictStatus?: Array<{
    defeatedSquadCount?: string | number;
    squadCapacity?: string | number;
    squadCount?: string | number;
    warSquad?: Array<Record<string, unknown>>;
    zoneStatus?: {
      commandMessage?: string;
      score?: string | number;
      zoneId?: string;
      zoneState?: string | number;
    };
  }>;
  profile?: {
    guildGalacticPower?: string | number;
    id?: string;
    name?: string;
  };
};

export type TerritoryWarStatus = Record<string, unknown> & {
  awayGuild?: TerritoryWarGuildStatus;
  currentRound?: string | number;
  currentRoundEndTime?: string | number;
  definitionId?: string;
  excludedFromWar?: boolean;
  homeGuild?: TerritoryWarGuildStatus;
  instanceId?: string;
  optedInMember?: TerritoryWarParticipant[];
  optedInMemberId?: string[];
};

export type TerritoryWarResult = Record<string, unknown> & {
  endTimeSeconds?: string | number;
  opponentGuildProfile?: TerritoryWarGuildStatus["profile"];
  opponentScore?: string | number;
  power?: string | number;
  score?: string | number;
  startTime?: string | number;
  territoryWarId?: string;
};

type ComlinkResponse = {
  guild?: {
    profile?: { name?: string };
    member?: ComlinkMember[];
    recentTerritoryWarResult?: TerritoryWarResult[];
    territoryWarStatus?: TerritoryWarStatus[];
  };
};

export type GuildRosterMember = {
  playerId: string;
  name: string;
  galacticPower: bigint;
  characterPower: bigint;
  shipPower: bigint;
  raidTickets: number;
  joinedAt: Date;
  lastActivityAt: Date | null;
  playerLevel: number;
  memberRole: "Member" | "Officer" | "Leader";
  squadPower: number;
  lifetimeSeasonScore: bigint;
  leagueId: string | null;
  guildXp: number;
  rawPayload: Record<string, unknown>;
};

export type GuildRoster = {
  guildId: string;
  name: string;
  members: GuildRosterMember[];
  territoryWarResults: TerritoryWarResult[];
  territoryWars: TerritoryWarStatus[];
  rawPayload: Record<string, unknown>;
};

function numberValue(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: string | number | undefined) {
  const parsed = numberValue(value);
  if (!parsed) return null;
  return new Date(parsed < 1_000_000_000_000 ? parsed * 1000 : parsed);
}

function memberRole(value: string | number | undefined): GuildRosterMember["memberRole"] {
  if (value === 4 || value === "4" || value === "GUILD_LEADER") return "Leader";
  if (value === 3 || value === "3" || value === "GUILD_OFFICER") return "Officer";
  return "Member";
}

function authorizationHeaders(path: string, body: string): Record<string, string> {
  const accessKey = process.env.COMLINK_ACCESS_KEY;
  const secretKey = process.env.COMLINK_SECRET_KEY;
  if (!accessKey || !secretKey) return {};

  const timestamp = Date.now().toString();
  const bodyHash = createHash("md5").update(body).digest("hex");
  const signature = createHmac("sha256", secretKey)
    .update(timestamp)
    .update("POST")
    .update(path)
    .update(bodyHash)
    .digest("hex");

  return {
    "X-Date": timestamp,
    Authorization: `HMAC-SHA256 Credential=${accessKey},Signature=${signature}`,
  };
}

async function postComlink<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const baseUrl = process.env.COMLINK_URL;
  if (!baseUrl) throw new Error("COMLINK_URL is required");

  const body = JSON.stringify({ payload, enums: false });
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "BluesBrothersDroid/0.7",
      ...authorizationHeaders(path, body),
    },
    body,
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) throw new Error(`Comlink returned HTTP ${response.status} for ${path}`);
  return (await response.json()) as T;
}

export async function fetchGuildRoster(): Promise<GuildRoster> {
  const guildId = process.env.SWGOH_GUILD_ID;
  if (!guildId) throw new Error("SWGOH_GUILD_ID is required");

  const payload = await postComlink<ComlinkResponse>("/guild", {
    guildId,
    includeRecentGuildActivityInfo: true,
  });
  const guild = payload.guild;
  if (!guild || !Array.isArray(guild.member)) {
    throw new Error("Comlink returned an unexpected guild response");
  }

  const members = guild.member.flatMap((member) => {
    const playerId = String(member.playerId ?? "").trim();
    if (!playerId) return [];
    const contributions = Array.isArray(member.memberContribution) ? member.memberContribution : [];
    const raidTickets = contributions
      .filter((item) => numberValue(item.type) === 2)
      .reduce((total, item) => total + numberValue(item.currentValue), 0);

    return [{
      playerId,
      name: String(member.playerName || "Unknown player"),
      galacticPower: BigInt(Math.trunc(numberValue(member.galacticPower))),
      characterPower: BigInt(Math.trunc(numberValue(member.characterGalacticPower))),
      shipPower: BigInt(Math.trunc(numberValue(member.shipGalacticPower))),
      raidTickets,
      joinedAt: dateValue(member.guildJoinTime) ?? new Date(),
      lastActivityAt: dateValue(member.lastActivityTime),
      playerLevel: Math.trunc(numberValue(member.playerLevel)),
      memberRole: memberRole(member.memberLevel),
      squadPower: Math.trunc(numberValue(member.squadPower)),
      lifetimeSeasonScore: BigInt(Math.trunc(numberValue(member.lifetimeSeasonScore))),
      leagueId: member.leagueId ? String(member.leagueId) : null,
      guildXp: Math.trunc(numberValue(member.guildXp)),
      rawPayload: member as Record<string, unknown>,
    }];
  });

  return {
    guildId,
    name: guild.profile?.name || "Blues Brothers",
    members,
    territoryWarResults: Array.isArray(guild.recentTerritoryWarResult) ? guild.recentTerritoryWarResult : [],
    territoryWars: Array.isArray(guild.territoryWarStatus) ? guild.territoryWarStatus : [],
    rawPayload: payload as Record<string, unknown>,
  };
}

type ComlinkPlayerResponse = {
  name?: string;
  playerId?: string;
  allyCode?: string | number;
};

export type ComlinkPlayer = {
  playerId: string;
  name: string;
};

type PlayerRosterUnit = {
  definitionId?: string;
  relic?: { currentTier?: string | number };
  purchasedAbilityId?: string[];
};

export type ComlinkPlayerProfile = Record<string, unknown> & {
  allyCode?: string | number;
  playerId?: string;
  level?: string | number;
  lifetimeSeasonScore?: string | number;
  selectedPlayerPortrait?: { id?: string };
  selectedPlayerTitle?: { id?: string };
  rosterUnit?: PlayerRosterUnit[];
  datacron?: unknown[];
};

const GALACTIC_LEGEND_IDS = new Set([
  "GLREY",
  "SUPREMELEADERKYLOREN",
  "GRANDMASTERLUKE",
  "SITHPALPATINE",
  "JEDIMASTERKENOBI",
  "LORDVADER",
  "JABBATHEHUTT",
  "GLLEIA",
  "GLAHSOKATANO",
  "GLHONDO",
]);

export function summarizePlayerProfile(profile: ComlinkPlayerProfile) {
  const roster = Array.isArray(profile.rosterUnit) ? profile.rosterUnit : [];
  const baseIds = roster.map((unit) => String(unit.definitionId ?? "").split(":")[0]);
  return {
    galacticLegends: baseIds.filter((id) => GALACTIC_LEGEND_IDS.has(id)).length,
    unlockedUltimates: roster.reduce(
      (count, unit) => count + (unit.purchasedAbilityId ?? []).filter((id) => id.startsWith("ultimateability_")).length,
      0,
    ),
    relicUnits: roster.filter((unit) => numberValue(unit.relic?.currentTier) > 2).length,
    rosterUnits: roster.length,
    datacrons: Array.isArray(profile.datacron) ? profile.datacron.length : 0,
  };
}

export async function fetchPlayerProfileById(playerId: string): Promise<ComlinkPlayerProfile> {
  return postComlink<ComlinkPlayerProfile>("/player", { playerId });
}

export function sanitizeAllyCode(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length === 9 ? digits : null;
}

export async function fetchPlayerByAllyCode(allyCode: string): Promise<ComlinkPlayer | null> {
  const clean = sanitizeAllyCode(allyCode);
  if (!clean) return null;

  const payload = await postComlink<ComlinkPlayerResponse>("/player", { allyCode: clean });
  const playerId = String(payload.playerId ?? "").trim();
  if (!playerId) return null;

  return { playerId, name: String(payload.name || "Unknown player") };
}
