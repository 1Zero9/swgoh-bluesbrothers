"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users, X } from "lucide-react";
import type { PresenceSummary } from "@/lib/presence-data";

const HIDE_KEY = "bb-appear-offline";
const EVERY_MS = 60_000;

const readHidden = () => { try { return window.localStorage.getItem(HIDE_KEY) === "1"; } catch { return false; } };

/**
 * The "Who's online" button: a green-dot pill with a count. It also sends this member's heartbeat about once a minute while the tab is visible
 * (unless they chose to appear offline on this device), and the answer to that heartbeat is the list it shows.
 */
export default function WhosOnline({ path, variant, sample }: { path: string; variant: "side" | "float"; sample?: PresenceSummary }) {
  const [data, setData] = useState<(PresenceSummary & { ok: true }) | null>(sample ? { ok: true, ...sample } : null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);
  const pathRef = useRef(path);
  useEffect(() => { pathRef.current = path; }, [path]);

  const beat = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const response = await fetch("/api/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: pathRef.current, hidden: hiddenRef.current }) }).catch(() => null);
    const json = (await response?.json().catch(() => null)) as (PresenceSummary & { ok?: boolean }) | null;
    if (json?.ok) setData(json as PresenceSummary & { ok: true });
  }, []);

  useEffect(() => {
    if (sample) return;
    const initial = readHidden();
    hiddenRef.current = initial;
    const start = setTimeout(() => { setHidden(initial); void beat(); }, 0);
    const timer = setInterval(() => { void beat(); }, EVERY_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void beat(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(start); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [beat, sample]);

  function toggleHidden(next: boolean) {
    hiddenRef.current = next;
    setHidden(next);
    try { if (next) window.localStorage.setItem(HIDE_KEY, "1"); else window.localStorage.removeItem(HIDE_KEY); } catch { /* it lasts for this visit */ }
    void beat();
  }

  const count = data ? data.site.length : null;

  return (
    <>
      <button type="button" className={`whos-btn is-${variant}`} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={count === null ? "Who's online" : `Who's online, ${count} on the site now`}>
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
            {!data ? <p className="whos-note">Looking…</p> : (
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
                <section>
                  <h3>In the game recently <i>{data.game.length}</i></h3>
                  {data.game.length ? <ul>{data.game.map((p) => <li key={p.id}><span className="whos-dot" aria-hidden="true" />{p.name}<em>{p.ago}</em></li>)}</ul> : <p className="whos-note">No one reported in the last few hours. This comes from the game&apos;s own data, so it can lag a little.</p>}
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
