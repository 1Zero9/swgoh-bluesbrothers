"use client";

import { useState } from "react";
import NavIcon from "@/app/nav-icon";
import { ModeBadge, SquadChips } from "./squad-chips";
import SuggestImprovement from "./suggest";

export type Squad = { teamName: string; memberIds: string[]; members: { unitId: string; role: string; alternatives?: string[] }[] };
export type Listing = {
  id: string; status: string; mode: string; strategy: string | null; defender: Squad; attacker: Squad;
  datacronDependent: boolean; datacronExpiresAt: string | null; reviewedAt: string | null; createdAt: string;
  evidenceCount: number; useCount: number; usedByMe?: boolean; usable?: boolean; match?: string; readiness?: { ready: boolean; gaps: string[]; needs?: { unit: string; kind: "own" | "stars" | "relic"; have: number; want: number }[] } | null;
  requirements: { zetas?: string[]; omicrons?: string[]; ultimates?: string[]; minRelic?: Record<string, number> } | null;
  oneShot: boolean | null; freshEnemyOnly: boolean | null; improves?: string | null;
};
type Evidence = { id: string; type: string; sourceProvider: string; sourceUrl: string | null; observedAt: string | null; publishedAt: string | null; season: string | null; gameVersion: string | null; conditions: string | null; battles: number | null; wins: number | null; losses: number | null; summary: string | null };

const EVIDENCE_LABEL: Record<string, string> = { AGGREGATED: "Battle statistics", INDIVIDUAL_BATTLE: "A battle", DEMONSTRATION: "Shown on video", COMMUNITY_REPORT: "Community report", THEORY: "Theory" };
const day = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);
const STALE_DAYS = 120;

export default function MatchCard({ item, names, canMark, children }: { item: Listing; names: Record<string, string>; canMark: boolean; children?: React.ReactNode }) {
  const [using, setUsing] = useState(Boolean(item.usedByMe));
  const [count, setCount] = useState(item.useCount);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const expired = item.datacronDependent && item.datacronExpiresAt !== null && new Date(item.datacronExpiresAt).getTime() < now;
  const stale = now - new Date(item.reviewedAt ?? item.createdAt).getTime() > STALE_DAYS * 86_400_000;
  const needs = item.requirements;

  async function toggleUse() {
    const next = !using;
    setUsing(next);
    setCount((value) => value + (next ? 1 : -1));
    const response = await fetch("/api/knowledge/use", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchupId: item.id, using: next }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; count?: number } | null;
    if (data?.ok && typeof data.count === "number") setCount(data.count);
    else { setUsing(!next); setCount((value) => value + (next ? -1 : 1)); }
  }

  async function toggleDetails() {
    setOpen(!open);
    if (!open && !evidence) {
      const response = await fetch(`/api/knowledge?id=${encodeURIComponent(item.id)}`, { cache: "no-store" }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as { detail?: { evidence?: Evidence[] } } | null;
      setEvidence(data?.detail?.evidence ?? []);
    }
  }

  const [more, setMore] = useState(false);
  const long = (item.strategy?.length ?? 0) > 180;

  return (
    <article className={`kb-card kb-card2${expired ? " is-expired" : ""}${item.status !== "PUBLISHED" ? ` is-${item.status.toLowerCase()}` : ""}`}>
      <header>
        <ModeBadge mode={item.mode} />
        {item.status !== "PUBLISHED" ? <span className={`kb-badge kb-badge-${item.status.toLowerCase()}`}>{item.status === "CANDIDATE" ? "Awaiting review" : item.status.toLowerCase()}</span> : null}
        {item.datacronDependent ? <span className={`kb-badge ${expired ? "kb-badge-bad" : "kb-badge-warn"}`}>{expired ? "Datacron ended: don't rely on this" : item.datacronExpiresAt ? `Needs the Datacron, until ${day(item.datacronExpiresAt)}` : "Needs a Datacron (end date unknown)"}</span> : null}
        {stale && item.status === "PUBLISHED" ? <span className="kb-badge kb-badge-warn">Not checked lately</span> : null}
        {item.readiness ? <span className={`kb-ready${item.readiness.ready ? " is-yes" : " is-no"}`}>{item.readiness.ready ? "You can run this" : "Not yet"}</span> : null}
      </header>
      <div className="kb-use2">
        <small>Use</small>
        <SquadChips members={item.attacker.members} names={names} />
      </div>
      <div className="kb-against2">
        <small>Against</small>
        <SquadChips members={item.defender.members} names={names} />
      </div>
      {item.readiness && !item.readiness.ready && item.readiness.gaps.length ? <p className="kb-gaps">You still need: {item.readiness.gaps.join("; ")}</p> : null}
      {item.strategy ? (
        <div className="kb-strategy2">
          <p className={more || !long ? undefined : "is-clamped"}>{item.strategy}</p>
          {long ? <button type="button" className="kb-link" onClick={() => setMore((value) => !value)}>{more ? "Show less" : "Read more"}</button> : null}
        </div>
      ) : null}
      {needs ? (
        <p className="kb-needs">
          {needs.zetas?.length ? <span>Zetas: {needs.zetas.join(", ")}</span> : null}
          {needs.omicrons?.length ? <span>Omicrons: {needs.omicrons.join(", ")}</span> : null}
          {needs.ultimates?.length ? <span>Ultimates: {needs.ultimates.join(", ")}</span> : null}
          {needs.minRelic && Object.keys(needs.minRelic).length ? <span>Relic: {Object.entries(needs.minRelic).map(([id, level]) => `${names[id] ?? id} R${level}+`).join(", ")}</span> : null}
        </p>
      ) : null}
      <footer>
        {canMark && item.status === "PUBLISHED" ? (
          <button type="button" className={`kb-use${using ? " is-on" : ""}`} aria-pressed={using} onClick={toggleUse}>
            <NavIcon name="check" size={16} />{using ? "You use this" : "I use this"}
          </button>
        ) : null}
        <span className="kb-meta">{count} guildmate{count === 1 ? "" : "s"} use{count === 1 ? "s" : ""} it{item.reviewedAt ? ` · checked ${day(item.reviewedAt)}` : ""}</span>
        <button type="button" className="kb-link" onClick={toggleDetails}>{open ? "Hide sources" : `${item.evidenceCount} source${item.evidenceCount === 1 ? "" : "s"}`}</button>
        {children}
      </footer>
      {canMark && item.status === "PUBLISHED" ? <SuggestImprovement item={item} names={names} /> : null}
      {item.improves ? <p className="kb-meta kb-improves">A suggestion to improve: {item.improves}</p> : null}
      {open ? (
        <ul className="kb-evidence">
          {evidence === null ? <li>Loading…</li> : evidence.length === 0 ? <li>No sources recorded.</li> : evidence.map((e) => (
            <li key={e.id}>
              <strong>{EVIDENCE_LABEL[e.type] ?? e.type}</strong> · {e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noreferrer noopener">{e.sourceProvider}</a> : e.sourceProvider}
              {day(e.observedAt ?? e.publishedAt) ? ` · ${day(e.observedAt ?? e.publishedAt)}` : " · date unknown"}
              {e.season ? ` · ${e.season}` : ""}{e.gameVersion ? ` · v${e.gameVersion}` : ""}
              {e.battles !== null ? ` · ${e.battles} battles${e.wins !== null ? `, ${e.wins} won` : ""}${e.losses !== null ? `, ${e.losses} lost` : ""}` : ""}
              {e.conditions ? <em> ({e.conditions})</em> : null}
              {e.summary ? <p>{e.summary}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
