/** The floating announcement on Home: its shape, the starting words, and the checks on what an officer types. */

export type Announcement = {
  enabled: boolean;
  label: string;
  title: string;
  text: string;
  cta: string;
  /** A page on this site ("/chat") or a full https:// link. */
  href: string;
  quote: string;
  /** How long it stays before it fades away on its own. */
  seconds: number;
  /** Goes up on every save, so a changed announcement shows again to everyone. */
  version: number;
};

export const CURRENT_ID = "current";
export const MIN_SECONDS = 5;
export const MAX_SECONDS = 120;

/** Off until an officer switches it on, so nothing floats over Home before they are ready. */
export const DEFAULT_ANNOUNCEMENT: Announcement = {
  enabled: false,
  label: "Announcement",
  title: "We're getting the band back together!",
  text: "Every member, every squad, one mission. Say hello in Guild chat and tell us what you're farming this week.",
  cta: "Hit it!",
  href: "/chat",
  quote: "“It’s 106 miles to Chicago, we’ve got a full tank of gas…”",
  seconds: 20,
  version: 1,
};

const LIMITS = { label: 40, title: 90, text: 300, cta: 24, href: 300, quote: 160 } as const;

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Only a page on this site, or an https link. Anything else (javascript:, data:, //other.site) is refused. */
export function safeHref(value: string): string | null {
  if (/^\/(?![/\\])[^\s]*$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export type AnnouncementInput = Omit<Announcement, "version">;

/** Check what an officer sent. Returns the cleaned announcement, or a plain-words reason it cannot be saved. */
export function checkAnnouncement(input: unknown): { ok: true; value: AnnouncementInput } | { ok: false; error: string } {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const label = clean(data.label, LIMITS.label);
  const title = clean(data.title, LIMITS.title);
  const text = clean(data.text, LIMITS.text);
  const cta = clean(data.cta, LIMITS.cta);
  const quote = clean(data.quote, LIMITS.quote);
  const href = safeHref(clean(data.href, LIMITS.href));
  const seconds = Math.round(Number(data.seconds));
  if (title.length < 3) return { ok: false, error: "Give it a headline of at least 3 characters." };
  if (!cta) return { ok: false, error: "The button needs a few words, like “Hit it!”." };
  if (!href) return { ok: false, error: "The button link must be a page on this site (like /chat) or a full https:// link." };
  if (!Number.isFinite(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS) return { ok: false, error: `Time on screen must be between ${MIN_SECONDS} and ${MAX_SECONDS} seconds.` };
  return { ok: true, value: { enabled: data.enabled !== false, label: label || "Announcement", title, text, cta, href, quote, seconds } };
}
