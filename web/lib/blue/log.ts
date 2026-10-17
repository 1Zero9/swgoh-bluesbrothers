import { getPrisma } from "@/lib/prisma";

/** Never let logging break a question: failures are swallowed. */
export async function logQuestion(entry: { playerId: string | null; playerName: string; question: string; route: "database" | "ai" | "blocked" | "search"; verdict?: "OK" | "BLOCKED"; reason?: string | null; answer?: string | null }) {
  try {
    await getPrisma().blueQuestion.create({
      data: {
        playerId: entry.playerId, playerName: entry.playerName.slice(0, 80), question: entry.question.slice(0, 1000), route: entry.route,
        verdict: entry.verdict ?? "OK", reason: entry.reason ?? null, answer: entry.answer ? entry.answer.slice(0, 600) : null,
      },
    });
  } catch (error) {
    console.error("blue: could not log question", error instanceof Error ? error.message : "unknown");
  }
}

/** A counter-finder search, noted once per member per term per hour so repeats don't inflate the picture. */
export async function logSearch(entry: { playerId: string | null; playerName: string; term: string; found: boolean }) {
  try {
    const db = getPrisma();
    const recent = await db.blueQuestion.findFirst({ where: { route: "search", question: entry.term, playerId: entry.playerId, createdAt: { gte: new Date(Date.now() - 3_600_000) } }, select: { id: true } });
    if (recent) return;
  } catch { /* fall through to a plain log */ }
  await logQuestion({ playerId: entry.playerId, playerName: entry.playerName, question: entry.term, route: "search", reason: entry.found ? "found" : "none" });
}

export async function isCutOff(playerId: string | null): Promise<boolean> {
  if (!playerId) return false;
  try {
    return Boolean(await getPrisma().blueCutoff.findUnique({ where: { playerId }, select: { playerId: true } }));
  } catch {
    return false;
  }
}

export type AdminQuestion = { id: string; at: string; playerId: string | null; name: string; question: string; route: string; verdict: string; reason: string | null; answer: string | null };
export type AdminMember = { playerId: string; name: string; total: number; blocked: number; lastAt: string; cutOff: boolean };

export type AdminSearch = { term: string; count: number; people: number; hadAnswer: boolean };

export async function adminOverview(filter: "all" | "blocked", limit = 300): Promise<{ questions: AdminQuestion[]; members: AdminMember[]; searches: AdminSearch[]; cutoffs: { playerId: string; name: string; reason: string | null; at: string }[] }> {
  const db = getPrisma();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [rows, cutoffs, grouped, searchRows] = await Promise.all([
    db.blueQuestion.findMany({ where: filter === "blocked" ? { verdict: "BLOCKED" } : { route: { not: "search" } }, orderBy: { createdAt: "desc" }, take: limit }),
    db.blueCutoff.findMany({ orderBy: { createdAt: "desc" } }),
    db.blueQuestion.groupBy({ by: ["playerId", "playerName", "verdict"], where: { playerId: { not: null }, route: { not: "search" }, createdAt: { gte: since } }, _count: { _all: true }, _max: { createdAt: true } }),
    db.blueQuestion.findMany({ where: { route: "search", createdAt: { gte: since } }, select: { question: true, playerId: true, reason: true }, take: 2000 }),
  ]);
  const terms = new Map<string, { count: number; people: Set<string>; hadAnswer: boolean }>();
  for (const row of searchRows) {
    const entry = terms.get(row.question) ?? { count: 0, people: new Set<string>(), hadAnswer: false };
    entry.count += 1;
    entry.people.add(row.playerId ?? "?");
    if (row.reason === "found") entry.hadAnswer = true;
    terms.set(row.question, entry);
  }
  const searches = [...terms.entries()].map(([term, v]) => ({ term, count: v.count, people: v.people.size, hadAnswer: v.hadAnswer })).sort((a, b) => b.count - a.count).slice(0, 15);
  const cut = new Set(cutoffs.map((entry) => entry.playerId));
  const byMember = new Map<string, AdminMember>();
  for (const group of grouped) {
    if (!group.playerId) continue;
    const entry = byMember.get(group.playerId) ?? { playerId: group.playerId, name: group.playerName, total: 0, blocked: 0, lastAt: "", cutOff: cut.has(group.playerId) };
    entry.total += group._count._all;
    if (group.verdict === "BLOCKED") entry.blocked += group._count._all;
    const last = group._max.createdAt?.toISOString() ?? "";
    if (last > entry.lastAt) entry.lastAt = last;
    byMember.set(group.playerId, entry);
  }
  return {
    questions: rows.map((row) => ({ id: row.id, at: row.createdAt.toISOString(), playerId: row.playerId, name: row.playerName, question: row.question, route: row.route, verdict: row.verdict, reason: row.reason, answer: row.answer })),
    searches,
    members: [...byMember.values()].sort((a, b) => b.blocked - a.blocked || b.total - a.total),
    cutoffs: cutoffs.map((entry) => ({ playerId: entry.playerId, name: entry.name, reason: entry.reason, at: entry.createdAt.toISOString() })),
  };
}
