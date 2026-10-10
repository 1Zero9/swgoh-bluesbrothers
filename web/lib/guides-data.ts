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
    title: "How to Sign In & Use the Members' Area",
    shortDescription: "Sign in once with Discord and the roster, Territory War, Territory Battles, your own page and the Wins feed all open up.",
    category: "GETTING_STARTED",
    categoryLabel: "Getting Started",
    icon: "⚡",
    badge: "Essential",
    targetAudience: "All Members",
    estimatedMinutes: 2,
    steps: [
      {
        stepNumber: 1,
        title: "Click Sign in at the top of any page",
        instruction: "Use the Sign in button in the top-right corner and approve the site in Discord. It only reads your Discord name and picture. If an officer has already linked you, you're straight in and that's all there is to it.",
        actionHref: "/api/auth/discord",
        actionLabel: "Sign in with Discord →",
        tip: "You must be in the Blues Brothers Discord server first. If you aren't, join it from the front page and come back.",
      },
      {
        stepNumber: 2,
        title: "First time only: enter your 9-digit ally code",
        instruction: "If we don't know your Discord account yet, the site asks for your in-game ally code (e.g. 123-456-789) once, to match you to your player. After that you won't be asked again.",
        tip: "Find your ally code in the game by tapping your player profile at the top left of the home screen. Officers are linked by another officer, so ask in the Discord if the site tells you so.",
      },
      {
        stepNumber: 3,
        title: "Find your way around",
        instruction: "Signed in, you can see the roster, arsenal, datacrons, Territory War, Territory Battles and the callouts, the Wins feed, and My Page: your own stats, wins and the callouts you could help with.",
        actionHref: "/me",
        actionLabel: "Open My Page →",
      },
    ],
    faq: [
      {
        question: "Why does the site say 'Members only'?",
        answer: "Rosters, plans and results name individual members, so they're kept for Blues Brothers guild members. The front page, the field guides and the game are open to everyone.",
      },
      {
        question: "What happens if I change my Discord username or nickname?",
        answer: "Nothing. Your link is tied to your permanent Discord account, not your display name.",
      },
      {
        question: "How long do I stay signed in, and what if I leave the guild?",
        answer: "Sign-ins last about 90 days, and signing back in is one click. Access follows your guild membership: a few hours after you leave the guild in-game, the members' area closes to you automatically.",
      },
      {
        question: "I have two Discord accounts. Can both be linked?",
        answer: "Yes. Ask an officer to add the second one to your player. Either account then signs you in.",
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
    title: "Officer Guide: Access, Discord Sync & Roster Governance",
    shortDescription: "How officer access works, how to link members to Discord in bulk, and what the site keeps in step automatically.",
    category: "OFFICER",
    categoryLabel: "Officer Command",
    icon: "🛡️",
    badge: "Leadership Only",
    targetAudience: "Officers",
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Sign in with Discord",
        instruction: "There's no officer password. Anyone who is an Officer or Leader in the game gets officer access when they sign in with Discord (they must be linked). Promote or demote someone in-game and their access, and their Discord officer role, follow at the next guild sync.",
        actionHref: "/officer/discord-sync",
        actionLabel: "Open Discord Sync Hub →",
      },
      {
        stepNumber: 2,
        title: "Link members in bulk",
        instruction: "Open the Discord Sync Hub. 'Link N exact matches' links everyone whose in-game name exactly matches one Discord account, after showing you the list. For the rest, open 'Unmatched Discord', recognise the person, type their in-game name and click Link.",
        tip: "If you add a name that already has a Discord account, the hub offers to add it as a second account for that member.",
      },
      {
        stepNumber: 3,
        title: "Let the roles look after themselves",
        instruction: "Each guild sync gives linked in-game officers the Discord officer role and removes it from everyone else linked, and takes the Member role from people who left. 'Reconcile All Discord Roles' is only there if you want to force it.",
        tip: "The bot needs Manage Roles, and its own role must sit above the Member and Officer roles in your server settings.",
      },
    ],
    faq: [
      {
        question: "What happens when a new player joins the guild in-game?",
        answer: "On the next sync they get a membership record and an automatic welcome in Discord. They're linked the first time they sign in, or by an officer in the Discord Sync Hub.",
      },
      {
        question: "Can an officer fix a wrong link?",
        answer: "Yes. Click 'Unlink' on a linked player's card in the Discord Sync Hub, or the × next to an extra account, to reset it.",
      },
      {
        question: "Why can't an officer link themselves with an ally code?",
        answer: "Officer access follows the link, so an ally code on its own must never be enough to claim an officer. Another officer links them.",
      },
    ],
  },
];
