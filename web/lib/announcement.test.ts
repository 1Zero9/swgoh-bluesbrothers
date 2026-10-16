import assert from "node:assert/strict";
import test from "node:test";
import { checkAnnouncement, DEFAULT_ANNOUNCEMENT, safeHref } from "./announcement";

test("links: site pages and https are fine, everything else is refused", () => {
  assert.equal(safeHref("/chat"), "/chat");
  assert.equal(safeHref("/knowledge?tab=tips"), "/knowledge?tab=tips");
  assert.equal(safeHref("https://discord.gg/abc"), "https://discord.gg/abc");
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("//evil.example"), null);
  assert.equal(safeHref("/\\evil.example"), null);
  assert.equal(safeHref("http://plain.example"), null);
  assert.equal(safeHref("chat"), null);
});

test("the starting announcement passes its own checks", () => {
  const { version, ...input } = DEFAULT_ANNOUNCEMENT;
  assert.ok(version >= 1);
  assert.equal(checkAnnouncement(input).ok, true);
});

test("an edit is tidied and checked", () => {
  const result = checkAnnouncement({ title: "  Raid   tonight  ", text: "Be there", cta: "Go", href: "/raids", quote: "", seconds: "30", enabled: false, label: "" });
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.value.title, "Raid tonight");
    assert.equal(result.value.seconds, 30);
    assert.equal(result.value.enabled, false);
    assert.equal(result.value.label, "Announcement");
  }
});

test("bad edits say what is wrong", () => {
  assert.equal(checkAnnouncement({ title: "Hi", cta: "Go", href: "/x", seconds: 20 }).ok, false);
  assert.equal(checkAnnouncement({ title: "Raid tonight", cta: "", href: "/x", seconds: 20 }).ok, false);
  assert.equal(checkAnnouncement({ title: "Raid tonight", cta: "Go", href: "javascript:x", seconds: 20 }).ok, false);
  assert.equal(checkAnnouncement({ title: "Raid tonight", cta: "Go", href: "/x", seconds: 2 }).ok, false);
  assert.equal(checkAnnouncement({ title: "Raid tonight", cta: "Go", href: "/x", seconds: 9999 }).ok, false);
  assert.equal(checkAnnouncement(null).ok, false);
});
