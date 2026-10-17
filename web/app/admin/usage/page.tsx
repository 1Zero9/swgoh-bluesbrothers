import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { getRosterMembers } from "@/lib/members";
import { getPrisma } from "@/lib/prisma";
import { isSiteAdmin } from "@/lib/site-admin";
import { summariseUse, type UseSummary } from "@/lib/visits";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Who uses the site · Blues Brothers", robots: { index: false } };

const ago = (date: Date | null, now: number) => { if (!date) return "never"; const d = (now - date.getTime()) / 86_400_000; return d < 1 ? "today" : d < 2 ? "yesterday" : `${Math.round(d)} days ago`; };

export default async function UsagePage() {
  const access = await getViewerAccess();
  if (!isSiteAdmin(access)) return <MembersOnly path="/admin/usage" area="The site usage log" />;
  const now = Date.now();
  let summary: UseSummary | null = null;
  let totalVisits = 0;
  let since: Date | null = null;
  let recent: { id: string; at: Date; playerName: string; country: string | null; region: string | null; city: string | null; device: string | null; path: string | null }[] = [];
  try {
    const db = getPrisma();
    const [visits, roster, first, latest] = await Promise.all([
      db.memberVisit.findMany({ where: { at: { gte: new Date(now - 90 * 86_400_000) } }, orderBy: { at: "desc" }, take: 5000 }),
      getRosterMembers(),
      db.memberVisit.findFirst({ orderBy: { at: "asc" }, select: { at: true } }),
      db.memberVisit.findMany({ orderBy: { at: "desc" }, take: 40 }),
    ]);
    summary = summariseUse(visits, roster.map((m) => ({ playerId: m.playerId, name: m.name })), now);
    totalVisits = visits.length; since = first?.at ?? null; recent = latest;
  } catch { /* table not ready yet */ }
  const place = (v: { city: string | null; region: string | null; country: string | null }) => [v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown";

  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Site admin" title="Who uses the site, and from where" intro="Every member visit (at most one per half hour per device), grouped by person and place. City level only: no IP addresses are kept. Only you can see this.">
        <Link className="hub-pagehead-link" href="/admin/blue">B-Lue3 log →</Link>
      </HubHeader>
      {summary ? (
        <div className="hub-knowledge bl">
          <div className="intel-summary">
            <div><strong>{summary.active.length}</strong><small>used it in the last 14 days</small></div>
            <div><strong>{summary.quiet.length}</strong><small>gone quiet</small></div>
            <div><strong>{summary.never.length}</strong><small>not seen yet</small></div>
            <div><strong>{totalVisits}</strong><small>visits, last 90 days</small></div>
          </div>
          <p className="bl-cutlist">{since ? `Recording began ${since.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Anyone before that shows as “not seen yet”.` : "Nothing recorded yet. Visits appear here as members open the site."}</p>

          <section className="bl-box">
            <h3>Where the band is</h3>
            {summary.countries.length ? (
              <div className="us-places">
                <ul className="us-chips">{summary.countries.map((c) => <li key={c.country}><strong>{c.country}</strong> {c.members} member{c.members === 1 ? "" : "s"}</li>)}</ul>
                {summary.usStates.length ? <><p className="us-sub">US states (good for meet-ups)</p><ul className="us-chips is-state">{summary.usStates.map((s) => <li key={s.region}><strong>{s.region}</strong> {s.members}</li>)}</ul></> : null}
                <p className="us-sub">Cities</p>
                <ul className="us-chips">{summary.places.map((p) => <li key={p.place}><strong>{p.place}</strong> {p.members} member{p.members === 1 ? "" : "s"}</li>)}</ul>
              </div>
            ) : <p className="bl-empty">No locations yet.</p>}
          </section>

          <section className="bl-box">
            <h3>Using it</h3>
            {summary.active.length ? <ul className="us-members">{summary.active.map((m) => <li key={m.playerId}><strong>{m.name}</strong><span>{m.visits} visit{m.visits === 1 ? "" : "s"}</span><span>{m.place}</span><span>{m.device ?? ""}</span><time>{ago(m.lastAt, now)}</time></li>)}</ul> : <p className="bl-empty">Nobody yet.</p>}
          </section>
          <section className="bl-box">
            <h3>Gone quiet (not seen for 14 days)</h3>
            {summary.quiet.length ? <ul className="us-members">{summary.quiet.map((m) => <li key={m.playerId}><strong>{m.name}</strong><span>{m.visits} visit{m.visits === 1 ? "" : "s"}</span><span>{m.place}</span><span>{m.device ?? ""}</span><time>{ago(m.lastAt, now)}</time></li>)}</ul> : <p className="bl-empty">Nobody.</p>}
          </section>
          <section className="bl-box">
            <h3>Not seen yet</h3>
            {summary.never.length ? <ul className="us-chips">{summary.never.map((m) => <li key={m.playerId}>{m.name}</li>)}</ul> : <p className="bl-empty">Everyone has been seen.</p>}
          </section>
          <section className="bl-box">
            <h3>Latest visits</h3>
            <ul className="us-members">{recent.map((v) => <li key={v.id}><strong>{v.playerName}</strong><span>{place(v)}</span><span>{v.device ?? ""} {v.path ?? ""}</span><time>{v.at.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time></li>)}</ul>
          </section>
        </div>
      ) : <div className="kb-empty"><strong>The usage log is not ready yet.</strong><p>It starts once the new database table is in place.</p></div>}
    </HubPage>
  );
}
