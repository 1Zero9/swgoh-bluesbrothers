import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const LINK_COOKIE_NAME = "bb_link";
export const MEMBER_COOKIE_NAME = "bb_member";
export const OAUTH_STATE_COOKIE_NAME = "bb_oauth_state";

const LINK_TTL_MS = 10 * 60 * 1000;
const MEMBER_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function sign(payload: string) {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("AUTH_SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeStringEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function isMemberAuthConfigured() {
  return Boolean(process.env.AUTH_SESSION_SECRET && process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function createOAuthState() {
  return randomBytes(16).toString("hex");
}

export function createLinkCookieValue(discordUserId: string, username: string) {
  const expires = Date.now() + LINK_TTL_MS;
  const payload = `${discordUserId}:${username}:${expires}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return { value: `${encoded}.${sign(encoded)}`, maxAge: Math.floor(LINK_TTL_MS / 1000) };
}

export function verifyLinkCookieValue(value: string | undefined) {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || !timingSafeStringEqual(signature, sign(encoded))) return null;

  const [discordUserId, username, expiresRaw] = Buffer.from(encoded, "base64url").toString("utf8").split(":");
  const expires = Number(expiresRaw);
  if (!discordUserId || !expires || expires < Date.now()) return null;

  return { discordUserId, username: username || "Discord member" };
}

export function createMemberCookieValue(playerId: string) {
  const expires = Date.now() + MEMBER_TTL_MS;
  const payload = `${playerId}:${expires}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return { value: `${encoded}.${sign(encoded)}`, maxAge: Math.floor(MEMBER_TTL_MS / 1000) };
}

export function verifyMemberCookieValue(value: string | undefined) {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || !timingSafeStringEqual(signature, sign(encoded))) return null;

  const [playerId, expiresRaw] = Buffer.from(encoded, "base64url").toString("utf8").split(":");
  const expires = Number(expiresRaw);
  if (!playerId || !expires || expires < Date.now()) return null;

  return playerId;
}
