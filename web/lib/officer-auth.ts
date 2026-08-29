import { createHmac, timingSafeEqual } from "node:crypto";

export const OFFICER_COOKIE_NAME = "bb_officer";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeStringEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function getOfficerSecret() {
  return process.env.OFFICER_SITE_PASSWORD || (process.env.NODE_ENV !== "production" ? "bluesbrothers" : undefined);
}

export function isOfficerConfigured() {
  return Boolean(getOfficerSecret());
}

export function checkOfficerPassword(candidate: string) {
  const expected = getOfficerSecret();
  if (!expected) return false;
  return timingSafeStringEqual(candidate, expected);
}

export function createOfficerSessionCookie() {
  const secret = getOfficerSecret();
  if (!secret) throw new Error("OFFICER_SITE_PASSWORD is not configured");

  const expires = Date.now() + SESSION_TTL_MS;
  const signature = sign(`officer:${expires}`, secret);
  return { value: `${expires}.${signature}`, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export function verifyOfficerSessionValue(value: string | undefined) {
  const secret = getOfficerSecret();
  if (!value || !secret) return false;

  const [expiresRaw, signature] = value.split(".");
  const expires = Number(expiresRaw);
  if (!expires || !signature || expires < Date.now()) return false;

  return timingSafeStringEqual(signature, sign(`officer:${expires}`, secret));
}
