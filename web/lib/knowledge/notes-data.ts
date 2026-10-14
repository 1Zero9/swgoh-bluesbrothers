import { nextStatus, type KbAction } from "@/lib/knowledge/lifecycle";
import { noteMatches, type NoteInput } from "@/lib/knowledge/notes";
import { getPrisma } from "@/lib/prisma";

/** Database side of tips and ideas. Rules about wording live in notes.ts; who may do what is decided by the routes. */

export type NoteListing = {
  id: string;
  kind: string;
  title: string;
  body: string;
  topic: string | null;
  howKnown: string | null;
  status: string;
  authorName: string;
  createdAt: Date;
  helpfulCount: number;
  helpedByMe: boolean;
  mine: boolean;
};

type Row = {
  id: string; kind: string; title: string; body: string; topic: string | null; howKnown: string | null; status: string;
  submittedById: string | null; submittedByName: string; createdAt: Date; helpful: { playerId: string }[];
};

function toListing(row: Row, viewerPlayerId: string | null): NoteListing {
  return {
    id: row.id, kind: row.kind, title: row.title, body: row.body, topic: row.topic, howKnown: row.howKnown, status: row.status,
    authorName: row.submittedByName, createdAt: row.createdAt,
    helpfulCount: row.helpful.length,
    helpedByMe: viewerPlayerId !== null && row.helpful.some((mark) => mark.playerId === viewerPlayerId),
    mine: viewerPlayerId !== null && row.submittedById === viewerPlayerId,
  };
}

const include = { helpful: { select: { playerId: true } } } as const;

export async function submitNote(input: NoteInput, author: { via: "MEMBER" | "OFFICER"; who: string; whoId: string | null }) {
  const row = await getPrisma().kbNote.create({
    data: { ...input, via: author.via, submittedById: author.whoId, submittedByName: author.who, status: "CANDIDATE" },
    select: { id: true },
  });
  return { id: row.id };
}

export async function countRecentNotes(playerId: string, hours = 24) {
  return getPrisma().kbNote.count({ where: { submittedById: playerId, createdAt: { gte: new Date(Date.now() - hours * 3_600_000) } } });
}

/** Published notes, newest first, optionally one kind and a text search. Also the member's own pending notes, so they can see them. */
export async function listNotes(query: { kind?: string; text?: string }, viewerPlayerId: string | null): Promise<NoteListing[]> {
  const rows = (await getPrisma().kbNote.findMany({
    where: {
      ...(query.kind ? { kind: query.kind } : {}),
      OR: [{ status: "PUBLISHED" }, ...(viewerPlayerId ? [{ status: "CANDIDATE", submittedById: viewerPlayerId }] : [])],
    },
    include,
    orderBy: { createdAt: "desc" },
    take: 200,
  })) as Row[];
  return rows.filter((row) => noteMatches(row, query.text ?? "")).map((row) => toListing(row, viewerPlayerId));
}

export async function noteReviewQueue(): Promise<NoteListing[]> {
  const rows = (await getPrisma().kbNote.findMany({ where: { status: "CANDIDATE" }, include, orderBy: { createdAt: "asc" }, take: 200 })) as Row[];
  return rows.map((row) => toListing(row, null));
}

export async function countNotesAwaitingReview() {
  return getPrisma().kbNote.count({ where: { status: "CANDIDATE" } });
}

export type NoteReviewResult = { ok: true; status: string } | { ok: false; error: string };

/** An officer's decision on a note. Only moves the counter lifecycle allows (publish or reject a candidate, outdate a published one, restore). */
export async function reviewNote(id: string, action: KbAction, actor: string, note: string | null): Promise<NoteReviewResult> {
  const db = getPrisma();
  const row = await db.kbNote.findUnique({ where: { id }, select: { status: true } });
  if (!row) return { ok: false, error: "That note is gone." };
  const to = nextStatus(row.status as Parameters<typeof nextStatus>[0], action);
  if (!to || to === "DISPUTED") return { ok: false, error: "That isn't possible for a note in this state." };
  await db.kbNote.update({ where: { id }, data: { status: to, reviewedByName: actor, reviewedAt: new Date(), reviewNote: note } });
  return { ok: true, status: to };
}

/** "This helped me": one mark per member on a published note. */
export async function setHelpful(noteId: string, playerId: string, on: boolean): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const db = getPrisma();
  const row = await db.kbNote.findUnique({ where: { id: noteId }, select: { status: true } });
  if (!row || row.status !== "PUBLISHED") return { ok: false, error: "You can only mark a published note." };
  if (on) await db.kbNoteHelpful.upsert({ where: { noteId_playerId: { noteId, playerId } }, create: { noteId, playerId }, update: {} });
  else await db.kbNoteHelpful.deleteMany({ where: { noteId, playerId } });
  return { ok: true, count: await db.kbNoteHelpful.count({ where: { noteId } }) };
}

/** What B-Lue3 may quote: published notes only, matching the words asked about. */
export async function findNotesForBlue(text: string, limit = 5) {
  const rows = (await getPrisma().kbNote.findMany({ where: { status: "PUBLISHED" }, include, orderBy: { createdAt: "desc" }, take: 200 })) as Row[];
  return rows
    .filter((row) => noteMatches(row, text))
    .sort((a, b) => b.helpful.length - a.helpful.length)
    .slice(0, limit)
    .map((row) => ({ kind: row.kind, title: row.title, body: row.body, topic: row.topic, from: row.submittedByName, helpedCount: row.helpful.length }));
}
