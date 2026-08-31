import { COMMODITY_IDS } from "../data/commodities";
import { ENCOUNTERS } from "../data/encounters";
import { PLANETS } from "../data/planets";
import type { Encounter, EncounterResult, GameState, NewsItem } from "../types";
import { getUsedCargo } from "./game";
import { deterministicFloat } from "./rng";

function roll(state: GameState, stream: string) {
  return deterministicFloat(state.seed, stream, state.day, state.planetId);
}

function adjustCredits(state: GameState, delta: number): GameState {
  const credits = Math.max(0, state.credits + delta);
  return { ...state, credits, stats: { ...state.stats, highestCredits: Math.max(state.stats.highestCredits, credits) } };
}

function loseCargo(state: GameState): GameState {
  const carried = COMMODITY_IDS.filter((id) => state.inventory[id].quantity > 0);
  if (!carried.length) return adjustCredits(state, -3_000);
  const id = carried[Math.floor(roll(state, "cargo-loss") * carried.length)];
  return { ...state, inventory: { ...state.inventory, [id]: { ...state.inventory[id], quantity: Math.max(0, state.inventory[id].quantity - 1) } } };
}

export function getDailyNews(state: GameState): NewsItem[] {
  const commodity = COMMODITY_IDS[Math.floor(roll(state, "news-commodity") * COMMODITY_IDS.length)];
  const otherPlanetIds = Object.keys(PLANETS).filter((id) => id !== state.planetId) as GameState["planetId"][];
  const planet = PLANETS[otherPlanetIds[Math.floor(roll(state, "news-planet") * otherPlanetIds.length)]];
  const commodityName = commodity === "corellian-ale" ? "Corellian Ale" : commodity.replaceAll("-", " ");
  const direction = roll(state, "news-direction") > 0.5;
  const items: NewsItem[] = [
    { id: `market-${state.day}`, tone: direction ? "up" : "down", headline: `${commodityName.toUpperCase()} ${direction ? "DEMAND RISING" : "SURPLUS REPORTED"}` },
    { id: `planet-${state.day}`, tone: "alert", headline: `IMPERIAL PATROLS INCREASE NEAR ${planet.name.toUpperCase()}` },
  ];
  if (state.bountyHunterActive || state.bountyLevel > 0) items.push({ id: `boba-${state.day}`, tone: "alert", headline: `BOBA FETT LAST SEEN NEAR ${planet.name.toUpperCase()}` });
  else items.push({ id: `signal-${state.day}`, tone: "signal", headline: "CANTINA BAND SEEKS TWO MEN IN BLACK" });
  return items;
}

export function getTravelEncounter(state: GameState): Encounter | null {
  const chance = state.bountyHunterActive ? 0.78 : 0.58;
  if (roll(state, "encounter-trigger") > chance) return null;
  if (state.bountyHunterActive && roll(state, "boba-priority") < 0.46) return ENCOUNTERS[0];
  const pool = state.bountyHunterActive ? ENCOUNTERS : ENCOUNTERS.slice(1);
  return pool[Math.floor(roll(state, "encounter-pick") * pool.length)];
}

export function resolveEncounter(state: GameState, encounter: Encounter, choiceId: string): EncounterResult {
  const lucky = roll(state, `${encounter.id}:${choiceId}`) > 0.43;
  let next = state;
  let message = "You keep moving.";
  let tone: EncounterResult["tone"] = "neutral";

  const spend = (amount: number, success: string) => {
    if (next.credits < amount) { next = loseCargo(next); message = "You are short on Credits. They take cargo instead."; tone = "bad"; return; }
    next = adjustCredits(next, -amount); message = success; tone = "neutral";
  };

  switch (choiceId) {
    case "pay-bounty": spend(12_000, "Boba accepts the transfer. For now."); next = { ...next, bountyLevel: Math.max(0, next.bountyLevel - 1), bountyHunterActive: next.bountyLevel > 1 }; break;
    case "punch-it": next = lucky ? next : loseCargo(next); message = lucky ? "The Bluesmobile leaves Slave I staring at starlight." : "You escape, but a cargo crate does not."; tone = lucky ? "good" : "bad"; break;
    case "bribe": spend(6_000, "The officer discovers an urgent appointment elsewhere."); break;
    case "bluff": next = lucky ? adjustCredits(next, 2_000) : loseCargo(next); message = lucky ? "The suits work. Customs waves you through — with a fuel voucher." : "Customs is unimpressed and seizes a crate."; tone = lucky ? "good" : "bad"; break;
    case "buy-crate": if (next.credits >= 5_000 && getUsedCargo(next) + 5 <= next.cargoCapacity) { next = adjustCredits(next, -5_000); next = { ...next, inventory: { ...next.inventory, omega: { quantity: next.inventory.omega.quantity + 5, averagePurchasePrice: 1_000 } } }; message = "Five Omega Materials loaded."; tone = "good"; } else { message = "No room or not enough Credits. The Jawas leave."; tone = "bad"; } break;
    case "walk-away": case "decline": case "back-door": case "leave-case": message = "You avoid the distraction and protect the mission."; break;
    case "take-hit": spend(5_000, "The Bluesmobile takes the hit. The cargo stays secure."); break;
    case "swerve": case "mall-route": case "elwood-fix": case "trust-droid": case "bridge": next = lucky || (choiceId === "elwood-fix" && state.character === "elwood") ? adjustCredits(next, 4_000) : loseCargo(next); message = lucky ? "Against the odds, the plan works beautifully." : "The plan works in the broadest possible sense. Something valuable is gone."; tone = lucky ? "good" : "bad"; break;
    case "roadblock": spend(4_000, "The roadblock is now modern art. Repairs are less inspiring."); break;
    case "repair": spend(7_500, "The hyperdrive purrs again."); break;
    case "join-band": next = adjustCredits(next, 8_000); message = "Three songs, two encores and 8,000 Credits in the case."; tone = "good"; break;
    case "help-rebels": { const id = COMMODITY_IDS.find((commodityId) => next.inventory[commodityId].quantity > 0); if (id) { next = { ...adjustCredits(next, 12_000), inventory: { ...next.inventory, [id]: { ...next.inventory[id], quantity: next.inventory[id].quantity - 1 } } }; message = "Delivery complete. The Rebellion pays 12,000 Credits."; tone = "good"; } else { message = "The cargo hold is empty. No deal."; tone = "bad"; } break; }
    case "pay-protection": spend(5_000, "The Nikto crew suddenly remembers you are protected."); break;
    case "refuse": next = { ...next, bountyLevel: Math.min(5, next.bountyLevel + 1), bountyHunterActive: true }; message = "You keep the Credits. Jabba adds your name to another list."; tone = "bad"; break;
    case "take-case": next = lucky ? adjustCredits(next, 20_000) : adjustCredits(next, -8_000); message = lucky ? "Twenty thousand clean enough Credits. Mostly." : "It was a trap. The escape costs 8,000 Credits."; tone = lucky ? "good" : "bad"; break;
    case "recalculate": spend(2_500, "Fresh charts loaded. Chicago remains unlocated."); break;
    case "detour": spend(3_000, "The detour is dull, safe and worth every Credit."); break;
  }
  return { state: next, title: encounter.title, message, tone };
}
