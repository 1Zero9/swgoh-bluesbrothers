/** Link lists for the Guild and More pages. Every existing page keeps its address; this only groups them. */

export type HubLink = { label: string; hint: string; href: string; icon: string };
export type HubLinkGroup = { title: string; links: HubLink[] };

export const GUILD_GROUPS: HubLinkGroup[] = [
  {
    title: "People",
    links: [
      { label: "Roster", hint: "Every member, what they have", href: "/members", icon: "roster" },
      { label: "Who has…?", hint: "Find a unit across the guild", href: "/members#who-has", icon: "search" },
      { label: "Guild chat", hint: "The Discord channels, on the site", href: "/chat", icon: "chat" },
      { label: "The Wins", hint: "Galactic Legends, relics and ultimates", href: "/wins", icon: "wins" },
      { label: "Guild overview", hint: "Power, tickets, the Wall of Fame and the Wire", href: "/overview", icon: "star" },
    ],
  },
  {
    title: "War room",
    links: [
      { label: "Territory War", hint: "Zones, defence and your orders", href: "/territory-war", icon: "war" },
      { label: "Territory Battles", hint: "Planets and platoons", href: "/territory-battles", icon: "planet" },
      { label: "Raids", hint: "Tickets and results", href: "/raids", icon: "raid" },
      { label: "Datacrons", hint: "The vault and seasonal sets", href: "/datacrons", icon: "datacron" },
      { label: "Arsenal", hint: "Relic squads and counter power", href: "/arsenal", icon: "shield" },
      { label: "All operations", hint: "The full mission launchpad", href: "/operations", icon: "rocket" },
    ],
  },
];

export const OFF_DUTY_LINKS: HubLink[] = [
  { label: "Dougie's Discs", hint: "The jukebox", href: "/dougies-discs", icon: "music" },
  { label: "Soul Food Cantina", hint: "Recipes and beer pairings", href: "/cantina", icon: "food" },
  { label: "Mission From God", hint: "The thirty-day trading run", href: "/mission-from-god", icon: "game" },
];

export const OFFICER_LINKS: HubLink[] = [
  { label: "Review queue", hint: "Counters waiting for a check", href: "/knowledge/review", icon: "clipboard" },
  { label: "Roster report", hint: "Participation and guild history", href: "/officer/roster", icon: "report" },
  { label: "Discord sync", hint: "Roles and name mismatches", href: "/officer/discord-sync", icon: "blue" },
];
