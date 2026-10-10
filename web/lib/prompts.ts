/** Weekly conversation starters for #general. Curated, so the tone stays ours. */

export type Prompt = { id: string; text: string };

const GROUPS: Prompt[][] = [
  // Squads and farming
  [
    { id: "best-squad", text: "What's the best squad you've ever built, and what made it click?" },
    { id: "farm-next", text: "What are you farming right now, and how far off are you?" },
    { id: "worst-farm", text: "What's the most painful farm you've ever done? Shard grind, ship, anything." },
    { id: "unit-regret", text: "Which unit did you spend resources on that you now regret?" },
    { id: "unit-surprise", text: "Which unit turned out far better than you expected?" },
    { id: "first-relic", text: "Do you remember your first relic unit? Which one was it?" },
    { id: "first-gl", text: "What was your first Galactic Legend, and how long did the farm take?" },
    { id: "next-gl", text: "Which Galactic Legend are you aiming for next, and why that one?" },
    { id: "datacron", text: "What's the best datacron you've got right now?" },
    { id: "mod-luck", text: "Best mod roll you've ever had? Show us the speed." },
    { id: "underrated", text: "Which character do you think is the most underrated in the game?" },
    { id: "hidden-gem", text: "What's a squad that deserves more love than it gets?" },
  ],
  // Territory War and Territory Battles
  [
    { id: "tw-defence", text: "What's your go-to Territory War defence, and has it ever let you down?" },
    { id: "tw-moment", text: "Best Territory War moment you've ever had? A clutch clear, a surprise hold, anything." },
    { id: "tw-fear", text: "What's the squad you most dread seeing on an enemy defence?" },
    { id: "tb-planet", text: "Which Territory Battle planet is your favourite, and which one makes you groan?" },
    { id: "tb-tip", text: "What's the one Territory Battle tip you wish you'd known sooner?" },
    { id: "tw-wishlist", text: "If you could change one thing about Territory War, what would it be?" },
    { id: "raid-memory", text: "Do you remember the first raid you took part in? How did it go?" },
    { id: "ticket-routine", text: "When in the day do you get your raid tickets done, and why then?" },
  ],
  // Fun and off-topic
  [
    { id: "game-time", text: "When do you usually play: morning, lunch, evening, or in secret at work?" },
    { id: "game-years", text: "How long have you been playing, and what keeps you coming back?" },
    { id: "first-character", text: "Who was the very first character you ever unlocked?" },
    { id: "dream-unit", text: "If a new character could be added tomorrow, who would you pick?" },
    { id: "light-dark", text: "Light side, dark side, or both? Which do you actually play most?" },
    { id: "favourite-film", text: "Which Star Wars film is your favourite, and which one will you defend to the end?" },
    { id: "hot-take", text: "Give us your hottest Star Wars take. No judgement. Okay, a little judgement." },
    { id: "snack", text: "What's your ideal snack for a Territory War night?" },
    { id: "playlist", text: "What are you listening to while you play? Put a song in the chat." },
    { id: "setup", text: "Phone, tablet or emulator? Show us how you play." },
  ],
  // The Blues Brothers
  [
    { id: "bb-jake-elwood", text: "Jake or Elwood: who is your main, and why?" },
    { id: "bb-song", text: "Which Blues Brothers song should be our Territory War anthem?" },
    { id: "bb-scene", text: "Favourite scene from The Blues Brothers? Come on, there are loads." },
    { id: "bb-cameo", text: "Best musical cameo in the film? Pick your legend." },
    { id: "bb-band-name", text: "Give our next TW night a band name. Best one wins nothing but glory." },
    { id: "bb-mission", text: "We're on a mission from the Force. What's yours for the next month?" },
    { id: "bb-sunglasses", text: "Hat and shades: would you pull it off? Be honest." },
    { id: "bb-soundtrack", text: "If our guild had a soundtrack, what's track one?" },
  ],
  // This or that
  [
    { id: "tot-attack-defend", text: "Attack or defence: which do you enjoy more in Territory War?" },
    { id: "tot-ships-squads", text: "Fleet or ground: where do you spend your effort?" },
    { id: "tot-solo-team", text: "A one-unit wonder or a tight team synergy: which do you prefer?" },
    { id: "tot-relic-gear", text: "Pushing relics higher or widening the roster: what's your plan?" },
    { id: "tot-early-late", text: "Early bird raid tickets or last-minute heroics?" },
    { id: "tot-gl-ult", text: "A new Galactic Legend or an ultimate for one you've got: which would you take?" },
    { id: "tot-nostalgia", text: "Old-school classic squad or the latest meta: what's on your team?" },
    { id: "tot-compete-chill", text: "Climb the leaderboard or stay casual and have fun? Where are you right now?" },
  ],
];

/** Interleaved, so the weekly topic rotates: squads, war, fun, the band, this-or-that, then round again. */
export const PROMPTS: Prompt[] = Array.from({ length: Math.max(...GROUPS.map((group) => group.length)) }, (_, row) =>
  GROUPS.flatMap((group) => (group[row] ? [group[row]] : [])),
).flat();

/** The next prompt nobody in this guild has seen yet; once all are used, the cycle starts again. */
export function pickPrompt(usedIds: string[], prompts: Prompt[] = PROMPTS): Prompt {
  const used = new Set(usedIds);
  const fresh = prompts.filter((prompt) => !used.has(prompt.id));
  if (fresh.length) return fresh[0];
  return prompts[0];
}

/**
 * When the weekly prompt is allowed out: Wednesday from 4pm to 10pm UK time, or Thursday 8am to 10pm.
 * Several syncs run in that window, so a missed run just means the next one posts it.
 */
export function isPromptWindow(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  if (weekday === "Wed") return hour >= 16 && hour < 22;
  if (weekday === "Thu") return hour >= 8 && hour < 22;
  return false;
}
