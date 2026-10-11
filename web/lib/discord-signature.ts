import { createPublicKey, verify } from "node:crypto";

/** The fixed prefix that turns a raw 32-byte Ed25519 public key into a DER "SubjectPublicKeyInfo" Node can read. */
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Checks a Discord interaction request really came from Discord: an Ed25519 signature over the
 * timestamp header followed by the raw request body, verified with the application's public key.
 */
export function verifyDiscordSignature(publicKeyHex: string, signatureHex: string, timestamp: string, rawBody: string) {
  try {
    const key = createPublicKey({ key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyHex, "hex")]), format: "der", type: "spki" });
    return verify(null, Buffer.from(timestamp + rawBody), key, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}
