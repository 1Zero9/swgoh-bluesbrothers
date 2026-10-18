import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BlueChat from "@/app/blue-chat";
import AskTabs from "./ask-tabs";
import { allUnitNames } from "@/lib/wins";
import { AskView } from "@/app/hub-views";
import MembersOnly from "@/app/members-only";
import NavIcon from "@/app/nav-icon";
import { getViewerAccess } from "@/lib/access-control";
import { blueAnswer, type BlueQuestion } from "@/lib/blue/advice";
import { blueEnabled, webSearchOn } from "@/lib/blue/ask";
import { getUsage } from "@/lib/blue/limits";
import { resetLabel } from "@/lib/blue/reset-label";
import { listCounters } from "@/lib/counters-data";
import { getMyPage } from "@/lib/my-page";
import { getSquadAdvice } from "@/lib/roster-advice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ask B-Lue3 · Blues Brothers",
  description: "Ask the guild droid. He checks what the guild already knows first, and that is free.",
};

type SearchParams = Promise<{ q?: string | string[]; blue?: string | string[]; tab?: string | string[] }>;

export default async function AskPage({ searchParams }: { searchParams: SearchParams }) {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return <MembersOnly path="/ask" area="B-Lue3" />;

  const query = await searchParams;
  const aiOn = blueEnabled();
  const usage = aiOn ? await getUsage(access.playerId ?? "officer") : null;
  const initialText = typeof query.q === "string" ? query.q.slice(0, 500) : "";

  // With the AI switched off, B-Lue3 still answers three set questions from the member's own roster.
  const requested = typeof query.blue === "string" && ["farm", "team", "help"].includes(query.blue) ? (query.blue as BlueQuestion) : null;
  let presetAnswer: { title: string; message: string } | null = null;
  if (!aiOn && requested && access.playerId) {
    const [data, advice, counters] = await Promise.all([getMyPage(access.playerId), getSquadAdvice(access.playerId), listCounters({ youPlayerId: access.playerId })]);
    if (data) presetAnswer = blueAnswer(requested, data, advice, counters);
  }

  const chat = (
    <>
        {aiOn && usage ? (
          <BlueChat usage={usage} webSearch={webSearchOn()} isOfficer={access.isOfficer} rawLimit={access.isOfficer ? (process.env.BLUE_WEEKLY_LIMIT ?? null) : null} initialText={initialText} />
        ) : (
          <>
            <nav className="blue-question-actions" aria-label="Questions for B-Lue3">
              <Link href="/ask?blue=farm#ask-blue"><NavIcon name="sprout" size={20} />What should I farm next?</Link>
              <Link href="/ask?blue=team#ask-blue"><NavIcon name="roster" size={20} />What team should I finish?</Link>
              <Link href="/ask?blue=help#ask-blue"><NavIcon name="help" size={20} />How can I help the band?</Link>
            </nav>
            {presetAnswer ? <article className="blue-answer" aria-live="polite"><Image src="/blue.png" alt="" width={72} height={72} /><div><p className="eyebrow">{presetAnswer.title}</p><p>{presetAnswer.message}</p></div></article> : null}
            {access.isOfficer ? <p className="blue-off-note" role="note">Officers only: the typing box is off because the server&apos;s BLUE_AI setting is {process.env.BLUE_AI ? JSON.stringify(process.env.BLUE_AI) : "not set"}.</p> : null}
          </>
        )}
    </>
  );
  const names = Object.fromEntries(allUnitNames().map((unit) => [unit.id, unit.name]));
  const tabbed = <AskTabs aiOn={aiOn} chat={<section className="hub-section hub-chat" id="ask-blue" aria-label="Chat with B-Lue3">{chat}</section>} names={names} canAct={Boolean(access.playerId || access.isOfficer)} initialTab={query.tab === "counters" ? "counters" : "ask"} />;
  const left = usage ? { left: usage.left, limit: usage.limit, resetsLabel: resetLabel(usage.resetsOn) } : null;
  return <AskView left={left}>{tabbed}</AskView>;
}
