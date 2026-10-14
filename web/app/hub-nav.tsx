"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Ellipsis, House, MessageCircleQuestion, Users, type LucideIcon } from "lucide-react";
import { HUB_SECTIONS, sectionFor, type HubSectionKey } from "@/lib/hub-nav";
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
          <Image src="/bb-logo.webp" alt="" width={44} height={44} />
          <span><strong>Blues Brothers</strong><small>Guild hub</small></span>
        </Link>
        <nav className="hub-side-nav" aria-label="Main">
          {HUB_SECTIONS.map((section) => {
            const Icon = ICONS[section.key];
            return (
              <Link key={section.key} href={section.href} className={`hub-side-link${section.key === "ask" ? " is-ask" : ""}`} aria-current={active === section.key ? "page" : undefined}>
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span>{section.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hub-side-foot">
          <p>{viewer?.name ?? (isPreview ? "Steve" : "Signed in")}</p>
          <ThemeToggle />
        </div>
      </aside>
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
