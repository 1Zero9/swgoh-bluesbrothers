export type GuideStep = {
  stepNumber: number;
  title: string;
  instruction: string;
  tip?: string;
  actionHref?: string;
  actionLabel?: string;
};

export type GuideItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: "GETTING_STARTED" | "TERRITORY_WAR" | "DATACRONS" | "CANTINA" | "OFFICER";
  categoryLabel: string;
  icon: string;
  badge?: string;
  targetAudience: "All Members" | "Officers" | "Recruits";
  estimatedMinutes: number;
  steps: GuideStep[];
  faq: Array<{ question: string; answer: string }>;
};

export const GUIDE_CATEGORIES = [
  { id: "ALL", label: "All Guides", icon: "📖" },
  { id: "GETTING_STARTED", label: "Getting Started & Access", icon: "⚡" },
  { id: "TERRITORY_WAR", label: "Territory War Orders", icon: "⚔️" },
  { id: "DATACRONS", label: "Datacron Optimization", icon: "💎" },
  { id: "CANTINA", label: "Cantina & Music", icon: "🎵" },
  { id: "OFFICER", label: "Officer Command", icon: "🛡️" },
] as const;

export const FIELD_GUIDES: GuideItem[] = [
  {
    id: "guide-account-linking",
    slug: "account-linking",
    title: "How to Link Your Account & Enter the Site",
    shortDescription: "A simple 2-step setup to connect your Discord and SWGOH Ally Code to unlock full guild command access.",
    category: "GETTING_STARTED",
    categoryLabel: "Getting Started",
    icon: "⚡",
    badge: "Essential",
    targetAudience: "All Members",
    estimatedMinutes: 2,
    steps: [
      {
        stepNumber: 1,
        title: "Click 'Enter with Discord' on the Gatekeeper",
        instruction: "Navigate to the site login screen (or /gig-in-session) and click 'Enter with Discord'. This verifies your Discord account with the server.",
        actionHref: "/gig-in-session",
        actionLabel: "Open Crew Gate →",
        tip: "If you don't have Discord yet, you can also enter your 9-digit Ally Code directly on the second tab.",
      },
      {
        stepNumber: 2,
        title: "Enter Your 9-Digit SWGOH Ally Code (Once Only)",
        instruction: "If your Discord handle does not match your in-game name exactly, you will be prompted for your in-game Ally Code (e.g. 123-456-789). Enter it to bind your account permanently.",
        tip: "You can find your Ally Code in SWGOH by tapping your in-game player profile at the top left of the game home screen.",
      },
      {
        stepNumber: 3,
        title: "Enjoy Full Unlocked Command Access",
        instruction: "Once verified, you have instant access to live Territory War zone assignments, the guild Datacron Vault, and Dougie's Discs turntable.",
        actionHref: "/territory-war",
        actionLabel: "View Territory War Board →",
      },
    ],
    faq: [
      {
        question: "Why does the site say 'The Gig is in Session - Crew Access Only'?",
        answer: "The command deck contains live tactical battle plans and is restricted to verified Blues Brothers guild members and officers. Signing in unlocks full access.",
      },
      {
        question: "What happens if I change my Discord username or nickname later?",
        answer: "Your link remains active because it binds to your permanent Discord User ID, not your display name.",
      },
    ],
  },
  {
    id: "guide-territory-war",
    slug: "territory-war-orders",
    title: "Territory War (TW) Member Playbook",
    shortDescription: "Clear instructions for every TW phase: joining the war, setting assigned defence squads, and attacking enemy zones.",
    category: "TERRITORY_WAR",
    categoryLabel: "Territory War",
    icon: "⚔️",
    badge: "Battle Orders",
    targetAudience: "All Members",
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: "Phase 1: Join the War (Preview Phase - 24 Hours)",
        instruction: "Open SWGOH and tap 'Join' on the Territory War holotable before the 24-hour preview countdown expires. Our guild bots will post reminders in Discord.",
        actionHref: "/territory-war",
        actionLabel: "Check TW Join Status →",
        tip: "Joining locks your current mods, relic levels, and datacrons for the entire war.",
      },
      {
        stepNumber: 2,
        title: "Phase 2: Set Defence Squads (Setup Phase - 24 Hours)",
        instruction: "Open the site's Territory War board at /territory-war. Look for your name in the Zone assignments. Place your designated squad and datacron into the specified zone (e.g. Zone F1 - Frontline).",
        actionHref: "/territory-war",
        actionLabel: "Open Zone Assignments →",
        tip: "Do NOT deploy squads reserved for Offence. If you cannot place your assigned squad, notify an officer on Discord immediately.",
      },
      {
        stepNumber: 3,
        title: "Phase 3: Attack Enemy Zones (Attack Phase - 24 Hours)",
        instruction: "Coordinate attacks with officer Discord pings. Check the 'Offence Counters & Reserve' section on the TW page to see which enemy squads your remaining roster can counter.",
        tip: "Always report preloads or battle timeouts in the #tw-war-room channel on Discord so teammates don't waste squads.",
      },
    ],
    faq: [
      {
        question: "How are defensive squads chosen for members?",
        answer: "Our automated recommendation engine analyzes all joined members' rosters, relic thresholds, and active datacrons to build impenetrable frontline zones while saving your best counters for offence.",
      },
      {
        question: "What if I get assigned a squad I don't have geared?",
        answer: "Officers can lock and reassign squads on the board in real time. Reach out in the Discord war room.",
      },
    ],
  },
  {
    id: "guide-datacrons",
    slug: "datacron-optimization",
    title: "Datacron Mastery: Upgrading, Perks & Rerolls",
    shortDescription: "How to prioritize Level 9 character perks, faction boosts, and material rerolls to supercharge your combat teams.",
    category: "DATACRONS",
    categoryLabel: "Datacrons",
    icon: "💎",
    badge: "Meta Strategy",
    targetAudience: "All Members",
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Check Active Seasonal Sets in the Codex",
        instruction: "Visit the Datacron Vault at /datacrons. Review which 3 SWGOH sets are currently active and note their expiry dates so you don't invest in expiring sets.",
        actionHref: "/datacrons",
        actionLabel: "Open Datacron Vault →",
      },
      {
        stepNumber: 2,
        title: "Target Level 9 Character Super-Weapons",
        instruction: "Push key datacrons to Level 9 if you own the featured Galactic Legend or marquee character (e.g. GL Rey, Leia Organa, Bane, Great Mothers). A single Level 9 perk often turns an ordinary squad into an unbeatable wall.",
        tip: "Level 3 provides Alignment boosts, Level 6 grants Faction bonuses, and Level 9 provides unique Character abilities.",
      },
      {
        stepNumber: 3,
        title: "Follow the Reroll Stat Priority Guide",
        instruction: "Before locking reroll stats, check the 'Stat Reroll Advisor' table on /datacrons. Prioritize Speed %, Health %, and Mastery over flat defence stats.",
        tip: "Do not exhaust all your reroll materials on Level 1-5 stats. Save your high-tier materials for Level 6 and 9 rolls.",
      },
    ],
    faq: [
      {
        question: "Where do I farm datacron materials?",
        answer: "Datacron materials and caches are farmed primarily in SWGOH Conquest nodes (Sector 1-5 bonus nodes) and the weekly TW guild rewards.",
      },
      {
        question: "How does the guild track our datacrons?",
        answer: "The Blues Brothers site periodically reads all 50 guild member rosters via Comlink and surfaces our Level 9 inventory on the Datacron Leaderboard.",
      },
    ],
  },
  {
    id: "guide-dougies-discs",
    slug: "dougies-discs-jukebox",
    title: "Dougie's Discs: Turntable Controls & Song Requests",
    shortDescription: "How to play Chicago blues classics, control the retro vinyl player, and add your own YouTube music to the guild queue.",
    category: "CANTINA",
    categoryLabel: "Cantina & Music",
    icon: "🎵",
    badge: "Entertainment",
    targetAudience: "All Members",
    estimatedMinutes: 2,
    steps: [
      {
        stepNumber: 1,
        title: "Spin Any Track from the Curated Crate",
        instruction: "Open /dougies-discs. Browse the curated crates by genre (The Blues Brothers, Chicago Blues, Soul & R&B, Rock & Roll). Click 'Spin Track' to start playback on the vinyl turntable.",
        actionHref: "/dougies-discs",
        actionLabel: "Open Dougie's Discs →",
      },
      {
        stepNumber: 2,
        title: "Control Audio from Anywhere",
        instruction: "Use the soundboard at the top to pause, skip tracks, and adjust master volume. When you scroll down the page, a docked mini-player appears at the bottom right so music never stops.",
        tip: "You can click the needle on the turntable to quickly pause or play.",
      },
      {
        stepNumber: 3,
        title: "Request Custom Songs (Drop a Credit)",
        instruction: "Have a favorite tune? Paste any YouTube video URL into the 'Request a Track' box at the bottom of the page and click 'Add to Queue'. It will be queued up next on the turntable.",
        tip: "Supports standard YouTube links, youtu.be shortlinks, and embed links.",
      },
    ],
    faq: [
      {
        question: "Does the music stop if I switch browser tabs?",
        answer: "No, as long as the Dougie's Discs tab remains open in your browser, the YouTube audio player continues playing seamlessly.",
      },
      {
        question: "What music fits the Blues Brothers vibe?",
        answer: "Anything classic rhythm & blues, Chicago blues, Stax/Motown soul, classic rock, or iconic movie soundtracks!",
      },
    ],
  },
  {
    id: "guide-officer-governance",
    slug: "officer-discord-sync",
    title: "Officer Guide: Discord Sync & Roster Governance",
    shortDescription: "How guild officers manage membership, resolve name mismatches, and automate Discord role transitions.",
    category: "OFFICER",
    categoryLabel: "Officer Command",
    icon: "🛡️",
    badge: "Leadership Only",
    targetAudience: "Officers",
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Access the Discord Sync Hub",
        instruction: "Sign in with your Officer Keycard and open /officer/discord-sync from the navigation or Operations deck.",
        actionHref: "/officer/discord-sync",
        actionLabel: "Open Discord Sync Hub →",
      },
      {
        stepNumber: 2,
        title: "Review Auto-Match Suggestions & 1-Click Link",
        instruction: "Filter by 'Unlinked Members'. The smart fuzzy matcher will highlight suggested Discord users based on server nicknames. Click 'Link →' to confirm high-confidence matches (80%+).",
        tip: "If a player uses an entirely different handle, click '+ Choose Discord Member Manually' and paste their Discord User ID.",
      },
      {
        stepNumber: 3,
        title: "Reconcile Roles on Departures",
        instruction: "Click '⚡ Reconcile All Discord Roles' to automatically demote any ex-members to the Public/Guest role and verify that all active crew hold the Member role.",
        tip: "Scheduled guild syncs run this automatically, but you can trigger a manual reconciliation at any time after roster changes.",
      },
    ],
    faq: [
      {
        question: "What happens when a new player joins the guild in-game?",
        answer: "On the next scheduled sync, Comlink creates an active membership record and posts an automated welcome announcement to the Discord wire.",
      },
      {
        question: "Can an officer manually unlink an account if an error was made?",
        answer: "Yes, click 'Unlink' on any linked player card in the Discord Sync Hub to reset their connection.",
      },
    ],
  },
];
