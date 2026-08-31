import assert from "node:assert/strict";
import test from "node:test";
import {
  buyCommodity,
  createGame,
  GameRuleError,
  getMarket,
  getDailyNews,
  getTravelEncounter,
  getNetWorth,
  getUsedCargo,
  missInterimDemand,
  payInterimDemand,
  payJabba,
  sellCommodity,
  travel,
  resolveEncounter,
} from "./index";
import { simulateBatch, simulateRun } from "./simulation";

function expectRuleError(action: () => unknown, code: GameRuleError["code"]) {
  assert.throws(action, (error) => error instanceof GameRuleError && error.code === code);
}

test("market generation is deterministic and separated by day and planet", () => {
  const first = getMarket("same-seed", 4, "corellia", "jake");
  assert.deepEqual(first, getMarket("same-seed", 4, "corellia", "jake"));
  assert.notDeepEqual(first, getMarket("same-seed", 5, "corellia", "jake"));
  assert.notDeepEqual(first, getMarket("same-seed", 4, "kessel", "jake"));
});

test("daily news and travel encounters are deterministic", () => {
  const state = travel(createGame("news-and-events", "jake"), "corellia");
  assert.deepEqual(getDailyNews(state), getDailyNews(state));
  assert.deepEqual(getTravelEncounter(state), getTravelEncounter(state));
  assert.equal(getDailyNews(state).length, 3);
});

test("encounter choices produce deterministic bounded results", () => {
  const state = { ...createGame("boba", "jake"), bountyLevel: 2, bountyHunterActive: true };
  const encounter = { id: "boba-chase", title: "Boba", description: "", category: "bounty" as const, choices: [] };
  const first = resolveEncounter(state, encounter, "pay-bounty");
  assert.deepEqual(first, resolveEncounter(state, encounter, "pay-bounty"));
  assert.equal(first.state.credits, 6_000);
  assert.equal(first.state.bountyLevel, 1);
  assert.ok(first.state.credits >= 0);
});

test("Jake sells higher while Elwood starts with more cargo", () => {
  const jake = createGame("characters", "jake");
  const elwood = createGame("characters", "elwood");
  const jakeMarket = getMarket(jake.seed, jake.day, jake.planetId, jake.character);
  const elwoodMarket = getMarket(elwood.seed, elwood.day, elwood.planetId, elwood.character);

  assert.equal(jake.cargoCapacity, 100);
  assert.equal(elwood.cargoCapacity, 110);
  assert.ok(jakeMarket.omega.sellPrice > elwoodMarket.omega.sellPrice);
  assert.ok(elwoodMarket.omega.buyPrice > jakeMarket.omega.buyPrice);
});

test("buying and selling updates integer Credits, cargo, inventory averages and profit", () => {
  const initial = createGame("trade", "jake");
  const market = getMarket(initial.seed, initial.day, initial.planetId, initial.character);
  const bought = buyCommodity(initial, "omega", 2);

  assert.equal(bought.credits, initial.credits - market.omega.buyPrice * 2);
  assert.equal(bought.inventory.omega.quantity, 2);
  assert.equal(bought.inventory.omega.averagePurchasePrice, market.omega.buyPrice);
  assert.equal(getUsedCargo(bought), 2);
  assert.ok(Number.isSafeInteger(bought.credits));

  const sold = sellCommodity(bought, "omega", 1);
  assert.equal(sold.inventory.omega.quantity, 1);
  assert.equal(sold.stats.totalTrades, 2);
  assert.equal(sold.stats.totalProfit, market.omega.sellPrice - market.omega.buyPrice);
  assert.equal(getNetWorth(sold), sold.credits + sold.inventory.omega.quantity * market.omega.sellPrice);
});

test("invalid trades cannot create negative Credits, cargo or inventory", () => {
  const state = createGame("invalid", "jake");
  expectRuleError(() => buyCommodity(state, "zeta", 0), "INVALID_QUANTITY");
  expectRuleError(() => buyCommodity(state, "zeta", 10_000), "INSUFFICIENT_CREDITS");
  expectRuleError(() => buyCommodity({ ...state, credits: 1_000_000 }, "corellian-ale", 101), "INSUFFICIENT_CARGO");
  expectRuleError(() => sellCommodity(state, "coaxium", 1), "INSUFFICIENT_INVENTORY");
});

test("travel advances exactly one day, tracks planets and rejects invalid destinations", () => {
  const state = createGame("travel", "elwood");
  const travelled = travel(state, "corellia");
  assert.equal(travelled.day, 2);
  assert.equal(travelled.planetId, "corellia");
  assert.deepEqual(travelled.visitedPlanets, ["tatooine", "corellia"]);
  assert.equal(travelled.stats.hyperspaceJumps, 1);
  expectRuleError(() => travel(travelled, "corellia"), "INVALID_DESTINATION");
});

test("Day 15 blocks normal actions until Jabba's interim demand is resolved", () => {
  let state = createGame("jabba-day-15", "jake");
  for (let day = 1; day < 15; day += 1) {
    state = travel(state, state.planetId === "tatooine" ? "corellia" : "tatooine");
  }

  assert.equal(state.day, 15);
  assert.equal(state.interimPaymentStatus, "pending");
  expectRuleError(() => travel(state, "kessel"), "INTERIM_PAYMENT_REQUIRED");
  expectRuleError(() => buyCommodity(state, "omega", 1), "INTERIM_PAYMENT_REQUIRED");

  const missed = missInterimDemand(state);
  assert.equal(missed.interimPaymentStatus, "missed");
  assert.equal(missed.bountyHunterActive, true);
  assert.equal(missed.bountyLevel, 1);
  assert.equal(travel(missed, "kessel").day, 16);
});

test("paying the interim demand deducts cash and debt exactly once", () => {
  let state = createGame("interim-payment", "jake");
  state = { ...state, day: 15, credits: 300_000, interimPaymentStatus: "pending" };
  const paid = payInterimDemand(state);

  assert.equal(paid.credits, 50_000);
  assert.equal(paid.jabbaDebt, 750_000);
  assert.equal(paid.interimPaymentStatus, "paid");
  expectRuleError(() => payInterimDemand(paid), "INTERIM_PAYMENT_NOT_DUE");
});

test("only liquid Credits can pay Jabba and payment ends the run", () => {
  const state = createGame("final-payment", "jake");
  expectRuleError(() => payJabba({ ...state, credits: 999_999 }), "INSUFFICIENT_JABBA_PAYMENT");

  const won = payJabba({ ...state, credits: 1_150_000 });
  assert.equal(won.status, "won");
  assert.equal(won.jabbaDebt, 0);
  assert.equal(won.credits, 150_000);
  expectRuleError(() => travel(won, "corellia"), "RUN_COMPLETE");
});

test("travelling after Day 30 closes an unpaid run without advancing beyond Day 30", () => {
  const state = { ...createGame("deadline", "jake"), day: 30 };
  const lost = travel(state, "corellia");
  assert.equal(lost.day, 30);
  assert.equal(lost.status, "lost");
});

test("simulation agents are reproducible and establish a useful balance ordering", () => {
  assert.deepEqual(simulateRun("repeatable", "optimised"), simulateRun("repeatable", "optimised"));

  const random = simulateBatch("random", 200);
  const conservative = simulateBatch("conservative", 200);
  const optimised = simulateBatch("optimised", 200);

  assert.ok(random.winRate < conservative.winRate);
  assert.ok(conservative.winRate < optimised.winRate);
  assert.ok(random.winRate <= 0.2);
  assert.ok(optimised.winRate >= 0.5);
});
