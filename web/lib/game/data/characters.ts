import type { CharacterDefinition, CharacterId } from "../types";

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  jake: {
    id: "jake",
    name: "Jake Blues",
    ability: "We're Putting the Band Back Together",
    cargoCapacity: 100,
    buyMultiplier: 1,
    sellMultiplier: 1.05,
  },
  elwood: {
    id: "elwood",
    name: "Elwood Blues",
    ability: "It's Got a Cop Motor",
    cargoCapacity: 110,
    buyMultiplier: 1.03,
    sellMultiplier: 0.98,
  },
};
