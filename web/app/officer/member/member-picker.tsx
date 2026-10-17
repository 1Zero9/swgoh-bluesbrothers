"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { MemberListing } from "@/lib/player-card";

const power = (value: string) => { const n = Number(value); return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n.toLocaleString("en-GB"); };
const ago = (value: string | null, now: number) => { if (!value) return "not yet"; const h = (now - new Date(value).getTime()) / 3_600_000; return h < 1 ? "just now" : h < 48 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`; };

/** The colour of a member's dot: the stored verdict when we have one, else how many things are on the attention list. */
export function tone(member: Pick<MemberListing, "headline" | "watches" | "flags">): "good" | "steady" | "watch" | "nudge" {
  if (member.headline === "Needs a nudge") return "nudge";
  if (member.headline === "Pillar of the band") return "good";
  const issues = member.watches ?? member.flags;
  return issues >= 2 ? "nudge" : issues === 1 ? "watch" : "steady";
}

export default function MemberPicker({ members, newest }: { members: MemberListing[]; newest: string | null }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const shown = members.filter((member) => member.name.toLowerCase().includes(text.trim().toLowerCase()));

  async function refresh() {
    setBusy(true); setMessage(null);
    const response = await fetch("/api/officer/member-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; count?: number; error?: string } | null;
    setBusy(false);
    if (data?.ok) window.location.reload(); else setMessage(data?.error ?? "That did not work. Try again.");
  }

  return (
    <div className="hub-knowledge">
      <div className="mc-legend" role="note" aria-label="What the colours and numbers mean">
        <span><i className="mc-dot is-good" />Pillar: doing great</span>
        <span><i className="mc-dot is-steady" />Steady: no worries</span>
        <span><i className="mc-dot is-watch" />Keep an eye: 1 thing to look at</span>
        <span><i className="mc-dot is-nudge" />Needs a nudge: 2 or more</span>
        <span className="mc-legend-note"><b>The orange number</b> is how many things to look at. Hover or open a card to see what.</span>
      </div>
      <div className="mc-toolbar">
        <div className="kb-toolbar mc-bar"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Search members" aria-label="Search members" /></div>
        <span className="mc-updated">Cards updated {ago(newest, now)}</span>
        <button type="button" className="mc-refresh" onClick={() => void refresh()} disabled={busy}><RefreshCw size={14} aria-hidden="true" className={busy ? "is-spinning" : undefined} /> {busy ? "Refreshing…" : "Refresh all"}</button>
      </div>
      {message ? <p className="kb-notice is-bad" role="status">{message}</p> : null}
      {shown.length === 0 ? <div className="kb-empty"><strong>No members found.</strong></div> : (
        <ul className="mc-pick">
          {shown.map((member) => {
            const t = tone(member);
            const issues = member.watches ?? member.flags;
            return (
              <li key={member.playerId}><Link href={`/officer/member/${member.playerId}`} className={`is-${t}`} title={member.topWatch ?? "Nothing to look at"}>
                <span className="mc-name"><i className={`mc-dot is-${t}`} /><strong>{member.name}</strong></span>
                <small>{member.role ? `${member.role.toLowerCase()} · ` : ""}{power(member.galacticPower)} GP</small>
                {member.topWatch ? <small className="mc-top">{member.topWatch}</small> : null}
                {issues ? <i className="mc-count" aria-label={`${issues} things to look at`}>{issues}</i> : null}
              </Link></li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
