"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * A section that is always open on a laptop and tucked behind its title on a phone, so a long page
 * stays short where scrolling is costly. It renders open first, then closes itself on small screens
 * (deferred, so it passes the set-state-in-effect lint rule).
 */
export default function PhoneFold({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.matchMedia("(max-width: 760px)").matches) setOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <details className={`phone-fold ${className}`.trim()} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{title}</summary>
      {children}
    </details>
  );
}
