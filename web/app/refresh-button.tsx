"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

/**
 * A fresh start for this site only: forgets the site's saved pages and background worker, then reloads.
 * It never touches other tabs or apps, and keeps you signed in and keeps your settings (theme, layout, favourites).
 */
export default function RefreshButton({ label = "Refresh", className = "" }: { label?: string; className?: string }) {
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (busy) return;
    setBusy(true);
    try {
      if ("caches" in window) await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
      if ("serviceWorker" in navigator) await Promise.all((await navigator.serviceWorker.getRegistrations()).map((registration) => registration.unregister()));
      window.sessionStorage.clear();
    } catch { /* a plain reload below still works */ }
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(Date.now()));
    window.location.replace(url.toString());
  }

  return (
    <button type="button" className={`refresh-btn ${className}`} onClick={() => void refresh()} disabled={busy} aria-label="Refresh this site" title="Refresh this site">
      <RotateCw size={16} aria-hidden="true" className={busy ? "is-spinning" : undefined} />
      {label ? <span>{busy ? "Refreshing…" : label}</span> : null}
    </button>
  );
}
