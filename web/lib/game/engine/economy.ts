import { CHARACTERS } from "../data/characters";
import { COMMODITIES, COMMODITY_IDS } from "../data/commodities";
import { PLANETS } from "../data/planets";
import type { CharacterId, Market, PlanetId } from "../types";
import { deterministicFloat } from "./rng";

export const MARKET_BUY_MARKUP = 1.04;
export const MARKET_SELL_MARKDOWN = 0.96;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getMarket(seed: string, day: number, planetId: PlanetId, characterId: CharacterId): Market {
  const character = CHARACTERS[characterId];
  const planet = PLANETS[planetId];

  return Object.fromEntries(COMMODITY_IDS.map((commodityId) => {
    const commodity = COMMODITIES[commodityId];
    const randomFactor = 1 + ((deterministicFloat(seed, "market", day, planetId, commodityId) * 2) - 1) * commodity.volatility;
    const rawPrice = commodity.basePrice * planet.marketModifiers[commodityId] * randomFactor;
    const marketPrice = Math.round(clamp(rawPrice, commodity.minPrice, commodity.maxPrice));

    return [commodityId, {
      commodityId,
      marketPrice,
      buyPrice: Math.max(1, Math.round(marketPrice * MARKET_BUY_MARKUP * character.buyMultiplier)),
      sellPrice: Math.max(1, Math.round(marketPrice * MARKET_SELL_MARKDOWN * character.sellMultiplier)),
    }];
  })) as Market;
}
