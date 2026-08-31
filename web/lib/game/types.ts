export const ENGINE_VERSION = "1.0.0";

export type CharacterId = "jake" | "elwood";
export type PlanetId = "tatooine" | "coruscant" | "cantonica" | "corellia" | "kessel";
export type CommodityId = "omega" | "zeta" | "kyrotech" | "stun-gun" | "corellian-ale" | "coaxium";
export type RunStatus = "active" | "won" | "lost";
export type InterimPaymentStatus = "not-due" | "pending" | "paid" | "missed";

export type CharacterDefinition = {
  id: CharacterId;
  name: string;
  ability: string;
  cargoCapacity: number;
  buyMultiplier: number;
  sellMultiplier: number;
};

export type CommodityDefinition = {
  id: CommodityId;
  name: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  cargoUnits: number;
};

export type PlanetDefinition = {
  id: PlanetId;
  name: string;
  profile: string;
  marketModifiers: Record<CommodityId, number>;
};

export type InventoryItem = {
  quantity: number;
  averagePurchasePrice: number;
};

export type RunStats = {
  totalTrades: number;
  totalProfit: number;
  largestTradeProfit: number;
  hyperspaceJumps: number;
  highestCredits: number;
};

export type GameState = {
  engineVersion: string;
  seed: string;
  character: CharacterId;
  day: number;
  planetId: PlanetId;
  credits: number;
  jabbaDebt: number;
  interimPaymentStatus: InterimPaymentStatus;
  bountyLevel: number;
  bountyHunterActive: boolean;
  cargoCapacity: number;
  inventory: Record<CommodityId, InventoryItem>;
  visitedPlanets: PlanetId[];
  stats: RunStats;
  status: RunStatus;
  outcome?: string;
};

export type MarketQuote = {
  commodityId: CommodityId;
  marketPrice: number;
  buyPrice: number;
  sellPrice: number;
};

export type Market = Record<CommodityId, MarketQuote>;

export type RuleErrorCode =
  | "INVALID_QUANTITY"
  | "INSUFFICIENT_CREDITS"
  | "INSUFFICIENT_CARGO"
  | "INSUFFICIENT_INVENTORY"
  | "INVALID_DESTINATION"
  | "INTERIM_PAYMENT_REQUIRED"
  | "INTERIM_PAYMENT_NOT_DUE"
  | "INSUFFICIENT_JABBA_PAYMENT"
  | "RUN_COMPLETE";

export class GameRuleError extends Error {
  constructor(public readonly code: RuleErrorCode, message: string) {
    super(message);
    this.name = "GameRuleError";
  }
}
