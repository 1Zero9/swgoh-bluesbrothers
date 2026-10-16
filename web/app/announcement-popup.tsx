"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { ANNOUNCEMENT } from "@/lib/announcement";

const DELAY_MS = 1500;
const CHANGE_EVENT = "bb-announce-change";

function readSeen() {
  try { return window.localStorage.getItem("bb-announce-seen") ?? ""; } catch { return ""; }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function markSeen() {
  try { window.localStorage.setItem("bb-announce-seen", ANNOUNCEMENT.id); } catch { /* it just shows again next time */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * A floating announcement. It slides in a moment after Home opens, counts down (and waits while you point at it), and is
 * shown once per announcement on each device. Change the words in lib/announcement.ts.
 */
export default function AnnouncementPopup() {
  const seen = useSyncExternalStore(subscribe, readSeen, () => ANNOUNCEMENT.id);
  const [shown, setShown] = useState(false);
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const active = Boolean(ANNOUNCEMENT.enabled) && seen !== ANNOUNCEMENT.id;

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setShown(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  function close() {
    setLeaving(true);
    window.setTimeout(() => { markSeen(); setShown(false); setLeaving(false); }, 450);
  }

  useEffect(() => {
    if (!shown || paused || leaving) return;
    const timer = window.setTimeout(close, ANNOUNCEMENT.seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [shown, paused, leaving]);

  if (!active || !shown) return null;
  return (
    <aside
      className={`hub-announce${leaving ? " is-leaving" : ""}`}
      aria-label="Announcement"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="hub-announce-art" aria-hidden="true" />
      <i className="hub-announce-timer" key={String(paused)} style={{ animationDuration: `${ANNOUNCEMENT.seconds}s`, animationPlayState: paused ? "paused" : "running" }} aria-hidden="true" />
      <button type="button" className="hub-announce-close" onClick={close} aria-label="Close announcement"><X size={16} aria-hidden="true" /></button>
      <div className="hub-announce-body">
        <small>{ANNOUNCEMENT.label}</small>
        <h2>{ANNOUNCEMENT.title}</h2>
        <p>{ANNOUNCEMENT.text}</p>
        <div className="hub-announce-actions">
          <Link className="hub-announce-cta" href={ANNOUNCEMENT.href} onClick={markSeen}>{ANNOUNCEMENT.cta}</Link>
          <span>{ANNOUNCEMENT.quote}</span>
        </div>
      </div>
    </aside>
  );
}
