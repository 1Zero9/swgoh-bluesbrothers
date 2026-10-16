"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, Ellipsis, House, MessageCircleQuestion, Users, type LucideIcon } from "lucide-react";
import { activeSidebarHref, HUB_SECTIONS, SIDEBAR_GROUPS, sectionFor, type HubSectionKey } from "@/lib/hub-nav";
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
/** Groups a member uses every day start open; the rest fold away until their page is the current one. */
const OPEN_BY_DEFAULT = new Set(["Knowledge", "Guild", "War room"]);

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
      <nav className="hub-tabs" aria-label="Main">
        {HUB_SECTIONS.map((section) => {
          const Icon = ICONS[section.key];
          return (
            <Link key={section.key} href={section.href} className={section.key === "ask" ? "is-ask" : undefined} aria-current={active === section.key ? "page" : undefined}>
              <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
              <span>{section.key === "ask" ? "Ask" : section.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
