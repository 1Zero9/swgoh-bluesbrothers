import Image from "next/image";
import Link from "next/link";
import packageInfo from "../package.json";
import { getDashboardSummary } from "@/lib/dashboard";
import { getDiscordUrl } from "@/lib/discord";
import MobileMenu from "./mobile-menu";
import AccountMenu from "./account-menu";
import ThemeToggle from "./theme-toggle";
import NavLinks from "./nav-links";
import ScrollTracker from "./scroll-tracker";

export const APP_VERSION = `v${packageInfo.version}`;

export type NavSubItem = {
  label: string;
  mark: string;
  href: string;
  description?: string;
  icon?: string;
};

export type NavCategoryItem = {
  label: string;
  mark: string;
  href: string;
  children?: NavSubItem[];
};

export const SITE_NAVIGATION: NavCategoryItem[] = [
  {
    label: "Guild Wire",
    mark: "GW",
    href: "/#guild-wire",
  },
  {
    label: "Operations",
    mark: "OP",
    href: "/operations",
    children: [
      { label: "Territory War", mark: "TW", href: "/territory-war", description: "Live war room, zones & defence assignments", icon: "war" },
      { label: "Datacrons Vault", mark: "DC", href: "/datacrons", description: "Guild Level 9 weapons & active seasonal sets", icon: "datacron" },
      { label: "Counters", mark: "CT", href: "/counters", description: "Counter squads for TW and GAC, and who can run them", icon: "shield" },
      { label: "Territory Battles", mark: "TB", href: "/territory-battles", description: "RotE platoons & mission readiness", icon: "planet" },
      { label: "Raids", mark: "RD", href: "/raids", description: "Speeder & Naboo guild raid tracking", icon: "raid" },
      { label: "Guild Arsenal", mark: "AR", href: "/arsenal", description: "Relic squads & counter power", icon: "shield" },
      { label: "All Operations Deck", mark: "OP", href: "/operations", description: "Central mission launchpad", icon: "rocket" },
    ],
  },
  {
    label: "Roster",
    mark: "MB",
    href: "/members",
    children: [
      { label: "Guild Chat", mark: "CH", href: "/chat", description: "The Discord channels, on the site", icon: "chat" },
      { label: "My Page", mark: "ME", href: "/me", description: "Your standing, wins and callouts", icon: "me" },
      { label: "Ask Blue", mark: "BL", href: "/me#ask-blue", description: "B-LU3, the guild droid, answers roster questions", icon: "blue" },
      { label: "Who has…?", mark: "WH", href: "/members#who-has", description: "Find a unit across the whole guild", icon: "search" },
      { label: "Member Roster", mark: "MB", href: "/members", description: "50-member profiles, GP & GL counts", icon: "roster" },
      { label: "The Wins", mark: "WN", href: "/wins", description: "Galactic Legends, ultimates & relics as they happen", icon: "wins" },
      { label: "Wall of Fame", mark: "WF", href: "/#wall-of-fame", description: "Top rankings across power & tickets", icon: "star" },
    ],
  },
  {
    label: "Cantina & Music",
    mark: "DD",
    href: "/dougies-discs",
    children: [
      { label: "Dougie's Discs", mark: "DD", href: "/dougies-discs", description: "Turntable jukebox & custom requests", icon: "music" },
      { label: "Soul Food Cafe", mark: "SF", href: "/cantina", description: "Chicago blues lore & menu specials", icon: "food" },
      { label: "Mission From God", mark: "MG", href: "/mission-from-god", description: "Thirty-day galactic trading run", icon: "game" },
    ],
  },
  {
    label: "Officer Deck",
    mark: "OR",
    href: "/officer/roster",
    children: [
      { label: "Officer Roster Report", mark: "OR", href: "/officer/roster", description: "Participation & guild history table", icon: "report" },
      { label: "Discord Sync Governance", mark: "DS", href: "/officer/discord-sync", description: "Role reconciliation & name mismatches", icon: "blue" },
      { label: "Territory War war room", mark: "TW", href: "/territory-war", description: "Plan the war and mark it Active for members", icon: "war" },
      { label: "Territory Battle planning", mark: "TB", href: "/territory-battles", description: "Star calculator and per-planet plan", icon: "planet" },
    ],
  },
  {
    label: "Field Guides",
    mark: "FG",
    href: "/guides",
    children: [
      { label: "All Field Guides", mark: "FG", href: "/guides", description: "Step-by-step instructions hub", icon: "guide" },
      { label: "Account Linking", mark: "AL", href: "/guides#account-linking", description: "2-step Discord & Ally Code access", icon: "raid" },
      { label: "TW Battle Orders", mark: "TW", href: "/guides#territory-war-orders", description: "Defence & Attack phase rules", icon: "war" },
      { label: "Datacron Optimization", mark: "DC", href: "/guides#datacron-optimization", description: "Level 9 perks & stat rerolls", icon: "datacron" },
    ],
  },
];

function formatSyncedAgo(date: Date) {
  const diffMinutes = (Date.now() - date.getTime()) / 60_000;
  if (diffMinutes < 1) return "moments ago";
  if (diffMinutes < 60) return `${Math.round(diffMinutes)}m ago`;
  const diffHours = diffMinutes / 60;
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  const diffDays = diffHours / 24;
  if (diffDays < 7) return `${Math.round(diffDays)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function SiteHeader({
  homeHref = "#top",
  syncLabel,
}: {
  homeHref?: string;
  syncLabel?: string;
}) {
  const discordUrl = getDiscordUrl();
  const summary = await getDashboardSummary();
  const commsLive = summary.live;
  const commsLabel = syncLabel ?? (summary.capturedAt ? `Synced ${formatSyncedAgo(summary.capturedAt)}` : "Awaiting first sync");

  return (
    <header className="site-header">
      <ScrollTracker />
      <Link className="brand" href={homeHref} aria-label="Blues Brothers guild command centre">
        <Image className="brand-logo" src="/bb-logo.webp" alt="" width={136} height={136} priority />
        <span><strong>Blues Brothers</strong><small>Guild command</small></span>
      </Link>
      <NavLinks items={SITE_NAVIGATION} />
      <div className="header-controls">
        <span className={`comms-status${commsLive ? " is-live" : ""}`} title={commsLabel}>
          <i aria-hidden="true" />
          {commsLabel}
        </span>
        <span className="version-label">{APP_VERSION}</span>
        <ThemeToggle />
        <AccountMenu />
        <a className="discord-button" href={discordUrl} target="_blank" rel="noreferrer" aria-label="Open Blues Brothers Discord">
          <span aria-hidden="true">◈</span><b>Open Discord</b>
        </a>
      </div>
      <MobileMenu discordUrl={discordUrl} />
    </header>
  );
}
