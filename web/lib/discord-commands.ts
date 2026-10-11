/** The slash commands the Droid registers in the guild's Discord server. */
export const WHOHAS_COMMAND = {
  name: "whohas",
  type: 1,
  description: "Who in the guild has a unit, and how far they've taken it",
  options: [
    { type: 3, name: "unit", description: "Start typing a unit name", required: true, autocomplete: true },
    { type: 4, name: "min_stars", description: "Only show members at this many stars or more", required: false, min_value: 1, max_value: 7 },
  ],
};

export const GUILD_COMMANDS = [WHOHAS_COMMAND];

/** Discord's interaction request types and response types that we use. */
export const InteractionType = { Ping: 1, Command: 2, Autocomplete: 4 } as const;
export const ResponseType = { Pong: 1, Message: 4, Autocomplete: 8 } as const;
export const EPHEMERAL = 64;
