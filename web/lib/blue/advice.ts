import type { CounterView } from "@/lib/counters-data";
import type { getMyPage } from "@/lib/my-page";
import type { getSquadAdvice } from "@/lib/roster-advice";

export function blueBriefing(data: NonNullable<Awaited<ReturnType<typeof getMyPage>>>, advice: Awaited<ReturnType<typeof getSquadAdvice>>) {
  const readyCallout = data.callouts.find((callout) => callout.status === "ready");
  if (readyCallout) {
    return {
      label: "You are needed now",
      title: "You can help the band today.",
      message: `${readyCallout.headline} is open and you are ready. ${readyCallout.needed ? `${readyCallout.readyCount}/${readyCallout.needed} members are ready.` : ""}`,
      href: "/territory-battles#callouts",
      action: "See the callout",
    };
  }

  const closeCallout = data.callouts.find((callout) => callout.status === "close");
  if (closeCallout) {
    return {
      label: "Your next move",
      title: "You are close to a guild need.",
      message: `${closeCallout.headline}: ${closeCallout.gap}. Finish that and Blue will put your name on the board.`,
      href: "/territory-battles#callouts",
      action: "See what is needed",
    };
  }

  const squad = advice?.close[0];
  if (squad) {
    return {
      label: "Dougie's roster note",
      title: `${squad.label} is your best next finish.`,
      message: `${squad.leader}: ${squad.gap}. ${squad.thin ? `Only ${squad.qualifiers} members meet this leader target, so improving it would help the band.` : "This is one of your closest leader targets for a guild TW squad."}`,
      href: "/me#blue-report",
      action: "See your roster report",
    };
  }

  return {
    label: "Systems check",
    title: "You are clear for the next gig.",
    message: "No urgent callouts have your name on them. Keep tickets rolling, check the latest counters, and Blue will flag the next useful move.",
    href: "/counters",
    action: "Check counters",
  };
}

export type BlueQuestion = "farm" | "team" | "help";

export function counterOptions(counters: CounterView[]) {
  const own = counters.filter((counter) => counter.readiness.you);
  const ready = own.filter((counter) => counter.readiness.you?.ready);
  const close = own
    .filter((counter) => !counter.readiness.you?.ready && Number.isFinite(counter.readiness.you?.effort))
    .sort((a, b) =>
      (a.readiness.you?.gaps.length ?? Infinity) - (b.readiness.you?.gaps.length ?? Infinity)
      || a.readiness.ready.length - b.readiness.ready.length
      || (a.readiness.you?.effort ?? Infinity) - (b.readiness.you?.effort ?? Infinity),
    );
  const next = close[0] ?? own
    .filter((counter) => !counter.readiness.you?.ready)
    .sort((a, b) =>
      (a.readiness.you?.gaps.length ?? Infinity) - (b.readiness.you?.gaps.length ?? Infinity)
      || a.readiness.ready.length - b.readiness.ready.length,
    )[0] ?? null;
  return { ready, close, next };
}

export function blueAnswer(question: BlueQuestion, data: NonNullable<Awaited<ReturnType<typeof getMyPage>>>, advice: Awaited<ReturnType<typeof getSquadAdvice>>, counters: CounterView[]) {
  const closest = advice?.close[0];
  const ready = advice?.ready[0];
  const callout = data.callouts[0];
  const counter = counterOptions(counters);

  if (question === "farm") {
    return counter.next
      ? { title: "Blue's farm call", message: `Your next team target is ${counter.next.title} into ${counter.next.enemy.name}. Work on: ${counter.next.readiness.you?.gaps.join("; ")}. ${counter.next.readiness.ready.length ? `${counter.next.readiness.ready.length} guild member${counter.next.readiness.ready.length === 1 ? "" : "s"} can already run this counter.` : "No one currently meets this saved counter's full requirements."} These are roster goals; the site does not map them to game farm locations.` }
      : closest
        ? { title: "Blue's farm call", message: `Focus your next gear or relic push on ${closest.leader}: ${closest.gap}. That moves your ${closest.label} leader toward its guild target${closest.thin ? `, currently met by only ${closest.qualifiers} member${closest.qualifiers === 1 ? "" : "s"}` : ""}. Blue can identify the target, but this report does not include game farm locations.` }
      : { title: "Blue's farm call", message: "Your synced roster does not show a close guild squad yet. Check the guild counters; Blue will turn the next roster sync into a clearer farm recommendation." };
  }

  if (question === "team") {
    return counter.ready[0]
      ? { title: "Blue's team call", message: `You can run ${counter.ready[0].title} into ${counter.ready[0].enemy.name}. The saved squad is ${counter.ready[0].squad.map((slot) => `${slot.name}${slot.minRelic > 0 ? ` R${slot.minRelic}+` : ` ${slot.minStars}★`}`).join(", ")}.${counter.ready[0].notes ? ` Guild notes: ${counter.ready[0].notes}` : " Check the in-game mod setup before you go."}` }
      : counter.next
        ? { title: "Blue's team call", message: `${counter.next.title} is your best next saved counter into ${counter.next.enemy.name}. Your gaps: ${counter.next.readiness.you?.gaps.join("; ")}. ${counter.next.readiness.ready.length} guild member${counter.next.readiness.ready.length === 1 ? "" : "s"} can already run it.` }
        : closest
          ? { title: "Blue's team call", message: `${closest.label} is your closest guild squad leader target. Bring ${closest.leader} from ${closest.gap}. This is a leader target, not a complete squad recommendation.` }
      : ready
        ? { title: "Blue's team call", message: `${ready.leader} meets the guild's ${ready.label} leader target${ready.thin ? `, and only ${ready.qualifiers} members meet it` : ""}. The planner checks leader requirements; check the squad and mods in game before battle.` }
        : { title: "Blue's team call", message: "Blue needs one more roster sync before calling your next team. Your data is safe; it simply has not reported enough units yet." };
  }

  if (callout) {
    return { title: "Blue's guild-help call", message: callout.status === "ready" ? `You are ready for ${callout.headline}. That is your best way to help the band today.` : `You are ${callout.gap} away from ${callout.headline}. Finish that gap and you can answer the call.` };
  }

  return closest
    ? { title: "Blue's guild-help call", message: `${closest.label} is the clearest way you can strengthen the band. ${closest.thin ? `The guild is thin there—only ${closest.qualifiers} members currently qualify.` : "It also keeps another useful option in reserve."}` }
    : { title: "Blue's guild-help call", message: "No urgent callout has your name on it. Keep tickets moving and check Blue's briefing after the next roster sync." };
}
