"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountMenu from "./account-menu";
import { signOutEverywhere } from "./sign-out";
import ThemeToggle from "./theme-toggle";
import { useViewer } from "./use-viewer";

type MobileMenuProps = { discordUrl: string };

type MenuLink = { label: string; href: string };
type MenuGroup = { title?: string; links: MenuLink[] };

/** A short, flat menu that fits on one screen: only what the viewer can actually open. */
function menuFor(role: "OFFICER" | "MEMBER" | "PUBLIC" | null): MenuGroup[] {
  if (role === "MEMBER" || role === "OFFICER") {
    const groups: MenuGroup[] = [
      {
        links: [
          { label: "Home", href: "/" },
          { label: "My page", href: "/me" },
          { label: "The Wins", href: "/wins" },
        ],
      },
      {
        title: "Guild",
        links: [
          { label: "Roster", href: "/members" },
          { label: "Territory War", href: "/territory-war" },
          { label: "Territory Battles", href: "/territory-battles" },
          { label: "Raids", href: "/raids" },
          { label: "Datacrons", href: "/datacrons" },
          { label: "Arsenal", href: "/arsenal" },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Field guides", href: "/guides" },
          { label: "Cantina & music", href: "/cantina" },
        ],
      },
    ];
    if (role === "OFFICER") {
      groups.push({
        title: "Officers",
        links: [
          { label: "Roster report", href: "/officer/roster" },
          { label: "Discord sync", href: "/officer/discord-sync" },
        ],
      });
    }
    return groups;
  }
  return [
    {
      links: [
        { label: "Home", href: "/" },
        { label: "How to join", href: "/#join" },
        { label: "Field guides", href: "/guides" },
        { label: "Cantina & music", href: "/cantina" },
        { label: "The game", href: "/mission-from-god" },
      ],
    },
  ];
}

export default function MobileMenu({ discordUrl }: MobileMenuProps) {
  const pathname = usePathname();
  // Open is tied to the page it was opened on, so navigating anywhere closes the drawer.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (value: boolean) => setOpenAt(value ? pathname : null);
  const viewer = useViewer(pathname);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function isActive(href: string) {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  }

  const groups = menuFor(viewer?.signedIn ? viewer.role : "PUBLIC");

  return (
    <div className="mobile-menu">
      <button
        className="menu-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <i /><i /><i />
      </button>

      {open
        ? createPortal(
            <div className="drawer-layer">
              <button className="drawer-backdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />
              <aside className="menu-drawer drawer-simple" id="mobile-navigation" aria-label="Mobile navigation">
                <div className="drawer-simple-top">
                  <AccountMenu variant="drawer" />
                  <button className="drawer-close" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} autoFocus>×</button>
                </div>

                <nav className="drawer-simple-nav" aria-label="Site navigation">
                  {groups.map((group, index) => (
                    <div key={group.title ?? index} className={`drawer-simple-group${group.title && group.links.length >= 2 ? " is-grid" : ""}`}>
                      {group.title ? <p>{group.title}</p> : null}
                      {group.links.map((link) => (
                        <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={isActive(link.href) ? "active" : undefined}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>

                <div className="drawer-simple-foot">
                  <a href={discordUrl} target="_blank" rel="noreferrer">Open Discord</a>
                  <ThemeToggle />
                </div>
                {viewer?.signedIn ? (
                  <button type="button" className="drawer-signout" onClick={() => void signOutEverywhere()}>Sign out</button>
                ) : null}
              </aside>
            </div>,
            // Rendered into <body>: inside the header it would be sized against the header itself
            // whenever the header has a backdrop blur (once the page is scrolled).
            document.body,
          )
        : null}
    </div>
  );
}
