export const PROBLEMS = {
  white: "A white or blank screen",
  password: "Discord asks for a password I don't know",
  wrong: "It signed me in as the wrong Discord account",
  other: "Something else",
} as const;
export type Problem = keyof typeof PROBLEMS;

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

export type HelpInput = { name: string; contact: string | null; problem: Problem; note: string | null };

/** "Help me, Obi-Wan" form check. A hidden `website` field catches bots. */
export function validateHelp(body: unknown): { ok: true; value: HelpInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Something went wrong. Please try again." };
  const b = body as Record<string, unknown>;
  if (clean(b.website, 20)) return { ok: false, error: "Something went wrong. Please try again." };
  const name = clean(b.name, 60);
  if (name.length < 2) return { ok: false, error: "Please tell us your in-game name so we can find you." };
  const problem = typeof b.problem === "string" && b.problem in PROBLEMS ? (b.problem as Problem) : "other";
  return { ok: true, value: { name, contact: clean(b.contact, 80) || null, problem, note: clean(b.note, 300) || null } };
}
