import type { PlanetDefinition, PlanetId } from "../types";

export const PLANETS: Record<PlanetId, PlanetDefinition> = {
  tatooine: {
    id: "tatooine",
    name: "Tatooine",
    profile: "Jawa salvage economy",
    marketModifiers: { omega: 0.9, zeta: 0.96, kyrotech: 0.86, "stun-gun": 0.78, "corellian-ale": 1.06, coaxium: 1.02 },
  },
  coruscant: {
    id: "coruscant",
    name: "Coruscant",
    profile: "Stable metropolitan market",
    marketModifiers: { omega: 1.06, zeta: 1.09, kyrotech: 1.11, "stun-gun": 1.1, "corellian-ale": 1.08, coaxium: 1.06 },
  },
  cantonica: {
    id: "cantonica",
    name: "Cantonica",
    profile: "Volatile luxury economy",
    marketModifiers: { omega: 1.02, zeta: 1.06, kyrotech: 1.08, "stun-gun": 0.98, "corellian-ale": 1.22, coaxium: 1.12 },
  },
  corellia: {
    id: "corellia",
    name: "Corellia",
    profile: "Industrial transport economy",
    marketModifiers: { omega: 0.96, zeta: 1, kyrotech: 1.02, "stun-gun": 1.04, "corellian-ale": 0.78, coaxium: 0.82 },
  },
  kessel: {
    id: "kessel",
    name: "Kessel",
    profile: "High-risk contraband market",
    marketModifiers: { omega: 1.04, zeta: 1.08, kyrotech: 1.05, "stun-gun": 1.12, "corellian-ale": 0.94, coaxium: 1.22 },
  },
};

export const PLANET_IDS = Object.keys(PLANETS) as PlanetId[];
