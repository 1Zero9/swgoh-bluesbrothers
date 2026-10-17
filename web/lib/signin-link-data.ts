import { getPrisma } from "@/lib/prisma";
import { hashSignInToken, newSignInToken, SIGNIN_LINK_TTL_MS } from "@/lib/signin-link";

export async function createSignInLink(playerId: string, createdByName: string) {
  const db = getPrisma();
  const player = await db.player.findFirst({ where: { id: playerId, membershipTerms: { some: { state: "ACTIVE" } } }, select: { currentName: true } });
  if (!player) return null;
  const token = newSignInToken();
  await db.memberSignInLink.create({ data: { tokenHash: hashSignInToken(token), playerId, createdByName: createdByName.slice(0, 80), expiresAt: new Date(Date.now() + SIGNIN_LINK_TTL_MS) } });
  return { token, name: player.currentName };
}

/** Whose link this is, without using it up (link previews and crawlers only ever reach this). */
export async function peekSignInLink(token: string) {
  const row = await getPrisma().memberSignInLink.findUnique({ where: { tokenHash: hashSignInToken(token) }, select: { usedAt: true, expiresAt: true, playerId: true } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  const player = await getPrisma().player.findFirst({ where: { id: row.playerId, membershipTerms: { some: { state: "ACTIVE" } } }, select: { currentName: true } });
  return player ? { name: player.currentName } : null;
}

/** Use the link up. Only one request can ever win. Returns the member's id, or null. */
export async function consumeSignInLink(token: string): Promise<string | null> {
  const db = getPrisma();
  const hash = hashSignInToken(token);
  const row = await db.memberSignInLink.findUnique({ where: { tokenHash: hash }, select: { playerId: true } });
  if (!row) return null;
  const won = await db.memberSignInLink.updateMany({ where: { tokenHash: hash, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
  if (won.count !== 1) return null;
  const active = await db.player.findFirst({ where: { id: row.playerId, membershipTerms: { some: { state: "ACTIVE" } } }, select: { id: true } });
  return active?.id ?? null;
}
