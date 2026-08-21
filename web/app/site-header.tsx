import Image from "next/image";
import Link from "next/link";
import packageInfo from "../package.json";
import { getDiscordUrl } from "@/lib/discord";
import MobileMenu from "./mobile-menu";
import ThemeToggle from "./theme-toggle";

export const APP_VERSION = `v${packageInfo.version}`;

export const SITE_NAVIGATION = [
  { label: "Guild Wire", mark: "GW", href: "/#guild-wire" },
  { label: "Operations", mark: "OP", href: "/operations" },
  { label: "Territory War", mark: "TW", href: "/territory-war" },
  { label: "Members", mark: "MB", href: "/members" },
  { label: "Cantina", mark: "SF", href: "/cantina" },
];

function NavMark({ label }: { label: string }) {
  return <span className="nav-mark" aria-hidden="true">{label}</span>;
}

export default function SiteHeader({
  homeHref = "#top",
  syncLabel = "Guild command online",
}: {
  homeHref?: string;
  syncLabel?: string;
}) {
  const discordUrl = getDiscordUrl();

  return (
    <header className="site-header">
      <Link className="brand" href={homeHref} aria-label="Blues Brothers guild command centre">
        <Image className="brand-logo" src="/bb-logo.webp" alt="" width={136} height={136} priority />
        <span><strong>Blues Brothers</strong><small>Guild command</small></span>
      </Link>
      <nav className="main-nav" aria-label="Primary navigation">
        {SITE_NAVIGATION.map((item) => (
          <Link className="nav-link" href={item.href} key={item.label}>
            <NavMark label={item.mark} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="header-controls">
        <span className="version-label">{APP_VERSION}</span>
        <ThemeToggle />
        <a className="discord-button" href={discordUrl} target="_blank" rel="noreferrer" aria-label="Open Blues Brothers Discord">
          <span aria-hidden="true">◈</span><b>Open Discord</b>
        </a>
      </div>
      <MobileMenu items={SITE_NAVIGATION} version={APP_VERSION} discordUrl={discordUrl} syncLabel={syncLabel} />
    </header>
  );
}
