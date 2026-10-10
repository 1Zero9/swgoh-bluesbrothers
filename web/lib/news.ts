/** Star Wars headlines from Google News' public RSS search. Headlines and links only, with the outlet named. */

export type NewsItem = { title: string; link: string; source: string; publishedAt: Date | null; game: boolean };

const FEED = "https://news.google.com/rss/search";
const GENERAL_QUERY = '"Star Wars" when:7d';
const GAME_QUERY = '"Galaxy of Heroes" (SWGOH OR "Star Wars") when:60d';
/** Google matches loosely, so only headlines that actually name the game count as game news. */
const GAME_TITLE = /galaxy of heroes|swgoh/i;

function feedUrl(query: string) {
  return `${FEED}?${new URLSearchParams({ q: query, hl: "en-GB", gl: "GB", ceid: "GB:en" }).toString()}`;
}

function decode(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1]) : "";
}

/** Reads RSS `<item>`s. Google appends " - Outlet" to titles, which is moved into `source`. */
export function parseNewsFeed(xml: string, game: boolean): NewsItem[] {
  const items: NewsItem[] = [];
  for (const block of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    let title = tag(block, "title");
    const link = tag(block, "link");
    const source = tag(block, "source");
    if (!title || !link.startsWith("https://")) continue;
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim();
    const published = new Date(tag(block, "pubDate"));
    items.push({ title, link, source: source || "News", publishedAt: Number.isNaN(published.getTime()) ? null : published, game });
  }
  return items;
}

function key(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60);
}

/** Newest first, one story per headline, game news first. */
export function curateNews(general: NewsItem[], game: NewsItem[], limit: number): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  const byDate = (a: NewsItem, b: NewsItem) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
  const onTopic = game.filter((item) => GAME_TITLE.test(item.title));
  for (const item of [...[...onTopic].sort(byDate).slice(0, 2), ...general]) {
    const k = key(item.title);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

async function fetchFeed(query: string, game: boolean, revalidateSeconds: number): Promise<NewsItem[]> {
  try {
    const response = await fetch(feedUrl(query), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BluesBrothersGuildBot/1.0)" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: revalidateSeconds },
    });
    if (!response.ok) return [];
    return parseNewsFeed(await response.text(), game);
  } catch {
    return [];
  }
}

/** Headlines for the site and the weekly Discord post. Returns an empty list if the feed is unavailable. */
export async function getStarWarsNews(limit = 5, revalidateSeconds = 3600): Promise<NewsItem[]> {
  const [general, game] = await Promise.all([
    fetchFeed(GENERAL_QUERY, false, revalidateSeconds),
    fetchFeed(GAME_QUERY, true, revalidateSeconds),
  ]);
  return curateNews(general, game, limit);
}
