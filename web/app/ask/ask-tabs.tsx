"use client";

import { useEffect, useState, type ReactNode } from "react";
import CounterFinder from "./counter-finder";

type Tab = "ask" | "counters";

/** The Ask page's two ways in: talk to B-Lue3, or find a counter straight from the guild's knowledge (free). Both stay mounted so a chat is not lost. */
export default function AskTabs({ chat, names, canAct, aiOn = true, initialTab = "ask" }: { chat: ReactNode; aiOn?: boolean; names: Record<string, string>; canAct: boolean; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  /** Find a counter's "Search the web": show the chat and start the search there, so nothing has to be typed or pressed again. */
  function askBlue(question: string) {
    setTab("ask");
    window.dispatchEvent(new CustomEvent("bb-ask-web", { detail: { question } }));
    requestAnimationFrame(() => document.getElementById("ask-blue-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // B-Lue3's chat asks for the add form with this event; show the Find a counter tab, where it opens.
  useEffect(() => {
    const onAdd = () => setTab("counters");
    window.addEventListener("bb-add-counter", onAdd);
    return () => window.removeEventListener("bb-add-counter", onAdd);
  }, []);

  return (
    <div className="ask-tabs">
      <div className="hub-segment" role="tablist" aria-label="How to ask">
        <button type="button" role="tab" aria-selected={tab === "ask"} aria-pressed={tab === "ask"} onClick={() => setTab("ask")}>Ask B-Lue3</button>
        <button type="button" role="tab" aria-selected={tab === "counters"} aria-pressed={tab === "counters"} onClick={() => setTab("counters")}>Find a counter</button>
      </div>
      <div hidden={tab !== "ask"}>{chat}</div>
      <div hidden={tab !== "counters"}><CounterFinder names={names} canAct={canAct} onAskBlue={aiOn ? askBlue : undefined} /></div>
    </div>
  );
}
