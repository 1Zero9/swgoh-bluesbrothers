import { test } from "node:test";
import assert from "node:assert/strict";
import { curateNews, parseNewsFeed } from "./news";

const xml = `<?xml version="1.0"?><rss><channel><title>Google News</title>
<item><title>Lightsaber from &apos;I am your father&apos; duel up for auction - The Guardian</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Fri, 09 Oct 2026 17:04:00 GMT</pubDate><source url="https://www.theguardian.com">The Guardian</source></item>
<item><title>Galaxy of Heroes adds a new legend &amp; more - Polygon</title><link>https://news.google.com/rss/articles/def</link><pubDate>Thu, 08 Oct 2026 10:00:00 GMT</pubDate><source url="https://polygon.com">Polygon</source></item>
<item><title>Broken item with no link</title><link></link></item>
</channel></rss>`;

test("headlines are parsed, decoded and credited to the outlet", () => {
  const items = parseNewsFeed(xml, false);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Lightsaber from 'I am your father' duel up for auction");
  assert.equal(items[0].source, "The Guardian");
  assert.equal(items[1].title, "Galaxy of Heroes adds a new legend & more");
  assert.equal(items[0].publishedAt?.toISOString(), "2026-10-09T17:04:00.000Z");
});

test("curation puts game news first, drops duplicates and respects the limit", () => {
  const general = parseNewsFeed(xml, false);
  const game = parseNewsFeed(xml, true).slice(1); // the Polygon story, flagged as game news
  const out = curateNews(general, game, 5);
  assert.deepEqual(out.map((i) => i.source), ["Polygon", "The Guardian"]);
  assert.equal(out[0].game, true);
  assert.equal(curateNews(general, game, 1).length, 1);
});

test("an empty or broken feed gives no items", () => {
  assert.deepEqual(parseNewsFeed("<html>nope</html>", false), []);
});

test("headlines that don't name the game aren't treated as game news", () => {
  const general = parseNewsFeed(xml, false);
  const loose = parseNewsFeed(xml, true).slice(0, 1); // the Guardian story, not about the game
  const out = curateNews(general, loose, 5);
  assert.equal(out.every((item) => !item.game || /galaxy of heroes|swgoh/i.test(item.title)), true);
  // The off-topic story is still shown, but as ordinary news and after nothing was promoted ahead of it.
  assert.equal(out.length, 2);
});
