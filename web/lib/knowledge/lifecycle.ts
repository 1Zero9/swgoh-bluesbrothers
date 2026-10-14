export const STATUSES = ["CANDIDATE", "PUBLISHED", "DISPUTED", "OUTDATED", "REJECTED"] as const;
export type KbStatus = (typeof STATUSES)[number];
export type KbAction = "PUBLISH" | "REJECT" | "DISPUTE" | "OUTDATE" | "RESTORE";

const TARGET: Record<KbAction, KbStatus> = { PUBLISH: "PUBLISHED", REJECT: "REJECTED", DISPUTE: "DISPUTED", OUTDATE: "OUTDATED", RESTORE: "CANDIDATE" };

/** Which review moves are allowed from each state. Nothing goes straight from rejected to published: restore it to the queue first. */
const ALLOWED: Record<KbStatus, KbAction[]> = {
  CANDIDATE: ["PUBLISH", "REJECT"],
  PUBLISHED: ["DISPUTE", "OUTDATE"],
  DISPUTED: ["PUBLISH", "OUTDATE", "REJECT"],
  OUTDATED: ["RESTORE"],
  REJECTED: ["RESTORE"],
};

export function nextStatus(from: KbStatus, action: KbAction): KbStatus | null {
  return ALLOWED[from]?.includes(action) ? TARGET[action] : null;
}

export function isAction(value: unknown): value is KbAction {
  return typeof value === "string" && value in TARGET;
}

/** A published counter that has not been looked at for this long is flagged for a refresh. */
export const REFRESH_AFTER_DAYS = 120;

export type Freshness = {
  /** The counter's Datacron has run out, so it can no longer be used as written. */
  datacronExpired: boolean;
  datacronUnknownExpiry: boolean;
  needsRefresh: boolean;
};

export function freshness(
  matchup: { datacronDependent: boolean; datacronExpiresAt: Date | null; reviewedAt: Date | null; createdAt: Date },
  now: number,
): Freshness {
  const datacronExpired = matchup.datacronDependent && matchup.datacronExpiresAt !== null && matchup.datacronExpiresAt.getTime() < now;
  const lastLooked = (matchup.reviewedAt ?? matchup.createdAt).getTime();
  return {
    datacronExpired,
    datacronUnknownExpiry: matchup.datacronDependent && matchup.datacronExpiresAt === null,
    needsRefresh: now - lastLooked > REFRESH_AFTER_DAYS * 86_400_000,
  };
}

/** A counter members can act on right now: published, and not relying on an expired Datacron. */
export function isCurrentlyUsable(matchup: { status: string; datacronDependent: boolean; datacronExpiresAt: Date | null }, now: number): boolean {
  if (matchup.status !== "PUBLISHED") return false;
  return !(matchup.datacronDependent && matchup.datacronExpiresAt !== null && matchup.datacronExpiresAt.getTime() < now);
}
