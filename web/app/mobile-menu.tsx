"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./theme-toggle";

type MobileMenuProps = {
  items: Array<{ label: string; mark: string; href: string }>;
  version: string;
  discordUrl: string;
  syncLabel: string;
  live?: boolean;
};

export default function MobileMenu({ items, version, discordUrl, syncLabel, live = false }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/#guild-wire") {
      return pathname === "/";
    }
    const cleanHref = href.split("#")[0].split("?")[0];
    if (!cleanHref) return false;
    return pathname === cleanHref || pathname.startsWith(cleanHref + "/");
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
                const active = isActive(item.href);
                return (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    key={item.label}
                    className={active ? "active" : ""}
                  >
                    <span>{item.mark}</span>
                    <strong>{item.label}</strong>
                    <b aria-hidden="true">→</b>
                  </Link>
                );
              })}
            </nav>

            <div className="drawer-footer">
              <div><span>Colour mode</span><ThemeToggle /></div>
              <a className="drawer-discord" href={discordUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">◈</span> Open Discord</a>
              <p className={live ? "is-live" : ""}><i aria-hidden="true" /> {syncLabel}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
