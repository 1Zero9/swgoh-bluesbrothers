import type { Metadata } from "next";
import Link from "next/link";
import MembersOnly from "@/app/members-only";
import HubPage, { HubHeader } from "@/app/hub-page";
import { getViewerAccess } from "@/lib/access-control";
import { blueEnabled, webSearchOn } from "@/lib/blue/ask";
import { launchRows, type LaunchFacts } from "@/lib/launch-check";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Launch checklist · Blues Brothers", robots: { index: false } };

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

async function widgetOn() {
  const id = process.env.DISCORD_GUILD_ID;
  if (!id) return false;
  try { return (await fetch(`https://discord.com/api/guilds/${encodeURIComponent(id)}/widget.json`, { cache: "no-store", signal: AbortSignal.timeout(4000) })).ok; } catch { return false; }
}

export default async function LaunchPage() {
  const access = await getViewerAccess();
  if (!access.isOfficer) return <MembersOnly path="/officer/launch" area="The launch checklist" />;
  const db = getPrisma();
  const week = daysAgo(7);
  const active = { membershipTerms: { some: { state: "ACTIVE" as const } } };
  const safe = async <T,>(work: Promise<T>, fallback: T) => work.catch(() => fallback);
  const [published, candidates, tips, ideas, openRequests, activeMembers, discordLinked, seen, helpWaiting, savedCount, importedRefs, widget] = await Promise.all([
    safe(db.kbMatchup.count({ where: { status: "PUBLISHED" } }), 0),
    safe(db.kbMatchup.count({ where: { status: { in: ["CANDIDATE", "DISPUTED"] } } }), 0),
    safe(db.kbNote.count({ where: { kind: "TIP", status: "PUBLISHED" } }), 0),
    safe(db.kbNote.count({ where: { kind: "IDEA", status: "PUBLISHED" } }), 0),
    safe(db.kbRequest.count({ where: { status: "OPEN" } }), 0),
    safe(db.player.count({ where: active }), 0),
    safe(db.player.count({ where: { ...active, discordUserId: { not: null } } }), 0),
    safe(db.memberVisit.findMany({ where: { at: { gte: week }, playerId: { not: null } }, select: { playerId: true }, distinct: ["playerId"] }), []),
    safe(db.signInHelp.count({ where: { status: "OPEN" } }), 0),
    safe(db.counter.count(), 0),
    safe(db.kbEvidence.findMany({ where: { sourceRef: { startsWith: "saved:" } }, select: { sourceRef: true }, distinct: ["sourceRef"] }), []),
    widgetOn(),
  ]);
  const facts: LaunchFacts = {
    blueAi: blueEnabled(), webSearch: webSearchOn(), published, candidates, savedWaiting: Math.max(0, savedCount - importedRefs.length), tips, ideas, openRequests,
    activeMembers, discordLinked, seenThisWeek: seen.length, helpWaiting,
    botConfigured: Boolean(process.env.DISCORD_BOT_TOKEN), countersWebhook: Boolean(process.env.DISCORD_COUNTERS_WEBHOOK_URL), officerWebhook: Boolean(process.env.DISCORD_OFFICER_WEBHOOK_URL), discordWidget: widget,
  };
  const groups = launchRows(facts);
  const mark = { good: "✓", warn: "!", bad: "✕" } as const;
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Launch checklist" intro="What members will find on day one, and what is still missing. These are the live numbers, checked when you open the page." />
      <div className="launch-groups">
        {groups.map((group) => (
          <section key={group.group} className="help-box">
            <h2>{group.group}</h2>
            <ul className="launch-rows">
              {group.rows.map((row) => (
                <li key={row.label} className={`is-${row.tone}`}>
                  <span className="launch-mark" aria-hidden="true">{mark[row.tone]}</span>
                  <div><strong>{row.label}: {row.value}</strong><p>{row.detail}{row.href ? <> <Link href={row.href}>{row.action ?? "Open"} →</Link></> : null}</p></div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </HubPage>
  );
}
