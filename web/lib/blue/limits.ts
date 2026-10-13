import { getPrisma } from "@/lib/prisma";

/** Questions one member may put to B-LU3 per UTC day. Each one is a paid AI call. */
export const BLUE_DAILY_LIMIT = 25;
export const MAX_QUESTION_CHARS = 500;
export const MAX_HISTORY = 6;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function today(now = new Date()) {
  return now.toISOString().slice(0, 10);
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

/** Counts this question against today's allowance. Returns how many are left, or null when used up. */
export async function takeQuestion(who: string, now = new Date()): Promise<number | null> {
  const prisma = getPrisma();
  const day = today(now);
  const row = await prisma.blueUsage.upsert({
    where: { who_day: { who, day } },
    create: { who, day, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return row.count > BLUE_DAILY_LIMIT ? null : BLUE_DAILY_LIMIT - row.count;
}
