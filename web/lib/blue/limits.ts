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
  return row.count > limit ? null : limit - row.count;
}
