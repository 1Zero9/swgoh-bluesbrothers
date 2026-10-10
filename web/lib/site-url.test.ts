import { test } from "node:test";
import assert from "node:assert/strict";
import { siteUrl } from "./site-url";

test("a trailing slash in SITE_URL never produces a double slash", () => {
  const original = process.env.SITE_URL;
  try {
    process.env.SITE_URL = "https://example.test/";
    assert.equal(`${siteUrl()}/wins`, "https://example.test/wins");
    process.env.SITE_URL = "https://example.test///";
    assert.equal(siteUrl(), "https://example.test");
    delete process.env.SITE_URL;
    assert.match(siteUrl(), /^https:\/\/[^/]+$/);
  } finally {
    if (original === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = original;
  }
});
