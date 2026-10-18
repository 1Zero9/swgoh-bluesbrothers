"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users, X } from "lucide-react";
import type { PresenceSummary } from "@/lib/presence-data";

const HIDE_KEY = "bb-appear-offline";
const EVERY_MS = 60_000;
const OPEN_EVENT = "bb-whos-open";
const COUNT_EVENT = "bb-whos-count";
let lastCount: number | null = null;

/** The same button, placed inside a page (Home). It shares the count and the panel with the menu's own button. */
export function WhosOnlineInline({ floating = false, away = false }: { floating?: boolean; away?: boolean }) {
  const [count, setCount] = useState<number | null>(lastCount);
  useEffect(() => {
    const onCount = (event: Event) => setCount((event as CustomEvent<number>).detail);
    window.addEventListener(COUNT_EVENT, onCount);
    const catchUp = setTimeout(() => { if (lastCount !== null) setCount(lastCount); }, 0);
    return () => { clearTimeout(catchUp); window.removeEventListener(COUNT_EVENT, onCount); };
  }, []);
  return (
    <button type="button" className={`whos-btn ${floating ? "is-float" : "is-inline"}${away ? " is-away" : ""}`} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} aria-haspopup="dialog">
      <span className={`whos-dot${count ? " is-live" : ""}`} aria-hidden="true" />
      <Users size={15} aria-hidden="true" />
      <span className="whos-label">Who&apos;s online</span>
      {count !== null ? <b>{count}</b> : null}
    </button>
  );
}

const readHidden = () => { try { return window.localStorage.getItem(HIDE_KEY) === "1"; } catch { return false; } };

/**
 * The "Who's online" button: a green-dot pill with a count. It also sends this member's heartbeat about once a minute while the tab is visible
 * (unless they chose to appear offline on this device), and the answer to that heartbeat is the list it shows.
 */
export default function WhosOnline({ path, sample }: { path: string; sample?: PresenceSummary }) {
  const [data, setData] = useState<(PresenceSummary & { ok: true }) | null>(sample ? { ok: true, ...sample } : null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const hiddenRef = useRef(false);
  const pathRef = useRef(path);
  useEffect(() => { pathRef.current = path; }, [path]);

  const beat = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const response = await fetch("/api/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: pathRef.current, hidden: hiddenRef.current }) }).catch(() => null);
    const json = (await response?.json().catch(() => null)) as (PresenceSummary & { ok?: boolean }) | null;
    if (json?.ok) { setData(json as PresenceSummary & { ok: true }); setFailed(null); }
    else setFailed(response ? `error ${response.status}` : "no connection");
  }, []);

  useEffect(() => {
    if (sample) return;
    const initial = readHidden();
    hiddenRef.current = initial;
    const start = setTimeout(() => { setHidden(initial); void beat(); }, 0);
    const timer = setInterval(() => { void beat(); }, EVERY_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void beat(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => { clearTimeout(start); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", onVisible); window.removeEventListener("pageshow", onVisible); };
  }, [beat, sample]);

  function toggleHidden(next: boolean) {
    hiddenRef.current = next;
    setHidden(next);
    try { if (next) window.localStorage.setItem(HIDE_KEY, "1"); else window.localStorage.removeItem(HIDE_KEY); } catch { /* it lasts for this visit */ }
    void beat();
  }

  const count = data ? data.site.length : null;
  useEffect(() => {
    lastCount = count;
    if (count !== null) window.dispatchEvent(new CustomEvent(COUNT_EVENT, { detail: count }));
  }, [count]);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  return (
    <>
      <button type="button" className="whos-btn is-side" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={count === null ? "Who's online" : `Who's online, ${count} on the site now`}>
        <span className={`whos-dot${count ? " is-live" : ""}`} aria-hidden="true" />
        <Users size={15} aria-hidden="true" />
        <span className="whos-label">Who&apos;s online</span>
        {count !== null ? <b>{count}</b> : null}
      </button>
      {open ? (
        <div className="whos-scrim" onClick={() => setOpen(false)}>
          <div className="whos-sheet" role="dialog" aria-label="Who's online" onClick={(event) => event.stopPropagation()}>
            <header>
              <strong>Who&apos;s online</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={18} aria-hidden="true" /></button>
            </header>
            {!data ? <p className="whos-note">{failed ? `Couldn't load the list (${failed}). Tap the refresh button in the menu and try again.` : "Looking…"}</p> : (
              <>
                <section>
                  <h3>On the site now <i>{data.site.length}</i></h3>
                  {data.site.length ? <ul>{data.site.map((p) => <li key={p.id}><span className="whos-dot is-live" aria-hidden="true" />{p.name}{p.you ? <em>you</em> : null}</li>)}</ul> : <p className="whos-note">Nobody else has the site open right now.</p>}
                </section>
                {data.discord ? (
                  <section>
                    <h3>On Discord now <i>{data.discord.length}</i></h3>
                    {data.discord.length ? <ul>{data.discord.map((p, index) => <li key={`${p.name}-${index}`}><span className={`whos-dot is-${p.status}`} aria-hidden="true" />{p.name}</li>)}</ul> : <p className="whos-note">Nobody is showing as online.</p>}
                  </section>
                ) : null}
                {data.recent?.length ? (
                  <section>
                    <h3>On the site earlier today <i>{data.recent.length}</i></h3>
                    <ul>{data.recent.map((p) => <li key={p.id}><span className="whos-dot" aria-hidden="true" />{p.name}<em>{p.ago}</em></li>)}</ul>
                  </section>
                ) : null}
                {data.discordHint ? <p className="whos-note"><strong>Officers:</strong> to see who is on Discord here, switch on Discord&apos;s server widget (Server Settings → Widget → Enable Server Widget). Nothing else to do.</p> : null}
                <section>
                  <h3>Last seen in the game <i>{data.game.length}</i></h3>
                  {data.game.length ? <ul>{data.game.map((p) => <li key={p.id}><span className="whos-dot" aria-hidden="true" />{p.name}<em>{p.ago}</em></li>)}</ul> : <p className="whos-note">Nobody has been active in the game in the last day. This comes from the game&apos;s own data, which is refreshed hourly, so it can lag a little.</p>}
                </section>
              </>
            )}
            <label className="whos-hide"><input type="checkbox" checked={hidden} onChange={(event) => toggleHidden(event.target.checked)} /> Appear offline on this device</label>
          </div>
        </div>
      ) : null}
    </>
  );
}
