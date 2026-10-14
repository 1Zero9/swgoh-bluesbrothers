import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanSources } from "./sources";

test("keeps web links, names them, and drops repeats", () => {
  const out = cleanSources([
    { sourceType: "url", url: "https://www.reddit.com/r/SWGalaxyOfHeroes/x", title: "Counter thread" },
    { sourceType: "url", url: "https://www.reddit.com/r/SWGalaxyOfHeroes/x", title: "Counter thread" },
    { sourceType: "url", url: "https://swgoh.gg/counters/" },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].host, "reddit.com");
  assert.equal(out[1].title, "swgoh.gg");
});

test("rejects non-web links, documents and junk, and caps the list", () => {
  assert.deepEqual(cleanSources([{ sourceType: "url", url: "javascript:alert(1)" }, { sourceType: "document", url: "https://a.com" }, { sourceType: "url", url: "not a url" }, { sourceType: "url" }]), []);
  const many = Array.from({ length: 9 }, (_, i) => ({ sourceType: "url", url: `https://site${i}.com/p` }));
  assert.equal(cleanSources(many).length, 5);
});
