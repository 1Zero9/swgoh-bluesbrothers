import assert from "node:assert/strict";
import test from "node:test";
import { deviceFrom, geoFrom, placeLabel, summariseUse, type VisitRow } from "./visits";

const headers = (map: Record<string, string>) => ({ get: (name: string) => map[name] ?? null });

test("the place is read from the host's headers, city level only", () => {
  const geo = geoFrom(headers({ "x-vercel-ip-country": "us", "x-vercel-ip-country-region": "tx", "x-vercel-ip-city": "San%20Antonio" }));
  assert.deepEqual(geo, { country: "US", region: "TX", city: "San Antonio" });
  assert.equal(placeLabel(geo), "San Antonio, TX, US");
  assert.deepEqual(geoFrom(headers({})), { country: null, region: null, city: null });
  assert.equal(placeLabel({ country: "GB", region: "ENG", city: "Leeds" }), "Leeds, GB");
});

test("devices are told apart", () => {
  assert.equal(deviceFrom("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "mobile");
  assert.equal(deviceFrom("Mozilla/5.0 (iPad; CPU OS 17_0)"), "tablet");
  assert.equal(deviceFrom("Mozilla/5.0 (Macintosh; Intel Mac OS X)"), "desktop");
});

test("who uses it, who has gone quiet, who never came, and where", () => {
  const now = Date.UTC(2026, 9, 17);
  const day = 86_400_000;
  const row = (playerId: string, name: string, ago: number, country: string, region: string | null, city: string): VisitRow => ({ playerId, playerName: name, at: new Date(now - ago * day), country, region, city, device: "mobile" });
  const visits = [row("a", "Dex", 1, "US", "TX", "Austin"), row("a", "Dex", 3, "US", "TX", "Austin"), row("b", "Igor", 30, "GB", null, "Leeds"), row("c", "Sam", 2, "US", "TX", "Dallas")];
  const roster = [{ playerId: "a", name: "Dex" }, { playerId: "b", name: "Igor" }, { playerId: "c", name: "Sam" }, { playerId: "d", name: "Zed" }];
  const s = summariseUse(visits, roster, now);
  assert.deepEqual(s.active.map((m) => m.name), ["Dex", "Sam"]);
  assert.deepEqual(s.quiet.map((m) => m.name), ["Igor"]);
  assert.deepEqual(s.never.map((m) => m.name), ["Zed"]);
  assert.deepEqual(s.countries, [{ country: "US", members: 2 }, { country: "GB", members: 1 }]);
  assert.deepEqual(s.usStates, [{ region: "TX", members: 2 }]);
  assert.equal(s.active[0].place, "Austin, TX, US");
});
