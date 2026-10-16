"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { Check, ListChecks, X } from "lucide-react";

type Step = { key: string; title: string; hint: string; href: string };
type Saved = { done: string[]; hidden: boolean; folded: boolean };

const STORAGE_KEY = "bb-get-started";
const CHANGE_EVENT = "bb-get-started-change";

function readRaw() {
  try { return window.localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function parse(raw: string): Saved {
  try {
    const value = JSON.parse(raw || "{}") as Partial<Saved>;
    return { done: Array.isArray(value.done) ? value.done : [], hidden: value.hidden === true, folded: value.folded === true };
  } catch {
    return { done: [], hidden: false, folded: false };
  }
}

function write(value: Saved) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* progress lasts for this visit */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** A short first-visit checklist. The account step comes from the server; the others tick when you open them. */
export default function GetStarted({ linked, steps, compact = false, aside, alert = false }: { linked: boolean; steps: Step[]; compact?: boolean; aside?: ReactNode; alert?: boolean }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const { done, hidden, folded } = parse(raw);

  function save(nextDone: string[], nextHidden: boolean, nextFolded = folded) {
    write({ done: nextDone, hidden: nextHidden, folded: nextFolded });
  }

  const finished = steps.filter((step) => done.includes(step.key)).length + (linked ? 1 : 0);
  const total = steps.length + 1;
  const nextKey = linked ? steps.find((step) => !done.includes(step.key))?.key : "link";

  const list = (
    <section className={compact ? "hub-start is-compact" : "hub-card hub-start"} aria-labelledby="hub-start-title">
      <div className="hub-start-head">
        <h2 id="hub-start-title">{compact ? "Welcome to the guild" : "Get started"}</h2>
        <span className="hub-badge">{finished} of {total}</span>
      </div>
      <ul>
        <li className={`${linked ? "is-done" : ""}${nextKey === "link" ? " is-next" : ""}`.trim() || undefined}>
          <span className="hub-tick">{linked ? <Check size={14} aria-hidden="true" /> : null}</span>
          <span><strong>Link your game account</strong><small>{linked ? "Done. Your ally code is matched." : "Sign in with Discord and enter your ally code."}</small></span>
        </li>
        {steps.map((step) => {
          const isDone = done.includes(step.key);
          return (
            <li key={step.key} className={`${isDone ? "is-done" : ""}${nextKey === step.key ? " is-next" : ""}`.trim() || undefined}>
              <span className="hub-tick">{isDone ? <Check size={14} aria-hidden="true" /> : null}</span>
              <Link href={step.href} onClick={() => save(done.includes(step.key) ? done : [...done, step.key], false)}>
                <strong>{step.title}</strong><small>{step.hint}</small>
              </Link>
            </li>
          );
        })}
      </ul>
      <button type="button" className="hub-text-button" onClick={() => save(done, true)}>{finished >= total ? "All done. Hide this" : "Dismiss"}</button>
    </section>
  );

  if (!compact) return hidden ? null : list;
  if (hidden && !aside) return null;

  if (folded) {
    return (
      <button type="button" className={`hub-setup-pill${alert ? " has-alert" : ""}${hidden ? "" : finished < total || alert ? " is-pulsing" : ""}`} onClick={() => save(done, hidden, false)}>
        <ListChecks size={16} aria-hidden="true" />
        <span>{hidden ? "My standing" : `Setup ${finished} of ${total}`}</span>
        {alert ? <i aria-label="Check-in needed" /> : null}
      </button>
    );
  }

  return (
    <div className="hub-banner-side hub-side-panel" aria-label="You">
      <button type="button" className="hub-side-close" onClick={() => save(done, hidden, true)} aria-label="Close and keep a small Setup button" title="Close">
        <X size={15} aria-hidden="true" />
      </button>
      {aside}
      {hidden ? null : list}
    </div>
  );
}
