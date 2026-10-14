import assert from "node:assert/strict";
import test from "node:test";
import { HUB_SECTIONS, sectionFor } from "./hub-nav";

test("each page belongs to one hub section", () => {
  assert.equal(sectionFor("/"), "home");
  assert.equal(sectionFor("/ask"), "ask");
  assert.equal(sectionFor("/knowledge"), "know");
  assert.equal(sectionFor("/knowledge/review"), "know");
  assert.equal(sectionFor("/counters"), "know");
  assert.equal(sectionFor("/territory-war"), "guild");
  assert.equal(sectionFor("/members"), "guild");
  assert.equal(sectionFor("/me"), "more");
  assert.equal(sectionFor("/dougies-discs"), "more");
  assert.equal(sectionFor("/officer/roster"), "more");
});

test("anchors and queries do not change the section", () => {
  assert.equal(sectionFor("/members#who-has"), "guild");
  assert.equal(sectionFor("/me?blue=farm#ask-blue"), "more");
});

test("similar prefixes do not match by accident", () => {
  assert.equal(sectionFor("/askew"), null);
  assert.equal(sectionFor("/membership"), null);
});

test("five sections, each reachable from its own link", () => {
  assert.equal(HUB_SECTIONS.length, 5);
  for (const section of HUB_SECTIONS) assert.equal(sectionFor(section.href), section.key);
});

import { activeSidebarHref, SIDEBAR_GROUPS } from "./hub-nav";

test("the sidebar lights the most specific link", () => {
  assert.equal(activeSidebarHref("/knowledge"), "/knowledge");
  assert.equal(activeSidebarHref("/knowledge/tips"), "/knowledge/tips");
  assert.equal(activeSidebarHref("/knowledge/review"), "/knowledge/review");
  assert.equal(activeSidebarHref("/members"), "/members");
  assert.equal(activeSidebarHref("/"), "/");
  assert.equal(activeSidebarHref("/nowhere"), null);
});

test("every sidebar page belongs to a hub section so the phone tabs agree", () => {
  for (const link of SIDEBAR_GROUPS.flatMap((group) => group.links)) {
    assert.notEqual(sectionFor(link.href), null, link.href);
  }
});
