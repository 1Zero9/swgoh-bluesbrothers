/** The five sections of the member hub, and which one a given page belongs to. */

export type HubSectionKey = "home" | "ask" | "know" | "guild" | "more";

export type HubSection = { key: HubSectionKey; label: string; href: string; prefixes: string[] };

export const HUB_SECTIONS: HubSection[] = [
  { key: "home", label: "Home", href: "/", prefixes: [] },
  { key: "ask", label: "Ask B-Lue3", href: "/ask", prefixes: ["/ask"] },
  { key: "know", label: "Knowledge", href: "/knowledge", prefixes: ["/knowledge", "/counters", "/guides"] },
  {
    key: "guild",
    label: "Guild",
    href: "/guild",
    prefixes: ["/guild", "/overview", "/members", "/chat", "/wins", "/territory-war", "/territory-battles", "/raids", "/datacrons", "/arsenal", "/operations"],
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
