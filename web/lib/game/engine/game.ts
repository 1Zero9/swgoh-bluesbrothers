import { CHARACTERS } from "../data/characters";
import { COMMODITIES, COMMODITY_IDS } from "../data/commodities";
import { PLANET_IDS } from "../data/planets";
import {
  ENGINE_VERSION,
  GameRuleError,
  type CharacterId,
  type CommodityId,
  type GameState,
  type InventoryItem,
  type PlanetId,
} from "../types";
import { getMarket } from "./economy";

export const STARTING_CREDITS = 18_000;
export const STARTING_DEBT = 1_000_000;
export const INTERIM_PAYMENT = 250_000;
export const INTERIM_PAYMENT_DAY = 15;
export const FINAL_DAY = 30;

function emptyInventory() {
  return Object.fromEntries(COMMODITY_IDS.map((id) => [id, { quantity: 0, averagePurchasePrice: 0 }])) as Record<CommodityId, InventoryItem>;
}

function assertActive(state: GameState) {
  if (state.status !== "active") throw new GameRuleError("RUN_COMPLETE", "This run has already ended.");
}

function assertInterimResolved(state: GameState) {
  if (state.interimPaymentStatus === "pending") {
    throw new GameRuleError("INTERIM_PAYMENT_REQUIRED", "Resolve Jabba's interim demand before taking another action.");
  }
}

function assertQuantity(quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new GameRuleError("INVALID_QUANTITY", "Quantity must be a positive whole number.");
  }
}

function updateHighestCredits(state: GameState, credits: number) {
  return Math.max(state.stats.highestCredits, credits);
}

export function createGame(seed: string, character: CharacterId, startingPlanet: PlanetId = "tatooine"): GameState {
  if (!seed.trim()) throw new Error("A non-empty seed is required.");

  return {
    engineVersion: ENGINE_VERSION,
    seed,
    character,
    day: 1,
    planetId: startingPlanet,
    credits: STARTING_CREDITS,
    jabbaDebt: STARTING_DEBT,
    interimPaymentStatus: "not-due",
    bountyLevel: 0,
    bountyHunterActive: false,
    cargoCapacity: CHARACTERS[character].cargoCapacity,
    inventory: emptyInventory(),
    visitedPlanets: [startingPlanet],
    stats: { totalTrades: 0, totalProfit: 0, largestTradeProfit: 0, hyperspaceJumps: 0, highestCredits: STARTING_CREDITS },
    status: "active",
  };
}

export function getUsedCargo(state: GameState) {
  return COMMODITY_IDS.reduce((total, commodityId) => total + state.inventory[commodityId].quantity * COMMODITIES[commodityId].cargoUnits, 0);
}

export function getNetWorth(state: GameState) {
  const market = getMarket(state.seed, state.day, state.planetId, state.character);
  const cargoValue = COMMODITY_IDS.reduce((total, commodityId) => total + state.inventory[commodityId].quantity * market[commodityId].sellPrice, 0);
  return state.credits + cargoValue;
}

export function buyCommodity(state: GameState, commodityId: CommodityId, quantity: number): GameState {
  assertActive(state);
  assertInterimResolved(state);
  assertQuantity(quantity);

  const quote = getMarket(state.seed, state.day, state.planetId, state.character)[commodityId];
  const cost = quote.buyPrice * quantity;
  if (cost > state.credits) throw new GameRuleError("INSUFFICIENT_CREDITS", "The Bluesmobile does not have enough Credits for that purchase.");

  const cargoRequired = COMMODITIES[commodityId].cargoUnits * quantity;
  if (getUsedCargo(state) + cargoRequired > state.cargoCapacity) {
    throw new GameRuleError("INSUFFICIENT_CARGO", "The Bluesmobile does not have enough cargo space.");
  }

  const current = state.inventory[commodityId];
  const nextQuantity = current.quantity + quantity;
  const averagePurchasePrice = Math.round(((current.quantity * current.averagePurchasePrice) + cost) / nextQuantity);
  const credits = state.credits - cost;

  return {
    ...state,
    credits,
    inventory: { ...state.inventory, [commodityId]: { quantity: nextQuantity, averagePurchasePrice } },
    stats: { ...state.stats, totalTrades: state.stats.totalTrades + 1 },
  };
}

export function sellCommodity(state: GameState, commodityId: CommodityId, quantity: number): GameState {
  assertActive(state);
  assertInterimResolved(state);
  assertQuantity(quantity);

  const current = state.inventory[commodityId];
  if (quantity > current.quantity) throw new GameRuleError("INSUFFICIENT_INVENTORY", "The Bluesmobile is not carrying that much cargo.");

  const quote = getMarket(state.seed, state.day, state.planetId, state.character)[commodityId];
  const proceeds = quote.sellPrice * quantity;
  const profit = (quote.sellPrice - current.averagePurchasePrice) * quantity;
  const credits = state.credits + proceeds;
  const remaining = current.quantity - quantity;

  return {
    ...state,
    credits,
    inventory: {
      ...state.inventory,
      [commodityId]: { quantity: remaining, averagePurchasePrice: remaining ? current.averagePurchasePrice : 0 },
    },
    stats: {
      ...state.stats,
      totalTrades: state.stats.totalTrades + 1,
      totalProfit: state.stats.totalProfit + profit,
      largestTradeProfit: Math.max(state.stats.largestTradeProfit, profit),
      highestCredits: updateHighestCredits(state, credits),
    },
  };
}

export function travel(state: GameState, destination: PlanetId): GameState {
  assertActive(state);
  assertInterimResolved(state);

  if (!PLANET_IDS.includes(destination) || destination === state.planetId) {
    throw new GameRuleError("INVALID_DESTINATION", "Choose a different known planet.");
  }

  if (state.day >= FINAL_DAY) {
    return { ...state, status: "lost", outcome: "Day 30 ended with Jabba's debt unpaid." };
  }

  const day = state.day + 1;
  return {
    ...state,
    day,
    planetId: destination,
    interimPaymentStatus: day === INTERIM_PAYMENT_DAY ? "pending" : state.interimPaymentStatus,
    visitedPlanets: state.visitedPlanets.includes(destination) ? state.visitedPlanets : [...state.visitedPlanets, destination],
    stats: { ...state.stats, hyperspaceJumps: state.stats.hyperspaceJumps + 1 },
  };
}

export function payInterimDemand(state: GameState): GameState {
  assertActive(state);
  if (state.interimPaymentStatus !== "pending") throw new GameRuleError("INTERIM_PAYMENT_NOT_DUE", "Jabba's interim payment is not currently due.");
  if (state.credits < INTERIM_PAYMENT) throw new GameRuleError("INSUFFICIENT_JABBA_PAYMENT", "You do not have the 250,000 Credits Jabba demanded.");

  return {
    ...state,
    credits: state.credits - INTERIM_PAYMENT,
    jabbaDebt: state.jabbaDebt - INTERIM_PAYMENT,
    interimPaymentStatus: "paid",
  };
}

export function missInterimDemand(state: GameState): GameState {
  assertActive(state);
  if (state.interimPaymentStatus !== "pending") throw new GameRuleError("INTERIM_PAYMENT_NOT_DUE", "Jabba's interim payment is not currently due.");

  return {
    ...state,
    interimPaymentStatus: "missed",
    bountyLevel: Math.max(1, state.bountyLevel),
    bountyHunterActive: true,
  };
}

export function payJabba(state: GameState): GameState {
  assertActive(state);
  if (state.credits < state.jabbaDebt) throw new GameRuleError("INSUFFICIENT_JABBA_PAYMENT", "You do not have enough liquid Credits to settle Jabba's debt.");

  return {
    ...state,
    credits: state.credits - state.jabbaDebt,
    jabbaDebt: 0,
    status: "won",
    outcome: `The orphanage was saved on Day ${state.day}.`,
  };
}
