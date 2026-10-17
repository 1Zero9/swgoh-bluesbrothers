/** The five sections of the member hub, and which one a given page belongs to. */

export type HubSectionKey = "home" | "ask" | "know" | "guild" | "more";

export type HubSection = { key: HubSectionKey; label: string; href: string; prefixes: string[] };

export const HUB_SECTIONS: HubSection[] = [
  { key: "home", label: "Home", href: "/", prefixes: [] },
  { key: "ask", label: "Ask B-Lue3", href: "/ask", prefixes: ["/ask"] },
  { key: "know", label: "Knowledge", href: "/knowledge", prefixes: ["/knowledge", "/guides"] },
  {
    key: "guild",
    label: "Guild",
    href: "/guild",
    prefixes: ["/guild", "/overview", "/members", "/chat", "/wins", "/territory-war", "/territory-battles", "/raids", "/datacrons", "/arsenal", "/operations", "/feedback", "/activity"],
  },
  {
    key: "more",
    label: "More",
    href: "/more",
    prefixes: ["/more", "/me", "/dougies-discs", "/cantina", "/mission-from-god", "/gig-in-session", "/officer", "/credits"],
  },
];

/** The section a path sits in, or null for pages outside the hub. Home owns only "/". */
export function sectionFor(pathname: string): HubSectionKey | null {
  const path = pathname.split("#")[0].split("?")[0] || "/";
  if (path === "/") return "home";
  for (const section of HUB_SECTIONS) {
    if (section.prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return section.key;
  }
  return null;
}

/** The laptop sidebar: every page, in groups, nothing tucked behind a menu. */
export type SidebarLink = { label: string; href: string; officerOnly?: boolean };
export type SidebarGroup = { title: string | null; links: SidebarLink[] };

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  { title: null, links: [{ label: "Home", href: "/" }, { label: "My page", href: "/me" }, { label: "Ask B-Lue3", href: "/ask" }, { label: "Guild chat", href: "/chat" }, { label: "Feedback", href: "/feedback" }] },
  {
    title: "Knowledge",
    links: [
      { label: "Counters", href: "/knowledge" },
      { label: "Tips", href: "/knowledge/tips" },
      { label: "Ideas", href: "/knowledge/ideas" },
      { label: "Find a counter", href: "/ask?tab=counters" },
      { label: "Field guides", href: "/guides" },
    ],
  },
  {
    title: "Guild",
    links: [
      { label: "Roster", href: "/members" },
      { label: "Who has…?", href: "/members#who-has" },
      { label: "Guild activity", href: "/activity" },
      { label: "The Wins", href: "/wins" },
      { label: "Overview", href: "/overview" },
    ],
  },
  {
    title: "War room",
    links: [
      { label: "Territory War", href: "/territory-war" },
      { label: "Territory Battles", href: "/territory-battles" },
      { label: "Raids", href: "/raids" },
      { label: "Datacrons", href: "/datacrons" },
      { label: "Arsenal", href: "/arsenal" },
    ],
  },
  {
    title: "Off duty",
    links: [
      { label: "Dougie's Discs", href: "/dougies-discs" },
      { label: "Soul Food Cantina", href: "/cantina" },
      { label: "Mission From God", href: "/mission-from-god" },
    ],
  },
  { title: "You", links: [{ label: "Notifications", href: "/more" }] },
  {
    title: "Officers",
    links: [
      { label: "Review queue", href: "/knowledge/review", officerOnly: true },
      { label: "Announcement", href: "/officer/announcement", officerOnly: true },
      { label: "Member cards", href: "/officer/member", officerOnly: true },
      { label: "Roster report", href: "/officer/roster", officerOnly: true },
      { label: "Discord sync", href: "/officer/discord-sync", officerOnly: true },
    ],
  },
];

/** The sidebar link that matches the page: the one with the longest matching path, so /knowledge/tips beats /knowledge. */
export function activeSidebarHref(pathname: string, groups: SidebarGroup[] = SIDEBAR_GROUPS): string | null {
  const path = pathname.split("#")[0].split("?")[0] || "/";
  let best: { href: string; length: number } | null = null;
  for (const link of groups.flatMap((group) => group.links)) {
    const target = link.href.split("#")[0].split("?")[0];
    const matches = target === "/" ? path === "/" : path === target || path.startsWith(`${target}/`);
    if (matches && (!best || target.length > best.length)) best = { href: link.href, length: target.length };
  }
  // "Who has" shares the roster page: only the roster link is lit.
  return best?.href ?? null;
}

/** What each dock tab opens on a phone: a short menu above the dock. Home and Ask go straight to their page. */
export type DockLink = { label: string; href: string; officerOnly?: boolean };
export type DockMenu = { title: string | null; links: DockLink[] };

export const DOCK_MENUS: Partial<Record<HubSectionKey, DockMenu[]>> = {
  know: [{ title: null, links: [{ label: "Counters", href: "/knowledge" }, { label: "Tips", href: "/knowledge/tips" }, { label: "Ideas", href: "/knowledge/ideas" }, { label: "Find a counter", href: "/ask?tab=counters" }, { label: "Field guides", href: "/guides" }] }],
  guild: [
    { title: "Guild", links: [{ label: "Guild chat", href: "/chat" }, { label: "Roster", href: "/members" }, { label: "Who has…?", href: "/members#who-has" }, { label: "Guild activity", href: "/activity" }, { label: "The Wins", href: "/wins" }, { label: "Overview", href: "/overview" }] },
    { title: "War room", links: [{ label: "Territory War", href: "/territory-war" }, { label: "Territory Battles", href: "/territory-battles" }, { label: "Raids", href: "/raids" }, { label: "Datacrons", href: "/datacrons" }, { label: "Arsenal", href: "/arsenal" }] },
  ],
  more: [
    { title: "You", links: [{ label: "My page", href: "/me" }, { label: "Feedback", href: "/feedback" }, { label: "Notifications", href: "/more" }] },
    { title: "Off duty", links: [{ label: "Dougie's Discs", href: "/dougies-discs" }, { label: "Soul Food Cantina", href: "/cantina" }, { label: "Mission From God", href: "/mission-from-god" }] },
    { title: "Officers", links: [{ label: "Review queue", href: "/knowledge/review", officerOnly: true }, { label: "Announcement", href: "/officer/announcement", officerOnly: true }, { label: "Member cards", href: "/officer/member", officerOnly: true }, { label: "Roster report", href: "/officer/roster", officerOnly: true }, { label: "Discord sync", href: "/officer/discord-sync", officerOnly: true }] },
  ],
};
