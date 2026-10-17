"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, Ellipsis, House, MessageCircleQuestion, Users, type LucideIcon } from "lucide-react";
import { activeSidebarHref, DOCK_MENUS, HUB_SECTIONS, SIDEBAR_GROUPS, sectionFor, type HubSectionKey } from "@/lib/hub-nav";
import BlueFloat from "./blue-float";
import ThemeToggle from "./theme-toggle";
import { useViewer } from "./use-viewer";

const ICONS: Record<HubSectionKey, LucideIcon> = {
  home: House,
  ask: MessageCircleQuestion,
  know: BookOpen,
  guild: Users,
  more: Ellipsis,
};

const HUB_HINT_KEY = "bb-hub";
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
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
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
          {SIDEBAR_GROUPS.map((group) => {
            const links = group.links.filter((link) => !link.officerOnly || isOfficer);
            if (!links.length) return null;
            const title = group.title;
            const hasActive = links.some((link) => link.href === activeHref);
            const open = title === null || (toggled[title] ?? (hasActive || OPEN_BY_DEFAULT.has(title)));
            return (
              <div key={title ?? "top"} className={`hub-side-group${title && !open ? " is-folded" : ""}`}>
                {title ? (
                  <button type="button" className="hub-side-title" aria-expanded={open} onClick={() => setToggled((value) => ({ ...value, [title]: !open }))}>
                    <ChevronRight size={12} aria-hidden="true" />
                    <span>{title}</span>
                  </button>
                ) : null}
                {open ? links.map((link) => (
                  <Link key={link.href} href={link.href} className={`hub-side-link${link.href === "/ask" ? " is-ask" : ""}${link.href === "/chat" ? " is-chat" : ""}`} aria-current={activeHref === link.href ? "page" : undefined}>
                    {link.href === "/ask" ? <MessageCircleQuestion className="hub-side-icon" size={14} aria-hidden="true" /> : <span className="hub-side-dot" aria-hidden="true" />}
                    <span>{link.label}</span>
                  </Link>
                )) : null}
              </div>
            );
          })}
        </nav>
        <div className="hub-side-foot">
          <p>{viewer?.name ?? (isPreview ? "Steve" : "Signed in")}</p>
          <ThemeToggle />
        </div>
      </aside>
      <BlueFloat />
      {dockOpen && DOCK_MENUS[dockOpen] ? (
        <div className="hub-dock-menu" role="menu" aria-label={`${HUB_SECTIONS.find((section) => section.key === dockOpen)?.label} menu`}>
          {DOCK_MENUS[dockOpen]!.map((group) => {
            const links = group.links.filter((link) => !link.officerOnly || isOfficer);
            if (!links.length) return null;
            return (
              <div key={group.title ?? "main"} className="hub-dock-group">
                {group.title ? <p>{group.title}</p> : null}
                <ul>{links.map((link) => <li key={link.href}><Link role="menuitem" href={link.href} aria-current={activeHref === link.href ? "page" : undefined} onClick={() => setDockOpen(null)}>{link.label}</Link></li>)}</ul>
              </div>
            );
          })}
        </div>
      ) : null}
      <nav className="hub-tabs" aria-label="Main">
        {HUB_SECTIONS.map((section) => {
          const Icon = ICONS[section.key];
          const hasMenu = Boolean(DOCK_MENUS[section.key]);
          const inner = (<><Icon size={22} strokeWidth={1.8} aria-hidden="true" /><span>{section.key === "ask" ? "Ask" : section.label}</span></>);
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
