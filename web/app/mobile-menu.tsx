"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ThemeToggle from "./theme-toggle";

type MobileMenuProps = {
  items: string[][];
  version: string;
};

export default function MobileMenu({ items, version }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

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
                <Image src="/bb-logo.png" alt="" width={82} height={82} />
                <div><strong>Blues Brothers</strong><span>Guild command · {version}</span></div>
              </div>
              <button className="drawer-close" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} autoFocus>×</button>
            </div>

            <nav className="drawer-nav" aria-label="Drawer navigation">
              {items.map(([label, mark]) => (
                <a href={`#${label.toLowerCase().replaceAll(" ", "-")}`} onClick={() => setOpen(false)} key={label}>
                  <span>{mark}</span>
                  <strong>{label}</strong>
                  <b aria-hidden="true">→</b>
                </a>
              ))}
            </nav>

            <div className="drawer-footer">
              <div><span>Colour mode</span><ThemeToggle /></div>
              <button className="drawer-discord" type="button" disabled><span aria-hidden="true">◈</span> Connect Discord</button>
              <p><i /> Comlink connected · Last capture 18 Aug, 23:00</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
