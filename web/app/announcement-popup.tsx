"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import type { Announcement } from "@/lib/announcement";

const DELAY_MS = 1500;
/** Coming back after this long counts as a new visit, so the announcement shows again. */
const NEW_VISIT_MS = 4 * 60 * 60 * 1000;
const SEEN_KEY = "bb-announce-seen";

/** What this device last showed: which saved version, and when. */
function lastShown(): { version: string; at: number } | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "null") as { version?: unknown; at?: unknown } | null;
    return value && typeof value.version === "string" && typeof value.at === "number" ? { version: value.version, at: value.at } : null;
  } catch { return null; }
}

function markShown(version: string) {
  try { window.localStorage.setItem(SEEN_KEY, JSON.stringify({ version, at: Date.now() })); } catch { /* it just shows again next time */ }
}

/**
 * A floating announcement an officer edits on the site. It slides in a moment after Home opens, counts down (and waits
 * while you point at it). It shows on the first visit to Home, then not again until you come back hours later or an officer
 * saves a new version.
 */
export default function AnnouncementPopup({ announcement, isOfficer = false, preview = false }: { announcement: Announcement; isOfficer?: boolean; preview?: boolean }) {
  const key = `v${announcement.version}`;
  const [shown, setShown] = useState(preview);
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const active = preview || announcement.enabled;

  useEffect(() => {
    if (!active || preview) return;
    const last = lastShown();
    if (last && last.version === key && Date.now() - last.at < NEW_VISIT_MS) return;
    const timer = window.setTimeout(() => { markShown(key); setShown(true); }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, preview, key]);

  function close() {
    if (preview) return;
    setLeaving(true);
    window.setTimeout(() => { setShown(false); setLeaving(false); }, 450);
  }

  useEffect(() => {
    if (!shown || paused || leaving || preview) return;
    const timer = window.setTimeout(close, announcement.seconds * 1000);
    return () => window.clearTimeout(timer);
    // close only reads values that are already in this list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, paused, leaving, preview, announcement.seconds]);

  if (!active || !shown) return null;
  const external = /^https:/.test(announcement.href);
  return (
    <aside
      className={`hub-announce${leaving ? " is-leaving" : ""}${preview ? " is-preview" : ""}`}
      aria-label="Announcement"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="hub-announce-art" aria-hidden="true" />
      {preview ? null : <i className="hub-announce-timer" key={String(paused)} style={{ animationDuration: `${announcement.seconds}s`, animationPlayState: paused ? "paused" : "running" }} aria-hidden="true" />}
      {preview ? null : <button type="button" className="hub-announce-close" onClick={close} aria-label="Close announcement"><X size={16} aria-hidden="true" /></button>}
      <div className="hub-announce-body">
        <small>{announcement.label}</small>
        <h2>{announcement.title}</h2>
        {announcement.text ? <p>{announcement.text}</p> : null}
        <div className="hub-announce-actions">
          {preview
            ? <span className="hub-announce-cta">{announcement.cta}</span>
            : external
              ? <a className="hub-announce-cta" href={announcement.href} target="_blank" rel="noreferrer">{announcement.cta}</a>
              : <Link className="hub-announce-cta" href={announcement.href}>{announcement.cta}</Link>}
          {announcement.quote ? <em>{announcement.quote}</em> : null}
        </div>
        {isOfficer && !preview ? <Link className="hub-announce-edit" href="/officer/announcement"><Pencil size={12} aria-hidden="true" /> Edit announcement</Link> : null}
      </div>
    </aside>
  );
}
