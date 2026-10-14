import assert from "node:assert/strict";
import { test } from "node:test";
import { freshness, isCurrentlyUsable, nextStatus, REFRESH_AFTER_DAYS } from "./lifecycle";
import { mayAutoPublish } from "./permissions";
import { searchMatchups, type MatchupRow } from "./search";
import { checkSquad, variantKey, type KbMember } from "./squad";
import { cleanUrl, validateSubmission } from "./validate";
import { planImport } from "./import-plan";

const UNITS = new Set(["LORDVADER", "MAUL", "ROYALGUARD", "SNOWTROOPER", "DEATHTROOPER", "BOBAFETT", "BOSSK", "CADBANE", "GREEDO", "DENGAR", "JABBATHEHUTT", "PIRATEKINGHONDO"]);
const NOW = Date.parse("2026-10-14T12:00:00Z");
const day = 86_400_000;

const squad = (ids: string[]): KbMember[] => ids.map((unitId, i) => ({ unitId, role: i === 0 ? "LEADER" : "CORE" }));
const vader5 = squad(["LORDVADER", "MAUL", "ROYALGUARD", "SNOWTROOPER", "DEATHTROOPER"]);
const hunters5 = squad(["BOBAFETT", "BOSSK", "CADBANE", "GREEDO", "DENGAR"]);
const base = { strategy: "Open with the leader's special.", evidence: [{ type: "COMMUNITY_REPORT", sourceProvider: "forum post", sourceUrl: "https://example.com/t/1" }] };
const submission = (over: object = {}) => ({ mode: "TW", defender: { members: vader5 }, attacker: { members: hunters5 }, ...base, ...over });

// ── squad shape per mode ───────────────────────────────────────────────────────────────
test("5v5 and Territory War need five units, 3v3 needs three, and they are kept apart", () => {
  assert.equal(checkSquad(vader5, "GAC_5V5", UNITS, "defending").ok, true);
  assert.equal(checkSquad(vader5, "TW", UNITS, "defending").ok, true);
  assert.equal(checkSquad(vader5, "GAC_3V3", UNITS, "defending").ok, false);
  assert.equal(checkSquad(vader5.slice(0, 3), "GAC_3V3", UNITS, "defending").ok, true);
  assert.equal(checkSquad(vader5.slice(0, 3), "TW", UNITS, "defending").ok, false);
});

test("a squad needs one leader, real units, no repeats, and alternatives only on optional slots", () => {
  assert.equal(checkSquad([...vader5.slice(0, 4), { unitId: "NOTAUNIT", role: "CORE" }], "TW", UNITS, "attacking").ok, false);
  assert.equal(checkSquad([...vader5.slice(0, 4), { unitId: "MAUL", role: "CORE" }], "TW", UNITS, "attacking").ok, false);
  assert.equal(checkSquad(vader5.map((m) => ({ ...m, role: "CORE" as const })), "TW", UNITS, "attacking").ok, false);
  assert.equal(checkSquad([...vader5.slice(0, 4), { unitId: "DEATHTROOPER", role: "CORE", alternatives: ["BOSSK"] }], "TW", UNITS, "attacking").ok, false);
  const optional = checkSquad([...vader5.slice(0, 4), { unitId: "DEATHTROOPER", role: "OPTIONAL", alternatives: ["BOSSK", "NOTAUNIT"] }], "TW", UNITS, "attacking");
  assert.ok(optional.ok && optional.members[4].alternatives?.join() === "BOSSK");
});

test("fleets: a capital ship plus up to five starting ships and reinforcements", () => {
  const fleet = (n: number, role: KbMember["role"]): KbMember[] => [{ unitId: "LORDVADER", role: "LEADER" }, ...["MAUL", "ROYALGUARD", "SNOWTROOPER", "DEATHTROOPER", "BOBAFETT", "BOSSK"].slice(0, n).map((unitId) => ({ unitId, role }))];
  assert.equal(checkSquad(fleet(4, "STARTING"), "TW_FLEET", UNITS, "defending").ok, true);
  assert.equal(checkSquad(fleet(6, "STARTING"), "TW_FLEET", UNITS, "defending").ok, false); // seven starting ships
  assert.equal(checkSquad(fleet(6, "REINFORCEMENT"), "GAC_FLEET", UNITS, "defending").ok, true);
});

// ── identity ───────────────────────────────────────────────────────────────────────────
test("the same squad typed in any order is one variant; a different unit is another", () => {
  const shuffled = [vader5[0], vader5[4], vader5[2], vader5[1], vader5[3]];
  assert.equal(variantKey("SQUAD", vader5), variantKey("SQUAD", shuffled));
  assert.notEqual(variantKey("SQUAD", vader5), variantKey("SQUAD", [...vader5.slice(0, 4), { unitId: "BOSSK", role: "CORE" }]));
  assert.notEqual(variantKey("SQUAD", vader5), variantKey("FLEET", vader5));
});

// ── validation ─────────────────────────────────────────────────────────────────────────
test("a good submission is cleaned; unknown battle numbers stay null, never zero", () => {
  const result = validateSubmission(submission(), "MEMBER", UNITS);
  assert.ok(result.ok);
  const evidence = result.value.evidence[0];
  assert.equal(evidence.battles, null);
  assert.equal(evidence.wins, null);
  assert.equal(evidence.banners, null);
  assert.equal(result.value.oneShot, null);
});

test("battle counts must be consistent, and are tied to their own sample", () => {
  const ev = (extra: object) => submission({ evidence: [{ type: "COMMUNITY_REPORT", sourceProvider: "x", ...extra }] });
  assert.equal(validateSubmission(ev({ battles: 10, wins: 11 }), "MEMBER", UNITS).ok, false);
  assert.equal(validateSubmission(ev({ battles: 10, wins: 6, losses: 5 }), "MEMBER", UNITS).ok, false);
  assert.equal(validateSubmission(ev({ battles: -1 }), "MEMBER", UNITS).ok, false);
  assert.equal(validateSubmission(ev({ battles: 10, wins: 6, losses: 4 }), "MEMBER", UNITS).ok, true);
});

test("only an import may claim aggregated stats; B-Lue3 needs a web source and files reports or theory only", () => {
  const aggregated = submission({ evidence: [{ type: "AGGREGATED", sourceProvider: "x", battles: 500, wins: 300 }] });
  assert.equal(validateSubmission(aggregated, "MEMBER", UNITS).ok, false);
  assert.equal(validateSubmission(aggregated, "IMPORT", UNITS).ok, true);
  assert.equal(validateSubmission(submission({ evidence: [] }), "BLUE", UNITS).ok, false);
  assert.equal(validateSubmission(submission({ evidence: [{ type: "COMMUNITY_REPORT", sourceProvider: "forum" }] }), "BLUE", UNITS).ok, false); // no link
  assert.equal(validateSubmission(submission({ evidence: [{ type: "DEMONSTRATION", sourceProvider: "v", sourceUrl: "https://x.com/v" }] }), "BLUE", UNITS).ok, false);
  assert.equal(validateSubmission(submission(), "BLUE", UNITS).ok, true);
});

test("links must be web links; control characters are stripped; the mode is required", () => {
  assert.equal(cleanUrl("javascript:alert(1)"), null);
  assert.equal(cleanUrl("data:text/html,x"), null);
  assert.ok(cleanUrl("https://swgoh.gg/x"));
  const result = validateSubmission(submission({ strategy: "Hit\u0007 hard\u0000" }), "MEMBER", UNITS);
  assert.ok(result.ok && result.value.strategy === "Hit hard");
  assert.equal(validateSubmission({ ...submission(), mode: "ARENA" }, "MEMBER", UNITS).ok, false);
});

test("a Datacron-dependent counter keeps its end date; a bad date is refused", () => {
  const ok = validateSubmission(submission({ datacron: { dependent: true, expiresAt: "2026-11-01" } }), "MEMBER", UNITS);
  assert.ok(ok.ok && ok.value.datacronDependent && ok.value.datacronExpiresAt?.toISOString().startsWith("2026-11-01"));
  assert.equal(validateSubmission(submission({ datacron: { dependent: true, expiresAt: "soon" } }), "MEMBER", UNITS).ok, false);
});

// ── lifecycle, datacron expiry, staleness ───────────────────────────────────────────────
test("review moves are limited, and rejected or outdated records go back to the queue first", () => {
  assert.equal(nextStatus("CANDIDATE", "PUBLISH"), "PUBLISHED");
  assert.equal(nextStatus("CANDIDATE", "OUTDATE"), null);
  assert.equal(nextStatus("REJECTED", "PUBLISH"), null);
  assert.equal(nextStatus("REJECTED", "RESTORE"), "CANDIDATE");
  assert.equal(nextStatus("PUBLISHED", "DISPUTE"), "DISPUTED");
  assert.equal(nextStatus("DISPUTED", "PUBLISH"), "PUBLISHED");
});

test("an expired Datacron makes a counter unusable; an unknown expiry is flagged, not hidden", () => {
  const live = { status: "PUBLISHED", datacronDependent: true, datacronExpiresAt: new Date(NOW + day) };
  const dead = { ...live, datacronExpiresAt: new Date(NOW - day) };
  const unknown = { ...live, datacronExpiresAt: null };
  assert.equal(isCurrentlyUsable(live, NOW), true);
  assert.equal(isCurrentlyUsable(dead, NOW), false);
  assert.equal(isCurrentlyUsable(unknown, NOW), true);
  assert.equal(isCurrentlyUsable({ ...live, status: "OUTDATED" }, NOW), false);
  const when = { reviewedAt: null, createdAt: new Date(NOW) };
  assert.equal(freshness({ ...dead, ...when }, NOW).datacronExpired, true);
  assert.equal(freshness({ ...unknown, ...when }, NOW).datacronUnknownExpiry, true);
});

test("a published counter that has not been looked at for a long time needs a refresh", () => {
  const old = { datacronDependent: false, datacronExpiresAt: null, reviewedAt: new Date(NOW - (REFRESH_AFTER_DAYS + 1) * day), createdAt: new Date(NOW - 400 * day) };
  assert.equal(freshness(old, NOW).needsRefresh, true);
  assert.equal(freshness({ ...old, reviewedAt: new Date(NOW - day) }, NOW).needsRefresh, false);
});

// ── permissions ────────────────────────────────────────────────────────────────────────
test("members and B-Lue3 can never auto-publish; imports only from a trusted source with a big enough sample", () => {
  const big = [{ type: "AGGREGATED", battles: 500 }];
  assert.equal(mayAutoPublish("MEMBER", "src", big, ["src"]), false);
  assert.equal(mayAutoPublish("BLUE", "src", big, ["src"]), false);
  assert.equal(mayAutoPublish("IMPORT", "other", big, ["src"]), false);
  assert.equal(mayAutoPublish("IMPORT", "src", [{ type: "AGGREGATED", battles: 5 }], ["src"]), false);
  assert.equal(mayAutoPublish("IMPORT", "src", [{ type: "COMMUNITY_REPORT", battles: null }], ["src"]), false);
  assert.equal(mayAutoPublish("IMPORT", "src", big, ["src"]), true);
  assert.equal(mayAutoPublish("IMPORT", "src", big), false); // nothing is trusted by default
});

// ── retrieval respects mode, exact variant and Datacron ────────────────────────────────
const view = (ids: string[], name = "Lord Vader") => ({ teamName: name, aliases: [], leaderUnitId: ids[0], memberIds: ids, variantKey: variantKey("SQUAD", squad(ids)) });
const row = (id: string, over: Partial<MatchupRow> = {}): MatchupRow => ({
  id, status: "PUBLISHED", mode: "TW", defender: view(vader5.map((m) => m.unitId)), attacker: view(hunters5.map((m) => m.unitId), "Bounty Hunters"),
  datacronDependent: false, datacronExpiresAt: null, reviewedAt: new Date(NOW - day), createdAt: new Date(NOW - 2 * day), ...over,
});
const nameOf = (id: string) => id;

test("search never mixes modes, and shows only published records to members", () => {
  const rows = [row("tw"), row("gac5", { mode: "GAC_5V5" }), row("gac3", { mode: "GAC_3V3" }), row("cand", { status: "CANDIDATE" })];
  assert.deepEqual(searchMatchups(rows, { mode: "TW", defenderUnitId: "LORDVADER" }, nameOf, NOW).map((h) => h.id), ["tw"]);
  assert.deepEqual(searchMatchups(rows, { mode: "GAC_3V3" }, nameOf, NOW).map((h) => h.id), ["gac3"]);
  assert.equal(searchMatchups(rows, {}, nameOf, NOW).length, 3);
  assert.equal(searchMatchups(rows, { includeUnpublished: true }, nameOf, NOW).length, 4);
});

test("an exact variant matches only that squad; the leader matches the whole family", () => {
  const variantB = view(["LORDVADER", "MAUL", "ROYALGUARD", "SNOWTROOPER", "BOSSK"]);
  const rows = [row("a"), row("b", { defender: variantB })];
  assert.deepEqual(searchMatchups(rows, { defenderVariantKey: variantB.variantKey }, nameOf, NOW).map((h) => h.id), ["b"]);
  assert.equal(searchMatchups(rows, { defenderUnitId: "LORDVADER" }, nameOf, NOW).length, 2);
  assert.equal(searchMatchups(rows, { defenderVariantKey: variantB.variantKey }, nameOf, NOW)[0].match, "EXACT");
});

test("a counter with an expired Datacron is hidden for B-Lue3 and sorted last in the list", () => {
  const rows = [row("dead", { datacronDependent: true, datacronExpiresAt: new Date(NOW - day) }), row("fine")];
  assert.deepEqual(searchMatchups(rows, { usableOnly: true }, nameOf, NOW).map((h) => h.id), ["fine"]);
  assert.deepEqual(searchMatchups(rows, {}, nameOf, NOW).map((h) => h.id), ["fine", "dead"]);
  assert.equal(searchMatchups(rows, {}, nameOf, NOW)[1].usable, false);
});

test("text search finds teams by name, alias or unit", () => {
  const withAlias = row("x", { defender: { ...view(vader5.map((m) => m.unitId)), aliases: ["Zader"] } });
  assert.equal(searchMatchups([withAlias], { text: "zader" }, nameOf, NOW).length, 1);
  assert.equal(searchMatchups([withAlias], { text: "bounty hunters" }, nameOf, NOW).length, 1);
  assert.equal(searchMatchups([withAlias], { text: "jabba" }, nameOf, NOW).length, 0);
});

// ── imports are repeatable ─────────────────────────────────────────────────────────────
test("an import plan creates new records, updates known ones, and skips bad ones, so a re-run changes nothing", () => {
  const items = [
    { importKey: "src:1", body: submission() },
    { importKey: "src:2", body: submission({ mode: "GAC_5V5" }) },
    { importKey: "src:3", body: submission({ strategy: "" }) },
    { importKey: "src:1", body: submission() },
  ];
  const first = planImport(items, new Set(), UNITS);
  assert.deepEqual(first.summary, { create: 2, update: 0, invalid: 1, duplicateInFile: 1 });
  const second = planImport(items, new Set(["src:1", "src:2"]), UNITS);
  assert.deepEqual(second.summary, { create: 0, update: 2, invalid: 1, duplicateInFile: 1 });
});

// ── "I need a counter" calls for help ──────────────────────────────────────────────────
import { callToArmsMessage, defang, validateRequest } from "./requests";

test("a call for help needs a mode and a real leader; the note is optional", () => {
  assert.equal(validateRequest({ mode: "TW", leaderUnitId: "LORDVADER" }, UNITS).ok, true);
  assert.equal(validateRequest({ mode: "TW", leaderUnitId: "NOTAUNIT" }, UNITS).ok, false);
  assert.equal(validateRequest({ mode: "ARENA", leaderUnitId: "LORDVADER" }, UNITS).ok, false);
  const withNote = validateRequest({ mode: "GAC_3V3", leaderUnitId: "LORDVADER", note: "  hard to beat \u0000 " }, UNITS);
  assert.ok(withNote.ok && withNote.value.note === "hard to beat");
});

test("the Discord post cannot ping anyone or carry links from member text", () => {
  const post = callToArmsMessage({ mode: "TW", leaderName: "Lord Vader", note: "@everyone <@123> click https://evil.example now", requester: "@here Bob", link: "https://site.example/knowledge" });
  const text = `${post.title}\n${post.description}`;
  assert.ok(!/@everyone|@here/.test(text.replace(/@​/g, "")) === true || !/@(everyone|here)/.test(text));
  assert.ok(!text.includes("<@123>"));
  assert.ok(!text.includes("evil.example"));
  assert.ok(text.includes("https://site.example/knowledge"));
  assert.ok(text.includes("Territory War"));
  assert.ok(post.description.length <= 1800);
  assert.equal(defang("a@b"), "a@​b");
});

// ── web research: nothing invented gets in ─────────────────────────────────────────────
import { foundHosts, sourceWasFound, toSquad } from "../blue/research";

test("a quoted source must be on a site the search really found", () => {
  const hosts = foundHosts([
    { title: "reddit.com", url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc", host: "vertexaisearch.cloud.google.com" },
    { title: "Guide to counters", url: "https://swgoh.gg/counters/x", host: "swgoh.gg" },
  ]);
  assert.ok(sourceWasFound("https://www.reddit.com/r/SWGalaxyOfHeroes/comments/1", hosts));
  assert.ok(sourceWasFound("https://old.reddit.com/r/x", hosts));
  assert.ok(sourceWasFound("https://swgoh.gg/anything", hosts));
  assert.equal(sourceWasFound("https://made-up-site.example/counter", hosts), false);
  assert.equal(sourceWasFound("https://notreddit.com/x", hosts), false);
  assert.equal(sourceWasFound("not a url", hosts), false);
  assert.equal(hosts.has("vertexaisearch.cloud.google.com"), false); // the redirect host proves nothing
});

test("research squads: real units only, leader first", () => {
  const ok = toSquad(["Lord Vader", "Darth Maul"]);
  assert.ok(ok.ok && ok.members[0].role === "LEADER" && ok.members[1].role === "CORE");
  const bad = toSquad(["Lord Vader", "Definitely Not A Unit"]);
  assert.ok(!bad.ok && bad.unknown === "Definitely Not A Unit");
});
