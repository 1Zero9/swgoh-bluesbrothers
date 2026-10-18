"use client";

import { useCallback, useEffect, useState } from "react";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import MatchCard, { type Listing } from "../match-card";
import NoteReview from "./note-review";
import ResearchPanel from "./research-panel";

type Coverage = { teams: number; variants: number; evidence: number; byStatus: Record<string, number>; byMode: Record<string, number>; needRefresh: { id: string; label: string }[]; expiredDatacron: { id: string; label: string }[] };

export default function ReviewClient({ names }: { names: Record<string, string> }) {
  const [queue, setQueue] = useState<(Listing & { via?: string; submittedByName?: string })[] | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/knowledge/review", { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { queue?: Listing[]; coverage?: Coverage; error?: string } | null;
    if (data?.queue) { setQueue(data.queue); setCoverage(data.coverage ?? null); } else setError(data?.error ?? "Couldn't load the queue.");
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function publishAll() {
    const count = (queue ?? []).filter((item) => item.status === "CANDIDATE" && !(item as { supersedesId?: string | null }).supersedesId).length;
    if (!count || !window.confirm(`Publish all ${count} waiting counters? Members will see them straight away. (Suggested replacements and disputed ones are left for you to look at.)`)) return;
    setError("");
    const response = await fetch("/api/knowledge/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "PUBLISH_ALL" }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; published?: number; error?: string } | null;
    if (data?.ok) { setError(""); setDoneMessage(`Published ${data.published}.`); void load(); } else setError(data?.error ?? "That didn't go through.");
  }

  async function act(id: string, action: "PUBLISH" | "REJECT" | "DISPUTE" | "OUTDATE") {
    setError("");
    const response = await fetch("/api/knowledge/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, note: notes[id] }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (data?.ok) void load(); else setError(data?.error ?? "That didn't go through.");
  }

  return (
    <div className="kb">
      <NoteReview />
      <ResearchPanel onDone={() => void load()} />
      {coverage ? (
        <section className="kb-coverage" aria-label="Coverage">
          <div><strong>{coverage.byStatus.PUBLISHED ?? 0}</strong><small>published</small></div>
          <div><strong>{(coverage.byStatus.CANDIDATE ?? 0)}</strong><small>awaiting review</small></div>
          <div><strong>{coverage.teams}</strong><small>teams</small></div>
          <div><strong>{coverage.variants}</strong><small>exact squads</small></div>
          <div><strong>{coverage.evidence}</strong><small>sources</small></div>
          <p>Published by mode: {Object.keys(coverage.byMode).length ? Object.entries(coverage.byMode).map(([mode, count]) => `${MODE_LABELS[mode as KbMode] ?? mode} ${count}`).join(" · ") : "none yet"}</p>
          {coverage.needRefresh.length ? <p className="kb-warn">Need another look: {coverage.needRefresh.map((row) => row.label).join("; ")}</p> : null}
          {coverage.expiredDatacron.length ? <p className="kb-warn">Datacron has ended: {coverage.expiredDatacron.map((row) => row.label).join("; ")}</p> : null}
        </section>
      ) : null}
      {error ? <p className="kb-error" role="alert">{error}</p> : null}
      {doneMessage ? <p className="kb-ok" role="status">{doneMessage}</p> : null}
      {queue && queue.filter((item) => item.status === "CANDIDATE" && !(item as { supersedesId?: string | null }).supersedesId).length > 1 ? (
        <p><button type="button" className="kb-secondary" onClick={() => void publishAll()}>Publish all {queue.filter((item) => item.status === "CANDIDATE" && !(item as { supersedesId?: string | null }).supersedesId).length} waiting counters</button></p>
      ) : null}
      {queue === null ? <p className="kb-empty">Loading…</p> : queue.length === 0 ? <div className="kb-empty"><strong>Nothing waiting.</strong><p>New submissions from members and B-Lue3 appear here.</p></div> : queue.map((item) => (
        <MatchCard key={item.id} item={item} names={names} canMark={false}>
          <span className="kb-meta">from {item.submittedByName} ({String(item.via).toLowerCase()})</span>
          <input className="kb-note" placeholder="Note (optional)" value={notes[item.id] ?? ""} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} maxLength={300} />
          <button type="button" className="kb-primary" onClick={() => act(item.id, "PUBLISH")}>Publish</button>
          {item.status === "CANDIDATE" ? <button type="button" className="kb-secondary" onClick={() => act(item.id, "REJECT")}>Reject</button> : <button type="button" className="kb-secondary" onClick={() => act(item.id, "OUTDATE")}>Outdated</button>}
        </MatchCard>
      ))}
    </div>
  );
}
