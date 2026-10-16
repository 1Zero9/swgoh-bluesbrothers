"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Pencil, X } from "lucide-react";
import type { Announcement } from "@/lib/announcement";

const DELAY_MS = 1500;
const CHANGE_EVENT = "bb-announce-change";
const SEEN_KEY = "bb-announce-seen";

function readSeen() {
  try { return window.localStorage.getItem(SEEN_KEY) ?? ""; } catch { return ""; }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function markSeen(key: string) {
  try { window.localStorage.setItem(SEEN_KEY, key); } catch { /* it just shows again next time */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * A floating announcement an officer edits on the site. It slides in a moment after Home opens, counts down (and waits
 * while you point at it), and shows once per saved version on each device.
 */
export default function AnnouncementPopup({ announcement, isOfficer = false, preview = false }: { announcement: Announcement; isOfficer?: boolean; preview?: boolean }) {
  const key = `v${announcement.version}`;
  const seen = useSyncExternalStore(subscribe, readSeen, () => key);
  const [shown, setShown] = useState(preview);
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const active = preview || (announcement.enabled && seen !== key);

  useEffect(() => {
    if (!active || preview) return;
    const timer = window.setTimeout(() => setShown(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, preview]);

  function close() {
    if (preview) return;
    setLeaving(true);
    window.setTimeout(() => { markSeen(key); setShown(false); setLeaving(false); }, 450);
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
              ? <a className="hub-announce-cta" href={announcement.href} target="_blank" rel="noreferrer" onClick={() => markSeen(key)}>{announcement.cta}</a>
              : <Link className="hub-announce-cta" href={announcement.href} onClick={() => markSeen(key)}>{announcement.cta}</Link>}
          {announcement.quote ? <em>{announcement.quote}</em> : null}
        </div>
        {isOfficer && !preview ? <Link className="hub-announce-edit" href="/officer/announcement"><Pencil size={12} aria-hidden="true" /> Edit announcement</Link> : null}
      </div>
    </aside>
  );
}
