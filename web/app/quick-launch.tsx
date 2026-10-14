import Link from "next/link";
import NavIcon from "./nav-icon";

type Tool = { label: string; hint: string; href: string; icon: string };

// The things members come back for, in the order they matter. Everything else is in the menu.
const TOOLS: Tool[] = [
  { label: "My Page", hint: "Your standing and callouts", href: "/me", icon: "me" },
  { label: "Ask B-Lue3", hint: "Your guild droid", href: "/me#ask-blue", icon: "blue" },
  { label: "Guild Chat", hint: "Talk to the band", href: "/chat", icon: "chat" },
  { label: "The Wins", hint: "What the guild just did", href: "/wins", icon: "wins" },
  { label: "Who has…?", hint: "Find a unit in the guild", href: "/members#who-has", icon: "search" },
  { label: "Roster", hint: "All 50 members", href: "/members", icon: "roster" },
  { label: "Counters", hint: "Squads for TW and GAC", href: "/counters", icon: "shield" },
  { label: "Territory War", hint: "War room and defence", href: "/territory-war", icon: "war" },
  { label: "Territory Battles", hint: "Planets and platoons", href: "/territory-battles", icon: "planet" },
  { label: "Raids", hint: "Tickets and results", href: "/raids", icon: "raid" },
  { label: "Operations", hint: "Raids, datacrons, arsenal", href: "/operations", icon: "rocket" },
  { label: "Field Guides", hint: "How to do things", href: "/guides", icon: "guide" },
];

export default function QuickLaunch() {
  return (
    <nav className="quick-launch" aria-label="Guild tools">
      {TOOLS.map((tool) => (
        <Link key={tool.href} href={tool.href} className="quick-tool">
          <span className="quick-icon" aria-hidden="true"><NavIcon name={tool.icon} size={22} /></span>
          <strong>{tool.label}</strong>
          <small>{tool.hint}</small>
        </Link>
      ))}
    </nav>
  );
}
