"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, Star, Ellipsis, House, MessageCircleQuestion, Users, type LucideIcon } from "lucide-react";
import { activeSidebarHref, DOCK_MENUS, HUB_SECTIONS, SIDEBAR_GROUPS, sectionFor, type HubSectionKey } from "@/lib/hub-nav";
import { parsePins, pinnedLinks, togglePin } from "@/lib/nav-pins";
import BlueFloat from "./blue-float";
import VisitBeacon from "./visit-beacon";
import RefreshButton from "./refresh-button";
import WhosOnline, { WhosOnlineInline } from "./whos-online";
import ThemeToggle from "./theme-toggle";
import { useViewer } from "./use-viewer";

const ICONS: Record<HubSectionKey, LucideIcon> = {
  home: House,
  ask: MessageCircleQuestion,
  know: BookOpen,
  guild: Users,
  more: Ellipsis,
};

const PREVIEW_PRESENCE = { site: [{ id: "1", name: "Steve", you: true }, { id: "2", name: "Dougie", you: false }, { id: "3", name: "Dex", you: false }], discord: [{ name: "dougie_bb", status: "online" }, { name: "dex", status: "idle" }], game: [{ id: "4", name: "Mara", ago: "35 min ago" }, { id: "5", name: "Kit", ago: "2 h ago" }], recent: [{ id: "6", name: "Dougie", ago: "12 min ago" }], discordHint: false };
const HUB_HINT_KEY = "bb-hub";
const PINS_KEY = "bb-menu-pins";
const PINS_EVENT = "bb-menu-pins-change";
const readPins = () => { try { return window.localStorage.getItem(PINS_KEY) ?? ""; } catch { return ""; } };
function subscribePins(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PINS_EVENT, onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener(PINS_EVENT, onChange); };
}
function savePins(pins: string[]) {
  try { window.localStorage.setItem(PINS_KEY, JSON.stringify(pins)); } catch { /* the favourites last for this visit */ }
  window.dispatchEvent(new Event(PINS_EVENT));
}
/** Every group starts folded so people can explore; the group holding the current page is open. */
const OPEN_BY_DEFAULT = new Set<string>();

/**
 * The member hub navigation: five sections, a sidebar on laptops and a tab bar on phones.
 * It only shows for signed-in members and officers. While we find that out, a remembered hint
 * (set before first paint in layout.tsx) keeps the old menu from flashing.
 */
export default function HubNav() {
  const pathname = usePathname();
  const viewer = useViewer(pathname);
  // The local preview page (development builds only) shows the navigation without a sign-in.
  const isPreview = process.env.NODE_ENV !== "production" && pathname.startsWith("/dev/hub");
  const isMember = isPreview || (viewer?.signedIn === true && (viewer.role === "MEMBER" || viewer.role === "OFFICER"));
  const active = sectionFor(pathname);
  const activeHref = activeSidebarHref(pathname);
  const isOfficer = isPreview || viewer?.role === "OFFICER";
  const isAdmin = isPreview || viewer?.isAdmin === true;
  const reviewCount = isPreview ? 4 : isOfficer ? viewer?.reviewCount ?? 0 : 0;
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const pins = parsePins(useSyncExternalStore(subscribePins, readPins, () => ""));
  const [dockOpen, setDockOpen] = useState<HubSectionKey | null>(null);
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) { setSeenPath(pathname); setDockOpen(null); }

  useEffect(() => {
    if (!viewer && !isPreview) return;
    document.documentElement.dataset.hub = isMember ? "on" : "off";
    try {
      if (isMember) window.localStorage.setItem(HUB_HINT_KEY, "1");
      else window.localStorage.removeItem(HUB_HINT_KEY);
    } catch {
      /* private mode: the menu may flash once per visit */
    }
  }, [viewer, isMember, isPreview]);

  useEffect(() => {
    if (!dockOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setDockOpen(null); };
    const onDown = (event: PointerEvent) => { if (!(event.target as Element | null)?.closest?.(".hub-tabs, .hub-dock-menu")) setDockOpen(null); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
  }, [dockOpen]);

  if (!isMember) return null;

  return (
    <>
      <aside className="hub-side" aria-label="Guild sections">
        <Link className="hub-side-brand" href="/" aria-label="Blues Brothers home">
          <Image src="/bb-emblem.webp" alt="" width={44} height={44} />
          <span><strong>Blues Brothers</strong><small>Guild hub</small></span>
        </Link>
        <nav className="hub-side-nav" aria-label="All pages">
          {(() => {
            const fixedGroup = SIDEBAR_GROUPS.find((group) => group.title === null);
            const groups = SIDEBAR_GROUPS.filter((group) => group.title !== null);
            const pinnable = groups.flatMap((group) => group.links).filter((link) => (!link.officerOnly || isOfficer) && (!link.adminOnly || isAdmin));
            const favourites = pinnedLinks(pins, pinnable);
            const renderLink = (link: { label: string; href: string }, pinnableLink: boolean) => (
              <div key={link.href} className="hub-side-row">
                <Link href={link.href} className={`hub-side-link${link.href === "/ask" ? " is-ask" : ""}${link.href === "/chat" ? " is-chat" : ""}`} aria-current={activeHref === link.href ? "page" : undefined}>
                  {link.href === "/ask" ? <MessageCircleQuestion className="hub-side-icon" size={14} aria-hidden="true" /> : <span className="hub-side-dot" aria-hidden="true" />}
                  <span>{link.label}</span>
                  {link.href === "/knowledge/review" && reviewCount > 0 ? <i className="hub-badge" aria-label={`${reviewCount} waiting for review`}>{reviewCount}</i> : null}
                </Link>
                {pinnableLink ? (
                  <button type="button" className={`hub-side-star${pins.includes(link.href) ? " is-on" : ""}`} aria-pressed={pins.includes(link.href)} aria-label={pins.includes(link.href) ? `Remove ${link.label} from favourites` : `Add ${link.label} to favourites`} title={pins.includes(link.href) ? "Unpin from favourites" : "Pin to favourites"} onClick={() => savePins(togglePin(pins, link.href))}>
                    <Star size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            );
            return (
              <>
                {fixedGroup ? <div className="hub-side-group">{fixedGroup.links.filter((link) => (!link.officerOnly || isOfficer) && (!link.adminOnly || isAdmin)).map((link) => renderLink(link, false))}</div> : null}
                {favourites.length ? (
                  <div className="hub-side-group hub-side-favs" aria-label="Favourites">
                    <p className="hub-side-favtitle"><Star size={11} aria-hidden="true" /> Favourites</p>
                    {favourites.map((link) => renderLink(link, true))}
                  </div>
                ) : null}
                {groups.map((group) => {
                  const links = group.links.filter((link) => (!link.officerOnly || isOfficer) && (!link.adminOnly || isAdmin));
                  if (!links.length) return null;
                  const title = group.title as string;
                  const hasActive = links.some((link) => link.href === activeHref);
                  const open = toggled[title] ?? (hasActive || OPEN_BY_DEFAULT.has(title));
                  return (
                    <div key={title} className={`hub-side-group${!open ? " is-folded" : ""}`}>
                      <button type="button" className="hub-side-title" aria-expanded={open} onClick={() => setToggled((value) => ({ ...value, [title]: !open }))}>
                        <ChevronRight size={12} aria-hidden="true" />
                        <span>{title}</span>
                        {title === "Officers" && reviewCount > 0 && !open ? <i className="hub-badge" aria-label={`${reviewCount} waiting for review`}>{reviewCount}</i> : null}
                      </button>
                      {open ? links.map((link) => renderLink(link, true)) : null}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </nav>
        <div className="hub-side-foot">
          <WhosOnline path={pathname} sample={isPreview ? PREVIEW_PRESENCE : undefined} />
          <RefreshButton label="Refresh the site" />
          <p>{viewer?.name ?? (isPreview ? "Steve" : "Signed in")}</p>
          <ThemeToggle />
        </div>
      </aside>
      {!isPreview ? <VisitBeacon path={pathname} /> : null}
      <WhosOnlineInline floating away={dockOpen !== null} />
      <BlueFloat />
      {dockOpen && DOCK_MENUS[dockOpen] ? (
        <div className="hub-dock-menu" role="menu" aria-label={`${HUB_SECTIONS.find((section) => section.key === dockOpen)?.label} menu`}>
          {DOCK_MENUS[dockOpen]!.map((group) => {
            const links = group.links.filter((link) => (!link.officerOnly || isOfficer) && (!link.adminOnly || isAdmin));
            if (!links.length) return null;
            return (
              <div key={group.title ?? "main"} className="hub-dock-group">
                {group.title ? <p>{group.title}</p> : null}
                <ul>{links.map((link) => <li key={link.href}><Link role="menuitem" href={link.href} aria-current={activeHref === link.href ? "page" : undefined} onClick={() => setDockOpen(null)}>{link.label}{link.href === "/knowledge/review" && reviewCount > 0 ? <i className="hub-badge" aria-label={`${reviewCount} waiting for review`}>{reviewCount}</i> : null}</Link></li>)}</ul>
              </div>
            );
          })}
        </div>
      ) : null}
      <nav className="hub-tabs" aria-label="Main">
        {HUB_SECTIONS.map((section) => {
          const Icon = ICONS[section.key];
          const hasMenu = Boolean(DOCK_MENUS[section.key]);
          const inner = (<><Icon size={22} strokeWidth={1.8} aria-hidden="true" /><span>{section.key === "ask" ? "Ask" : section.label}</span>{section.key === "more" && reviewCount > 0 ? <i className="hub-badge is-dot" aria-label={`${reviewCount} waiting for review`}>{reviewCount}</i> : null}</>);
          return hasMenu ? (
            <button key={section.key} type="button" aria-haspopup="menu" aria-expanded={dockOpen === section.key} className={`hub-tab-btn${dockOpen === section.key ? " is-open" : ""}`} aria-current={active === section.key ? "page" : undefined} onClick={() => setDockOpen(dockOpen === section.key ? null : section.key)}>{inner}</button>
          ) : (
            <Link key={section.key} href={section.href} className={section.key === "ask" ? "is-ask" : undefined} aria-current={active === section.key ? "page" : undefined}>{inner}</Link>
          );
        })}
      </nav>
    </>
  );
}
