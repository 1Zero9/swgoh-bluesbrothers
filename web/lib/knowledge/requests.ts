import { isMode, MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import { cleanText } from "@/lib/knowledge/validate";

/** How many calls for help one member can make in a day. */
export const REQUESTS_PER_DAY = 3;

export type RequestInput = { mode: KbMode; leaderUnitId: string; note: string | null };

/** Checks a call for help: a mode, the enemy squad's leader (a real unit) and an optional short note. */
export function validateRequest(body: unknown, knownUnits: ReadonlySet<string>): { ok: true; value: RequestInput } | { ok: false; error: string } {
  const input = body as { mode?: unknown; leaderUnitId?: unknown; note?: unknown } | null;
  if (!input || typeof input !== "object") return { ok: false, error: "Nothing was submitted." };
  if (!isMode(input.mode)) return { ok: false, error: "Pick where you need the counter: Territory War or Grand Arena." };
  const leaderUnitId = typeof input.leaderUnitId === "string" ? input.leaderUnitId : "";
  if (!knownUnits.has(leaderUnitId)) return { ok: false, error: "Pick the enemy squad's leader from the list." };
  return { ok: true, value: { mode: input.mode, leaderUnitId, note: cleanText(input.note, 300) } };
}

/** Plain text for a Discord embed from a member's words: no pings, links or mention syntax can slip through. */
export function defang(text: string): string {
  return text.replace(/@/g, "@​").replace(/<[^>]*>/g, "").replace(/https?:\/\/\S+/gi, "[link removed]");
}

/** The Discord post for a call for help. It never pings anyone, and member text is cleaned first. */
export function callToArmsMessage(args: { mode: KbMode; leaderName: string; note: string | null; requester: string; link: string }): { title: string; description: string } {
  const lines = [
    `**${defang(args.requester)}** needs a counter for **${defang(args.leaderName)}** in **${MODE_LABELS[args.mode]}**.`,
    args.note ? `> ${defang(args.note)}` : "",
    "Know one that works? Add it, or tap **I use this** on a counter that already does.",
    args.link,
  ].filter(Boolean);
  return { title: `Help wanted: counter for ${defang(args.leaderName)}`, description: lines.join("\n\n").slice(0, 1800) };
}
