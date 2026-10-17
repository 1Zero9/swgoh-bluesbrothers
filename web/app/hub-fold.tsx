"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const QUERY = "(max-width: 759.98px)";
const subscribe = (onChange: () => void) => {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};

/**
 * On a phone the box folds to one tappable line (a title and a short summary) so the page is calm;
 * tap it to open the whole thing. On a laptop it is simply the box, always open.
 */
export default function HubFold({ title, summary, tone, children }: { title: string; summary: string; tone?: "alert"; children: ReactNode }) {
  const phone = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  const [open, setOpen] = useState(false);
  if (!phone) return <>{children}</>;
  return (
    <div className={`hub-fold${open ? " is-open" : ""}${tone === "alert" ? " is-alert" : ""}`}>
      <button type="button" className="hub-fold-head" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span><strong>{title}</strong><small>{summary}</small></span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open ? <div className="hub-fold-body">{children}</div> : null}
    </div>
  );
}
