import type { Metadata } from "next";
import MembersOnly from "@/app/members-only";
import HubPage, { HubHeader } from "@/app/hub-page";
import { getViewerAccess } from "@/lib/access-control";
import { isSiteAdmin } from "@/lib/site-admin";
import { getPrisma } from "@/lib/prisma";
import { signInOverview } from "@/lib/signin-events-data";
import { PROBLEMS, type Problem } from "@/lib/signin-help";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign-in tracker · Blues Brothers", robots: { index: false } };

const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);

export default async function SignInTrackerPage() {
  const access = await getViewerAccess();
  if (!isSiteAdmin(access)) return <MembersOnly path="/admin/signin" area="The sign-in tracker" />;
  const empty = { days: 30, started: 0, finished: 0, needsAllyCode: 0, errors: 0, stalled: 0, cancelled: 0, helpAsked: 0, rate: null, segments: [] } as Awaited<ReturnType<typeof signInOverview>>;
  const [o, help] = await Promise.all([
    signInOverview(30).catch(() => empty),
    getPrisma().signInHelp.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 20 }).catch(() => []),
  ]);
  const tiles = [
    { label: "Started signing in", value: o.started },
    { label: "Got in", value: o.finished, note: pct(o.rate) },
    { label: "Needed their ally code", value: o.needsAllyCode },
    { label: "Stalled for 7+ seconds", value: o.stalled },
    { label: "Gave up", value: o.cancelled },
    { label: "Errors", value: o.errors },
    { label: "Asked Obi-Wan for help", value: o.helpAsked },
  ];
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Site admin" title="Sign-in tracker" intro={`The last ${o.days} days. Nobody is identified: only how many tried, how many got in, and what kind of device struggled.`} />
      <div className="intel-summary pub-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {tiles.map((t) => <div key={t.label}><strong>{t.value}{t.note ? <span> {t.note}</span> : null}</strong><small>{t.label}</small></div>)}
      </div>
      <section className="help-box">
        <h2>Who struggles</h2>
        {o.segments.length ? (
          <ul>{o.segments.map((s) => <li key={s.label}><strong>{s.label}</strong>: {s.started} tried, {pct(s.rate)} got in{s.stalled ? `, ${s.stalled} stalled` : ""}</li>)}</ul>
        ) : <p>No sign-in attempts counted yet. They appear here as people sign in.</p>}
        <p>A low &quot;got in&quot; rate on one kind of device or browser (for example &quot;In-app browser&quot;) shows who needs the personal links.</p>
      </section>
      <section className="help-box">
        <h2>Waiting for help ({help.length})</h2>
        {help.length ? (
          <ul>{help.map((h) => <li key={h.id}><strong>{h.name}</strong>: {PROBLEMS[h.problem as Problem] ?? h.problem}{h.contact ? ` · ${h.contact}` : ""}{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
        ) : <p>Nobody is waiting.</p>}
        <p><a href="/officer/signin-link">Make personal sign-in links</a></p>
      </section>
    </HubPage>
  );
}
