"use client";

import { useEffect, useState } from "react";
import type { NoteKind } from "@/lib/knowledge/notes";
import KnowledgeClient from "./knowledge-client";
import NoteForm from "./note-form";
import NoteList from "./note-list";
import SubmitForm from "./submit-form";

type Tab = "counters" | "TIP" | "IDEA";
type Adding = "COUNTER" | NoteKind;

const TABS: { key: Tab; label: string }[] = [
  { key: "counters", label: "Counters" },
  { key: "TIP", label: "Tips" },
  { key: "IDEA", label: "Ideas" },
];
const ADD_LABELS: Record<Adding, string> = { COUNTER: "Counter", TIP: "Tip", IDEA: "Idea" };

/** The knowledge hub: counters, tips and ideas, and one place to add what you know. */
export default function KnowledgeHub({ names, canAct, initialTab = "counters" }: { names: Record<string, string>; canAct: boolean; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const sheetOpen = adding !== null;

  useEffect(() => {
    if (!sheetOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setAdding(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [sheetOpen]);

  function openAdd(kind: Adding) { setAdding(kind); }
  const defaultAdd: Adding = tab === "counters" ? "COUNTER" : tab;

  return (
    <div className="hub-knowledge">
      {canAct ? <button type="button" className="hub-button hub-add" onClick={() => openAdd(defaultAdd)}>+ Add what you know</button> : null}
      <div className="hub-segment" role="group" aria-label="What to browse">
        {TABS.map((item) => <button key={item.key} type="button" aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>{item.label}</button>)}
      </div>
      <p className="hub-note-line">Everything members add is checked by an officer before others see it. B-Lue3 only answers from checked entries.</p>

      {tab === "counters" ? <KnowledgeClient names={names} canAct={canAct} /> : <NoteList kind={tab} reloadKey={reloadKey} canAct={canAct} onAdd={() => openAdd(tab)} />}

      {adding ? (
        <div className="hub-scrim" onClick={(event) => { if (event.target === event.currentTarget) setAdding(null); }}>
          <div className="hub-sheet" role="dialog" aria-modal="true" aria-label="Add what you know">
            <div className="hub-sheet-head">
              <h2>Add what you know</h2>
              <button type="button" className="hub-text-button" onClick={() => setAdding(null)}>Close</button>
            </div>
            <div className="hub-segment" role="group" aria-label="What are you adding">
              {(Object.keys(ADD_LABELS) as Adding[]).map((key) => <button key={key} type="button" aria-pressed={adding === key} onClick={() => setAdding(key)}>{ADD_LABELS[key]}</button>)}
            </div>
            {adding === "COUNTER" ? <SubmitForm key="counter" prefill={null} onDone={() => setReloadKey((value) => value + 1)} /> : <NoteForm key={adding} kind={adding} onDone={() => setReloadKey((value) => value + 1)} />}
          </div>
        </div>
      ) : null}
    </div>
  );
}
