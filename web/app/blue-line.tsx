import Image from "next/image";
import Link from "next/link";
import { getViewerAccess } from "@/lib/access-control";
import { blueBriefing } from "@/lib/blue/advice";
import { getMyPage } from "@/lib/my-page";
import { getSquadAdvice } from "@/lib/roster-advice";

/** B-Lue3's one-line briefing for the home page. Rule-based, so it costs nothing however often it is seen. */
export default async function BlueLine() {
  const access = await getViewerAccess();
  if (!access.playerId || !access.isMember) return null;
  const [data, advice] = await Promise.all([getMyPage(access.playerId), getSquadAdvice(access.playerId)]);
  if (!data) return null;
  const briefing = blueBriefing(data, advice);
  return (
    <Link className="blue-line" href="/me#ask-blue">
      <Image src="/blue.png" alt="" width={44} height={44} />
      <span className="blue-line-copy">
        <small>B-Lue3 · {briefing.label}</small>
        <strong>{briefing.title}</strong>
        <span>{briefing.message}</span>
      </span>
      <span className="blue-line-ask">Ask B-Lue3 <i aria-hidden="true">→</i></span>
    </Link>
  );
}
