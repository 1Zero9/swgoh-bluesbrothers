import type { CommodityDefinition, CommodityId } from "../types";

export const COMMODITIES: Record<CommodityId, CommodityDefinition> = {
  omega: { id: "omega", name: "Omega Materials", basePrice: 1_650, minPrice: 500, maxPrice: 3_000, volatility: 0.28, cargoUnits: 1 },
  zeta: { id: "zeta", name: "Zeta Materials", basePrice: 8_200, minPrice: 3_000, maxPrice: 15_000, volatility: 0.34, cargoUnits: 1 },
  kyrotech: { id: "kyrotech", name: "Kyrotech Shock Prods", basePrice: 6_200, minPrice: 2_000, maxPrice: 12_000, volatility: 0.42, cargoUnits: 1 },
  "stun-gun": { id: "stun-gun", name: "Mk 12 Armatek Stun Guns", basePrice: 7_200, minPrice: 1_500, maxPrice: 18_000, volatility: 0.62, cargoUnits: 1 },
  "corellian-ale": { id: "corellian-ale", name: "Corellian Ale", basePrice: 620, minPrice: 100, maxPrice: 1_500, volatility: 0.48, cargoUnits: 1 },
  coaxium: { id: "coaxium", name: "Coaxium", basePrice: 6_000, minPrice: 1_000, maxPrice: 14_000, volatility: 0.55, cargoUnits: 1 },
};

export const COMMODITY_IDS = Object.keys(COMMODITIES) as CommodityId[];
