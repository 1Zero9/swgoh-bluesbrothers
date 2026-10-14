import { cleanText } from "@/lib/knowledge/validate";

/** Tips and ideas: the plain-words side of the knowledge base. Pure checks, no database. */

export const NOTE_KINDS = ["TIP", "IDEA"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const NOTE_KIND_LABELS: Record<NoteKind, string> = { TIP: "Tip", IDEA: "Idea" };

export const NOTE_TOPICS = ["Territory War", "Territory Battles", "Grand Arena", "Raids", "Farming", "Conquest", "Mods and datacrons", "The guild", "Something else"] as const;

export const TITLE_MAX = 100;
export const BODY_MAX = 1500;
export const HOW_KNOWN_MAX = 300;
export const TITLE_MIN = 4;
export const BODY_MIN = 10;

export type NoteInput = { kind: NoteKind; title: string; body: string; topic: string | null; howKnown: string | null };

export function isNoteKind(value: unknown): value is NoteKind {
  return typeof value === "string" && (NOTE_KINDS as readonly string[]).includes(value);
}

/** Checks what a member typed. Text is data: control characters out, lengths capped, topic limited to the list. */
export function validateNote(body: unknown): { ok: true; value: NoteInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Nothing to save." };
  const raw = body as Record<string, unknown>;
  if (!isNoteKind(raw.kind)) return { ok: false, error: "Choose whether this is a tip or an idea." };
  const title = cleanText(raw.title, TITLE_MAX);
  if (!title || title.length < TITLE_MIN) return { ok: false, error: "Give it a short title, at least a few words." };
  // Body keeps its line breaks; cleanText only tidies spaces and tabs.
  const text = cleanText(raw.body, BODY_MAX);
  if (!text || text.length < BODY_MIN) return { ok: false, error: "Say a little more. What should someone do, and why?" };
  const topic = typeof raw.topic === "string" && (NOTE_TOPICS as readonly string[]).includes(raw.topic) ? raw.topic : null;
  return { ok: true, value: { kind: raw.kind, title, body: text, topic, howKnown: cleanText(raw.howKnown, HOW_KNOWN_MAX) } };
}

/** Words a search should match against, lower-cased. */
export function noteMatches(note: { title: string; body: string; topic: string | null }, text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = `${note.title} ${note.body} ${note.topic ?? ""}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}
