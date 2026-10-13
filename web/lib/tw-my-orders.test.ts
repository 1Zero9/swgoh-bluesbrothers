import assert from "node:assert/strict";
import test from "node:test";
import { buildMyOrders } from "./tw-my-orders";

const plan = {
  zonePlans: [{ id: "zp1", zoneId: 2, note: "Hold the line", command: null }],
  assignments: [
    { zonePlanId: "zp1", playerId: "me", squadKey: "SOMETHING_UNKNOWN", status: "ASSIGNED" },
    { zonePlanId: "zp1", playerId: "me", squadKey: "X", status: "SUGGESTED" },
    { zonePlanId: "zp1", playerId: "other", squadKey: "X", status: "ASSIGNED" },
  ],
  attackAssignments: [
    { zoneLabel: "Zone 3", enemySquad: "Lord Vader", assignedPlayerId: "me", status: "ASSIGNED", note: null },
    { zoneLabel: "Zone 4", enemySquad: "Rey", assignedPlayerId: "other", status: "ASSIGNED", note: null },
    { zoneLabel: "Zone 5", enemySquad: "Reva", assignedPlayerId: "me", status: "UNASSIGNED", note: null },
  ],
};

test("only this member's real orders come back", () => {
  const orders = buildMyOrders(plan, "me");
  assert.equal(orders.defence.length, 1);
  assert.equal(orders.defence[0].zone, "Zone 2 (Bottom Front)");
  assert.equal(orders.defence[0].note, "Hold the line");
  assert.deepEqual(orders.attack.map((a) => a.enemySquad), ["Lord Vader"]);
});

test("a member with no orders gets empty lists", () => {
  assert.deepEqual(buildMyOrders(plan, "nobody"), { defence: [], attack: [] });
});
