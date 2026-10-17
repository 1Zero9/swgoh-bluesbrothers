"use client";

import { useState, type ReactNode } from "react";
import CounterFinder from "./counter-finder";

type Tab = "ask" | "counters";

/** The Ask page's two ways in: talk to B-Lue3, or find a counter straight from the guild's knowledge (free). Both stay mounted so a chat is not lost. */
export default function AskTabs({ chat, names, canAct, initialTab = "ask" }: { chat: ReactNode; names: Record<string, string>; canAct: boolean; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [prefill, setPrefill] = useState<{ text: string; n: number } | null>(null);

  function askBlue(question: string) {
    setPrefill({ text: question, n: (prefill?.n ?? 0) + 1 });
    setTab("ask");
    requestAnimationFrame(() => {
      const box = document.querySelector<HTMLInputElement | HTMLTextAreaElement>("#ask-blue .blue-form input, #ask-blue .blue-form textarea");
      if (box) {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(box), "value")?.set;
        setter?.call(box, question);
        box.dispatchEvent(new Event("input", { bubbles: true }));
        box.focus();
      }
    });
  }

  return (
    <div className="ask-tabs">
      <div className="hub-segment" role="tablist" aria-label="How to ask">
        <button type="button" role="tab" aria-selected={tab === "ask"} aria-pressed={tab === "ask"} onClick={() => setTab("ask")}>Ask B-Lue3</button>
        <button type="button" role="tab" aria-selected={tab === "counters"} aria-pressed={tab === "counters"} onClick={() => setTab("counters")}>Find a counter</button>
      </div>
      <div hidden={tab !== "ask"} data-prefill={prefill?.n ?? 0}>{chat}</div>
      <div hidden={tab !== "counters"}><CounterFinder names={names} canAct={canAct} onAskBlue={askBlue} /></div>
    </div>
  );
}
