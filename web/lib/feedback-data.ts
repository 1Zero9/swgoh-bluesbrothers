import { type FeedbackInput, type OfficerUpdate, POSTS_PER_DAY } from "@/lib/feedback";
import { getPrisma } from "@/lib/prisma";

export type FeedbackListing = {
  id: string; kind: string; title: string; body: string; status: string; reply: string | null;
  submittedByName: string; statusByName: string | null; createdAt: string; doneAt: string | null;
  votes: number; votedByMe: boolean; mine: boolean;
};

export async function listFeedback(viewerPlayerId: string | null): Promise<FeedbackListing[]> {
  const rows = await getPrisma().feedbackItem.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { votes: { select: { playerId: true } } } });
  return rows.map((row) => ({
    id: row.id, kind: row.kind, title: row.title, body: row.body, status: row.status, reply: row.reply,
    submittedByName: row.submittedByName, statusByName: row.statusByName, createdAt: row.createdAt.toISOString(), doneAt: row.doneAt?.toISOString() ?? null,
    votes: row.votes.length, votedByMe: viewerPlayerId !== null && row.votes.some((vote) => vote.playerId === viewerPlayerId), mine: viewerPlayerId !== null && row.submittedById === viewerPlayerId,
  }));
}

/** Count of open items, for a badge. */
export async function countOpenFeedback(): Promise<number> {
  return getPrisma().feedbackItem.count({ where: { status: { in: ["OPEN", "PLANNED", "IN_PROGRESS"] } } });
}

export async function postedToday(playerId: string): Promise<boolean> {
  const since = new Date(Date.now() - 86_400_000);
  return (await getPrisma().feedbackItem.count({ where: { submittedById: playerId, createdAt: { gte: since } } })) >= POSTS_PER_DAY;
}

export async function addFeedback(input: FeedbackInput, author: { id: string; name: string }) {
  return getPrisma().feedbackItem.create({ data: { ...input, submittedById: author.id, submittedByName: author.name }, select: { id: true } });
}

export async function setVote(itemId: string, playerId: string, voting: boolean): Promise<{ ok: true; votes: number } | { ok: false; error: string }> {
  const db = getPrisma();
  if (!(await db.feedbackItem.findUnique({ where: { id: itemId }, select: { id: true } }))) return { ok: false, error: "That item is gone." };
  if (voting) await db.feedbackVote.upsert({ where: { itemId_playerId: { itemId, playerId } }, create: { itemId, playerId }, update: {} });
  else await db.feedbackVote.deleteMany({ where: { itemId, playerId } });
  return { ok: true, votes: await db.feedbackVote.count({ where: { itemId } }) };
}

export async function updateFeedback(id: string, update: OfficerUpdate, officer: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getPrisma();
  const row = await db.feedbackItem.findUnique({ where: { id }, select: { status: true } });
  if (!row) return { ok: false, error: "That item is gone." };
  await db.feedbackItem.update({
    where: { id },
    data: {
      ...(update.reply !== undefined ? { reply: update.reply } : {}),
      ...(update.status !== undefined ? { status: update.status, statusByName: officer, doneAt: update.status === "DONE" ? new Date() : null } : {}),
    },
  });
  return { ok: true };
}

export async function deleteFeedback(id: string): Promise<void> {
  await getPrisma().feedbackItem.deleteMany({ where: { id } });
}
