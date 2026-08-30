"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavCategoryItem } from "./site-header";
import ThemeToggle from "./theme-toggle";
import { BuiltByBadge } from "./built-by-badge";

type MobileMenuProps = {
  items: NavCategoryItem[];
  version: string;
  discordUrl: string;
  syncLabel: string;
  live?: boolean;
};

export default function MobileMenu({ items, version, discordUrl, syncLabel, live = false }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    Operations: true,
    Roster: false,
    "Cantina & Music": false,
    "Officer Deck": false,
    "Field Guides": true,
  });
  const pathname = usePathname();

  function isChildActive(href: string) {
    if (href.startsWith("/#")) return false;
    const cleanHref = href.split("#")[0].split("?")[0];
    if (!cleanHref || cleanHref === "/") return pathname === "/";
    return pathname === cleanHref || pathname.startsWith(cleanHref + "/");
  }

  function toggleAccordion(label: string) {
    setOpenAccordion((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

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

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

      {open && (
        <div className="drawer-layer">
          <button className="drawer-backdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="menu-drawer" id="mobile-navigation" aria-label="Mobile navigation">
            <div className="drawer-heading">
              <div className="drawer-brand">
                <Image src="/bb-logo.webp" alt="" width={82} height={82} />
                <div><strong>Blues Brothers</strong><span>Guild command · {version}</span></div>
              </div>
              <button className="drawer-close" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} autoFocus>×</button>
            </div>

            <nav className="drawer-nav" aria-label="Drawer navigation">
              {items.map((item) => {
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const isAccordionOpen = Boolean(openAccordion[item.label]);

                if (!hasChildren) {
                  const active = isChildActive(item.href);
                  return (
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      key={item.label}
                      className={`drawer-single-link${active ? " active" : ""}`}
                    >
                      <span className="drawer-mark">{item.mark}</span>
                      <strong>{item.label}</strong>
                      <b aria-hidden="true">→</b>
                    </Link>
                  );
                }

                return (
                  <div key={item.label} className="drawer-section">
                    <button
                      type="button"
                      className={`drawer-section-toggle${isAccordionOpen ? " is-open" : ""}`}
                      onClick={() => toggleAccordion(item.label)}
                    >
                      <div className="drawer-sec-title">
                        <span className="drawer-mark">{item.mark}</span>
                        <strong>{item.label}</strong>
                      </div>
                      <span className="drawer-chevron">{isAccordionOpen ? "▴" : "▾"}</span>
                    </button>

                    {isAccordionOpen && item.children && (
                      <div className="drawer-sub-list">
                        {item.children.map((child) => {
                          const childActive = isChildActive(child.href);
                          return (
                            <Link
                              key={child.label}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={`drawer-sub-item${childActive ? " active" : ""}`}
                            >
                              <span className="drawer-sub-icon">{child.icon || "◈"}</span>
                              <div className="drawer-sub-text">
                                <strong>{child.label}</strong>
                                {child.description && <small>{child.description}</small>}
                              </div>
                              <span className="drawer-sub-mark">{child.mark}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="drawer-footer">
              <div className="drawer-footer-controls">
                <span>Colour mode</span>
                <ThemeToggle />
              </div>
              <a className="drawer-discord" href={discordUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">◈</span> Open Discord</a>
              <div className="drawer-footer-bottom">
                <BuiltByBadge />
                <p className={live ? "is-live" : ""}><i aria-hidden="true" /> {syncLabel}</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
