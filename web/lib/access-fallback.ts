import type { ViewerAccess } from "@/lib/access-control";

/** How long a member we looked up successfully is still recognised if the database can't be reached. */
export const GRACE_MS = 6 * 3_600_000;

export type Remembered = { access: ViewerAccess; at: number };

/**
 * The database is unreachable (a timeout, too many connections) but the visitor holds a valid, signed member cookie. Treat them as the
 * member they were a moment ago instead of signing them out: the cookie was only ever issued to an active member, and the real check
 * returns as soon as the database does. Without a remembered lookup they are a plain member (no name) until it recovers.
 */
export function whenDatabaseDown(playerId: string, isOfficer: boolean, remembered: Remembered | undefined, now = Date.now()): ViewerAccess {
  if (remembered && remembered.access.playerId === playerId && now - remembered.at < GRACE_MS) {
    return { ...remembered.access, role: isOfficer ? "OFFICER" : "MEMBER", isAuthorized: true, isOfficer, isMember: true };
  }
  return { role: isOfficer ? "OFFICER" : "MEMBER", isAuthorized: true, isOfficer, isMember: true, playerId, membershipState: "ACTIVE" };
}
