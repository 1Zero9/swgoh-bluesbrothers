import { SQUAD_KEYS, SQUAD_DEFINITIONS, type SquadKey } from "@/lib/tw-squads";

/**
 * "Commands" are named squad+kit presets an officer assigns directly to a
 * Territory War zone or Territory Battle planet+phase, instead of building
 * up a plan one player at a time. Every guild gets the 12 built-in presets
 * below (one per known TW squad) for free — see
 * ensureBuiltInCommands() in lib/tw-plans.ts, which idempotently creates any
 * that are missing for a guild. Officers can also create fully custom
 * commands (with or without a linked squadKey) for anything not covered
 * here, which matters most for Territory Battle planets.
 */

export type BuiltInCommandPreset = {
  squadKey: SquadKey;
  name: string;
  kitNotes: string;
};

export const BUILT_IN_COMMAND_PRESETS: BuiltInCommandPreset[] = SQUAD_KEYS.map((key) => {
  const def = SQUAD_DEFINITIONS[key];
  return {
    squadKey: key,
    name: def.label,
    kitNotes: def.recommendation,
  };
});
