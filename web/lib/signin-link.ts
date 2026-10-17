import { createHash, randomBytes } from "node:crypto";

/** A one-time sign-in link lasts this long unless used first. */
export const SIGNIN_LINK_TTL_MS = 48 * 3_600_000;

export const newSignInToken = () => randomBytes(32).toString("base64url");
export const hashSignInToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const looksLikeToken = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{40,60}$/.test(value);
