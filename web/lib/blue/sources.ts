export type AnswerSource = { title: string; url: string; host: string };

const MAX_SOURCES = 5;

/** Web pages B-Lue3 used, cleaned for display: http(s) links only, no repeats, a readable name each. */
export function cleanSources(raw: { sourceType?: string; url?: string; title?: string }[]): AnswerSource[] {
  const seen = new Set<string>();
  const out: AnswerSource[] = [];
  for (const item of raw) {
    if (item.sourceType !== "url" || !item.url) continue;
    let parsed: URL;
    try { parsed = new URL(item.url); } catch { continue; }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    if (seen.has(parsed.href)) continue;
    seen.add(parsed.href);
    const host = parsed.hostname.replace(/^www\./, "");
    out.push({ title: (item.title ?? "").trim().slice(0, 80) || host, url: parsed.href, host });
    if (out.length === MAX_SOURCES) break;
  }
  return out;
}
