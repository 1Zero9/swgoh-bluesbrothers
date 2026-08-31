import { COMMODITIES, COMMODITY_IDS } from "./data/commodities";
import { PLANETS, PLANET_IDS } from "./data/planets";
import { getMarket } from "./engine/economy";
import {
  buyCommodity,
  createGame,
  FINAL_DAY,
  getUsedCargo,
  missInterimDemand,
  payInterimDemand,
  payJabba,
  sellCommodity,
  travel,
} from "./engine/game";
import { deterministicFloat, deterministicInteger } from "./engine/rng";
import type { CharacterId, CommodityId, GameState, PlanetId } from "./types";

export type SimulationAgent = "random" | "conservative" | "optimised";

export type SimulationResult = {
  agent: SimulationAgent;
  won: boolean;
  finalCredits: number;
  day: number;
  totalProfit: number;
  largestTradeProfit: number;
};

function maximumAffordableQuantity(state: GameState, commodityId: CommodityId) {
  const quote = getMarket(state.seed, state.day, state.planetId, state.character)[commodityId];
  const byCredits = Math.floor(state.credits / quote.buyPrice);
  const availableCargo = state.cargoCapacity - getUsedCargo(state);
  const byCargo = Math.floor(availableCargo / COMMODITIES[commodityId].cargoUnits);
  return Math.max(0, Math.min(byCredits, byCargo));
}

function sellAll(state: GameState, commodityId: CommodityId) {
  const quantity = state.inventory[commodityId].quantity;
  return quantity > 0 ? sellCommodity(state, commodityId, quantity) : state;
}

function resolveInterim(state: GameState) {
  if (state.interimPaymentStatus !== "pending") return state;
  return state.credits >= 250_000 ? payInterimDemand(state) : missInterimDemand(state);
}

function chooseRandomDestination(state: GameState) {
  const destinations = PLANET_IDS.filter((planetId) => planetId !== state.planetId);
  return destinations[deterministicInteger(state.seed, "sim-random-destination", 0, destinations.length - 1, state.day)]!;
}

function chooseConservativeDestination(state: GameState): PlanetId {
  const carried = COMMODITY_IDS
    .filter((commodityId) => state.inventory[commodityId].quantity > 0)
    .sort((a, b) => state.inventory[b].quantity - state.inventory[a].quantity)[0];

  if (carried) {
    return PLANET_IDS
      .filter((planetId) => planetId !== state.planetId)
      .sort((a, b) => PLANETS[b].marketModifiers[carried] - PLANETS[a].marketModifiers[carried])[0]!;
  }

  const index = PLANET_IDS.indexOf(state.planetId);
  return PLANET_IDS[(index + 1) % PLANET_IDS.length]!;
}

function getOptimisedOpportunity(state: GameState) {
  const nextDay = Math.min(FINAL_DAY, state.day + 1);
  const current = getMarket(state.seed, state.day, state.planetId, state.character);
  let best: { commodityId: CommodityId; destination: PlanetId; returnRatio: number } | null = null;

  for (const destination of PLANET_IDS) {
    if (destination === state.planetId) continue;
    const destinationMarket = getMarket(state.seed, nextDay, destination, state.character);
    for (const commodityId of COMMODITY_IDS) {
      const returnRatio = destinationMarket[commodityId].sellPrice / current[commodityId].buyPrice;
      if (!best || returnRatio > best.returnRatio) best = { commodityId, destination, returnRatio };
    }
  }

  return best!;
}

function takeRandomTurn(state: GameState) {
  let next = state;
  const market = getMarket(next.seed, next.day, next.planetId, next.character);

  for (const commodityId of COMMODITY_IDS) {
    if (next.inventory[commodityId].quantity > 0 && deterministicFloat(next.seed, "sim-random-sell", next.day, commodityId) > 0.58) {
      next = sellAll(next, commodityId);
    }
  }

  const commodityId = COMMODITY_IDS[deterministicInteger(next.seed, "sim-random-buy", 0, COMMODITY_IDS.length - 1, next.day)]!;
  const maximum = maximumAffordableQuantity(next, commodityId);
  if (maximum > 0) {
    const quantity = Math.max(1, Math.floor(maximum * (0.25 + deterministicFloat(next.seed, "sim-random-quantity", next.day, market[commodityId].buyPrice) * 0.5)));
    next = buyCommodity(next, commodityId, quantity);
  }

  return { state: next, destination: chooseRandomDestination(next) };
}

function takeConservativeTurn(state: GameState) {
  let next = state;
  const market = getMarket(next.seed, next.day, next.planetId, next.character);

  for (const commodityId of COMMODITY_IDS) {
    const item = next.inventory[commodityId];
    if (item.quantity > 0 && (market[commodityId].sellPrice >= item.averagePurchasePrice * 1.4 || next.day === FINAL_DAY)) {
      next = sellAll(next, commodityId);
    }
  }

  const candidate = COMMODITY_IDS
    .map((commodityId) => ({ commodityId, discount: market[commodityId].buyPrice / COMMODITIES[commodityId].basePrice }))
    .sort((a, b) => a.discount - b.discount)[0]!;
  const reserve = next.day >= 12 && next.day < 15
    ? Math.min(250_000, Math.max(0, next.credits - 100_000))
    : 0;
  const spendableState = { ...next, credits: Math.max(0, next.credits - reserve) };
  const maximum = candidate.discount <= 0.72 ? maximumAffordableQuantity(spendableState, candidate.commodityId) : 0;
  if (next.day < FINAL_DAY && maximum > 0) {
    next = buyCommodity(next, candidate.commodityId, Math.max(1, Math.floor(maximum * 0.42)));
  }

  return { state: next, destination: chooseConservativeDestination(next) };
}

function takeOptimisedTurn(state: GameState) {
  let next = state;
  for (const commodityId of COMMODITY_IDS) next = sellAll(next, commodityId);

  const opportunity = getOptimisedOpportunity(next);
  const reserve = next.day >= 12 && next.day < 15
    ? Math.min(250_000, Math.max(0, next.credits - 100_000))
    : 0;
  const spendableState = { ...next, credits: Math.max(0, next.credits - reserve) };
  const maximum = opportunity.returnRatio >= 1.12 ? maximumAffordableQuantity(spendableState, opportunity.commodityId) : 0;
  if (next.day < FINAL_DAY && maximum > 0) next = buyCommodity(next, opportunity.commodityId, maximum);

  return { state: next, destination: opportunity.destination };
}

export function simulateRun(seed: string, agent: SimulationAgent, character: CharacterId = "jake"): SimulationResult {
  let state = createGame(seed, character);

  while (state.status === "active") {
    state = resolveInterim(state);

    const turn = agent === "random"
      ? takeRandomTurn(state)
      : agent === "conservative"
        ? takeConservativeTurn(state)
        : takeOptimisedTurn(state);
    state = turn.state;

    if (state.credits >= state.jabbaDebt) {
      state = payJabba(state);
      break;
    }

    state = travel(state, turn.destination);
  }

  return {
    agent,
    won: state.status === "won",
    finalCredits: state.credits,
    day: state.day,
    totalProfit: state.stats.totalProfit,
    largestTradeProfit: state.stats.largestTradeProfit,
  };
}

export function simulateBatch(agent: SimulationAgent, runs: number, character: CharacterId = "jake") {
  if (!Number.isSafeInteger(runs) || runs <= 0) throw new Error("Simulation run count must be a positive integer.");
  const results = Array.from({ length: runs }, (_, index) => simulateRun(`balance-${index + 1}`, agent, character));
  const wins = results.filter((result) => result.won).length;
  return {
    agent,
    runs,
    wins,
    winRate: wins / runs,
    averageFinalCredits: Math.round(results.reduce((total, result) => total + result.finalCredits, 0) / runs),
    averageProfit: Math.round(results.reduce((total, result) => total + result.totalProfit, 0) / runs),
  };
}
