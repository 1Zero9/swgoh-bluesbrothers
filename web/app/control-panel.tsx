"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { BookOpen, ChevronsDownUp, ChevronsUpDown, ClipboardCheck, Megaphone, MessageCircle, MessageCircleQuestion, RotateCcw, Shield, Sparkles, Swords, Users, X, Bell, Ticket, LayoutGrid, Trophy } from "lucide-react";
import ThemeToggle from "./theme-toggle";

type Tab = "overview" | "setup" | "shortcuts" | "officers";

const PANEL_KEY = "bb-panel";
const PANEL_EVENT = "bb-panel-change";

type Saved = { tab: Tab; expanded: boolean };

function readRaw() {
  try { return window.localStorage.getItem(PANEL_KEY) ?? ""; } catch { return ""; }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PANEL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PANEL_EVENT, onChange);
  };
}

function parse(raw: string): Saved {
  try {
    const value = JSON.parse(raw || "{}") as Partial<Saved>;
    const tab = value.tab === "setup" || value.tab === "shortcuts" || value.tab === "officers" ? value.tab : "overview";
    return { tab, expanded: value.expanded === true };
  } catch {
    return { tab: "overview", expanded: false };
  }
}

function save(value: Saved) {
  try { window.localStorage.setItem(PANEL_KEY, JSON.stringify(value)); } catch { /* it just resets next visit */ }
  window.dispatchEvent(new Event(PANEL_EVENT));
}

const SHORTCUTS = [
  { href: "/ask", label: "Ask B-Lue3", icon: MessageCircleQuestion },
  { href: "/knowledge", label: "Add what you know", icon: BookOpen },
  { href: "/chat", label: "Guild chat", icon: MessageCircle },
  { href: "/members#who-has", label: "Who has…?", icon: Users },
  { href: "/territory-war", label: "Territory War", icon: Swords },
  { href: "/raids", label: "Raids", icon: Ticket },
  { href: "/wins", label: "The Wins", icon: Trophy },
  { href: "/more", label: "Notifications", icon: Bell },
];

/**
 * The player's control panel, top right of Home. Small it shows who you are and what needs doing; expanded it has tabs for
 * your standing, the setup steps, shortcuts and settings, and (for officers) the officer tools.
 */
export default function ControlPanel({
  name, standing, checkIn, isOfficer, reviewCount, questions, checklist, finished, total, setupHidden, onFold,
}: {
  name: string | null;
  standing: string | null;
  checkIn: string | null;
  isOfficer: boolean;
  reviewCount: number;
  questions: { left: number; limit: number; resetsLabel: string } | null;
  checklist: ReactNode;
  finished: number;
  total: number;
  setupHidden: boolean;
  onFold: () => void;
}) {
  const { tab, expanded } = parse(useSyncExternalStore(subscribe, readRaw, () => ""));

  function pick(next: Tab) { save({ tab: next, expanded }); }
  function toggle() { save({ tab, expanded: !expanded }); }

  const parts = (standing ?? "").split(" · ").filter(Boolean);
  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: "overview", label: "Overview" },
    ...(setupHidden ? [] : [{ key: "setup" as const, label: "Setup", badge: `${finished}/${total}` }]),
    { key: "shortcuts", label: "Shortcuts" },
    ...(isOfficer ? [{ key: "officers" as const, label: "Officers", badge: reviewCount ? String(reviewCount) : undefined }] : []),
  ];
  const active = tabs.some((item) => item.key === tab) ? tab : "overview";

  function resetLayout() {
    try { window.localStorage.removeItem("bb-home-layout"); } catch { /* nothing saved */ }
    window.dispatchEvent(new Event("bb-home-layout-change"));
  }

  function replayAnnouncement() {
    try { window.localStorage.removeItem("bb-announce-seen"); } catch { /* nothing saved */ }
    window.location.reload();
  }

  return (
    <div className={`hub-banner-side hub-side-panel hub-cpanel${expanded ? " is-expanded" : ""}`} aria-label="Your control panel">
      <div className="hub-cpanel-bar">
        <strong>{name ?? "You"}</strong>
        <span className="hub-cpanel-tools">
          <button type="button" onClick={toggle} aria-expanded={expanded} aria-label={expanded ? "Make the panel smaller" : "Expand the control panel"} title={expanded ? "Smaller" : "Expand"}>
            {expanded ? <ChevronsDownUp size={15} aria-hidden="true" /> : <ChevronsUpDown size={15} aria-hidden="true" />}
          </button>
          <button type="button" onClick={onFold} aria-label="Close and keep a small button" title="Close"><X size={15} aria-hidden="true" /></button>
        </span>
      </div>

      {expanded ? (
        <div className="hub-cpanel-tabs" role="tablist" aria-label="Control panel">
          {tabs.map((item) => (
            <button key={item.key} type="button" role="tab" aria-selected={active === item.key} className={active === item.key ? "is-on" : undefined} onClick={() => pick(item.key)}>
              {item.label}{item.badge ? <i>{item.badge}</i> : null}
            </button>
          ))}
        </div>
      ) : null}

      {!expanded ? (
        <>
          {standing ? (
            <Link className={`hub-standing${checkIn ? " needs-checkin" : ""}`} href="/me">
              <small>{standing}</small>
              <span>{checkIn ?? "All good. Open my page"}</span>
            </Link>
          ) : null}
          {setupHidden ? null : checklist}
          {isOfficer && reviewCount > 0 ? <Link className="hub-cpanel-nudge" href="/knowledge/review"><ClipboardCheck size={14} aria-hidden="true" /> {reviewCount} waiting for your check</Link> : null}
        </>
      ) : null}

      {expanded && active === "overview" ? (
        <div className="hub-cpanel-body">
          {parts.length ? (
            <ul className="hub-cpanel-tiles">
              {parts.map((part) => <li key={part}><strong>{part.split(" ")[0]}</strong><small>{part.split(" ").slice(1).join(" ")}</small></li>)}
              {questions ? <li><strong>{questions.left}</strong><small>B-Lue3 questions left</small></li> : null}
            </ul>
          ) : <p className="hub-cpanel-note">Link your game account to see your standing here.</p>}
          <Link className={`hub-standing${checkIn ? " needs-checkin" : ""}`} href="/me">
            <small>{checkIn ? "Your guild check-in" : "Your guild check-in"}</small>
            <span>{checkIn ?? "All good. Open my page"}</span>
          </Link>
          {questions ? <p className="hub-cpanel-note">Questions to B-Lue3 reset {questions.resetsLabel}.</p> : null}
        </div>
      ) : null}

      {expanded && active === "setup" ? <div className="hub-cpanel-body">{checklist}</div> : null}

      {expanded && active === "shortcuts" ? (
        <div className="hub-cpanel-body">
          <ul className="hub-cpanel-grid">
            {SHORTCUTS.map((item) => (
              <li key={item.href}><Link href={item.href}><item.icon size={16} aria-hidden="true" />{item.label}</Link></li>
            ))}
          </ul>
          <div className="hub-cpanel-settings">
            <p className="hub-cpanel-note">Theme</p>
            <ThemeToggle />
            <div className="hub-cpanel-actions">
              <button type="button" onClick={resetLayout}><LayoutGrid size={14} aria-hidden="true" /> Reset Home layout</button>
              <button type="button" onClick={replayAnnouncement}><RotateCcw size={14} aria-hidden="true" /> Replay announcement</button>
            </div>
          </div>
        </div>
      ) : null}

      {expanded && active === "officers" && isOfficer ? (
        <div className="hub-cpanel-body">
          <ul className="hub-cpanel-grid is-officer">
            <li><Link href="/knowledge/review"><ClipboardCheck size={16} aria-hidden="true" />Review queue{reviewCount ? <i>{reviewCount}</i> : null}</Link></li>
            <li><Link href="/officer/announcement"><Megaphone size={16} aria-hidden="true" />Announcement</Link></li>
            <li><Link href="/officer/roster"><Shield size={16} aria-hidden="true" />Roster report</Link></li>
            <li><Link href="/officer/discord-sync"><Sparkles size={16} aria-hidden="true" />Discord sync</Link></li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
