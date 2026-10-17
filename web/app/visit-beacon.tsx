"use client";

import { useEffect } from "react";

const KEY = "bb-last-visit";
const EVERY_MS = 30 * 60_000;

/** Tells the site a member is here, at most once every half hour per device. Renders nothing. */
export default function VisitBeacon({ path }: { path: string }) {
  useEffect(() => {
    try {
      const last = Number(window.localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < EVERY_MS) return;
      window.localStorage.setItem(KEY, String(Date.now()));
    } catch { /* private mode: it just reports each visit */ }
    void fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }), keepalive: true }).catch(() => undefined);
  }, [path]);
  return null;
}
