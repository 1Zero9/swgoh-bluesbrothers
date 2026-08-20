import { createHash, createHmac } from "node:crypto";

type ComlinkMember = {
  playerId?: string;
  playerName?: string;
  galacticPower?: string | number;
  characterGalacticPower?: string | number;
  shipGalacticPower?: string | number;
  guildJoinTime?: string | number;
  lastActivityTime?: string | number;
  memberContribution?: Array<{ type?: string | number; currentValue?: string | number }>;
};

type ComlinkResponse = {
  guild?: {
    profile?: { name?: string };
    member?: ComlinkMember[];
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
};

export type GuildRoster = {
  guildId: string;
  name: string;
  members: GuildRosterMember[];
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
    }];
  });

  return { guildId, name: guild.profile?.name || "Blues Brothers", members };
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
