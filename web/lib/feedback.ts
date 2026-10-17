/** The guild feedback board: kinds, statuses and the checks on what members and officers send. */

export const KINDS = ["FEATURE", "FEEDBACK", "BUG"] as const;
export type FeedbackKind = (typeof KINDS)[number];
export const KIND_LABELS: Record<FeedbackKind, string> = { FEATURE: "Feature request", FEEDBACK: "Feedback", BUG: "Something's broken" };

export const STATUSES = ["OPEN", "PLANNED", "IN_PROGRESS", "DONE", "DECLINED"] as const;
export type FeedbackStatus = (typeof STATUSES)[number];
export const STATUS_LABELS: Record<FeedbackStatus, string> = { OPEN: "New", PLANNED: "Planned", IN_PROGRESS: "In progress", DONE: "Done", DECLINED: "Not doing" };

export const POSTS_PER_DAY = 5;

export const isKind = (value: unknown): value is FeedbackKind => typeof value === "string" && (KINDS as readonly string[]).includes(value);
export const isStatus = (value: unknown): value is FeedbackStatus => typeof value === "string" && (STATUSES as readonly string[]).includes(value);

const tidy = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "");

export type FeedbackInput = { kind: FeedbackKind; title: string; body: string };

export function validateFeedback(input: unknown): { ok: true; value: FeedbackInput } | { ok: false; error: string } {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const kind: FeedbackKind = isKind(data.kind) ? data.kind : "FEATURE";
  const title = tidy(data.title, 100).replace(/\s*\n\s*/g, " ");
  const body = tidy(data.body, 1500);
  if (title.length < 4) return { ok: false, error: "Give it a short title (at least 4 characters)." };
  if (body.length < 10) return { ok: false, error: "Say a bit more: what do you want, and why? (at least 10 characters)." };
  return { ok: true, value: { kind, title, body } };
}

export type OfficerUpdate = { status?: FeedbackStatus; reply?: string | null };

/** An officer's edit: a new status and/or a note to the guild (an empty note clears it). */
export function validateUpdate(input: unknown): { ok: true; value: OfficerUpdate } | { ok: false; error: string } {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const value: OfficerUpdate = {};
  if (data.status !== undefined) {
    if (!isStatus(data.status)) return { ok: false, error: "That is not a status." };
    value.status = data.status;
  }
  if (data.reply !== undefined) value.reply = tidy(data.reply, 500) || null;
  if (value.status === undefined && value.reply === undefined) return { ok: false, error: "Nothing to change." };
  return { ok: true, value };
}

/** To do first (newest activity last within a group is not useful), then done. Open work sorts by votes, then age. */
export function sortItems<T extends { status: string; votes: number; createdAt: string }>(items: T[]): T[] {
  const rank: Record<string, number> = { IN_PROGRESS: 0, PLANNED: 1, OPEN: 2, DONE: 3, DECLINED: 4 };
  return [...items].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || b.votes - a.votes || (a.createdAt < b.createdAt ? 1 : -1));
}
