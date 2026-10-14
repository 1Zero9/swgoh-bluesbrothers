import { getPrisma } from "@/lib/prisma";

/** Questions one member may put to B-Lue3 per week (Monday to Sunday, UTC). Each one is a paid AI call. BLUE_WEEKLY_LIMIT overrides it. */
export const DEFAULT_WEEKLY_LIMIT = 5;

export function weeklyLimit() {
  const set = Number(process.env.BLUE_WEEKLY_LIMIT);
  return Number.isInteger(set) && set > 0 ? set : DEFAULT_WEEKLY_LIMIT;
}
export const MAX_QUESTION_CHARS = 500;
export const MAX_HISTORY = 6;

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** The Monday (UTC, YYYY-MM-DD) of the week `now` falls in: the key for that week's count. */
export function weekStart(now = new Date()) {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/**
 * The conversation the browser sends is untrusted: keep only plain user/assistant text, trim it,
 * cap its length and count, and make sure it ends with a question from the member.
 */
export function cleanConversation(input: unknown): ChatTurn[] | null {
  if (!Array.isArray(input)) return null;
  const turns: ChatTurn[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_QUESTION_CHARS);
    if (text) turns.push({ role, content: text });
  }
  const recent = turns.slice(-MAX_HISTORY);
  while (recent.length && recent[0].role !== "user") recent.shift();
  if (!recent.length || recent[recent.length - 1].role !== "user") return null;
  return recent;
}

/** Counts this question against this week's allowance. Returns how many are left, or null when used up. */
export async function takeQuestion(who: string, now = new Date()): Promise<number | null> {
  const prisma = getPrisma();
  const day = weekStart(now);
  const row = await prisma.blueUsage.upsert({
    where: { who_day: { who, day } },
    create: { who, day, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  const limit = weeklyLimit();
  if (row.count > limit) {
    // A blocked try must not use anything up, or the count keeps climbing and the allowance never recovers.
    await prisma.blueUsage.updateMany({ where: { who, day, count: { gt: 0 } }, data: { count: { decrement: 1 } } });
    return null;
  }
  return limit - row.count;
}

/** The Monday (UTC, YYYY-MM-DD) the allowance next resets. */
export function nextReset(now = new Date()) {
  const start = new Date(`${weekStart(now)}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + 7);
  return start.toISOString().slice(0, 10);
}

export type Usage = { limit: number; used: number; left: number; resetsOn: string };

/** Where a member stands this week, without using anything up. */
export async function getUsage(who: string, now = new Date()): Promise<Usage> {
  const row = await getPrisma().blueUsage.findUnique({ where: { who_day: { who, day: weekStart(now) } }, select: { count: true } });
  const limit = weeklyLimit();
  const used = row?.count ?? 0;
  return { limit, used, left: Math.max(0, limit - used), resetsOn: nextReset(now) };
}

/** Start the member's week again (officers, for testing and for putting right a bad count). */
export async function resetUsage(who: string, now = new Date()) {
  await getPrisma().blueUsage.deleteMany({ where: { who, day: weekStart(now) } });
}

/** Gives a question back when the AI itself failed, so a broken day never eats a member's weekly allowance. */
export async function refundQuestion(who: string, now = new Date()) {
  await getPrisma().blueUsage.updateMany({ where: { who, day: weekStart(now), count: { gt: 0 } }, data: { count: { decrement: 1 } } });
}

/** An error message safe to show an officer: shortened, with anything key-shaped removed. */
export function safeErrorDetail(error: unknown) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : "unknown error";
  return text.replace(/AIza[0-9A-Za-z_\-]{20,}/g, "[key]").replace(/(key|token|bearer)[=: ]+[^\s"']{12,}/gi, "$1=[hidden]").slice(0, 400);
}
