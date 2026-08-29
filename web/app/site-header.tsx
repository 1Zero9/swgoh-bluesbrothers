import Image from "next/image";
import Link from "next/link";
import packageInfo from "../package.json";
import { getDashboardSummary } from "@/lib/dashboard";
import { getDiscordUrl } from "@/lib/discord";
import MobileMenu from "./mobile-menu";
import ThemeToggle from "./theme-toggle";
import NavLinks from "./nav-links";
import ScrollTracker from "./scroll-tracker";

export const APP_VERSION = `v${packageInfo.version}`;

export const SITE_NAVIGATION = [
  { label: "Guild Wire", mark: "GW", href: "/#guild-wire" },
  { label: "Operations", mark: "OP", href: "/operations" },
  { label: "Territory War", mark: "TW", href: "/territory-war" },
  { label: "Members", mark: "MB", href: "/members" },
  { label: "Cantina", mark: "SF", href: "/cantina" },
  { label: "Dougie's Discs", mark: "DD", href: "/dougies-discs" },
  { label: "Officer Roster", mark: "OR", href: "/officer/roster" },
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
        <a className="discord-button" href={discordUrl} target="_blank" rel="noreferrer" aria-label="Open Blues Brothers Discord">
          <span aria-hidden="true">◈</span><b>Open Discord</b>
        </a>
      </div>
      <MobileMenu items={SITE_NAVIGATION} version={APP_VERSION} discordUrl={discordUrl} syncLabel={commsLabel} live={commsLive} />
    </header>
  );
}
