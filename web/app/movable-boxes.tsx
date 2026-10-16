"use client";

import { useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { arrangeById } from "@/lib/home-order";

type Item = { id: string; label: string; node: ReactNode };

const STORAGE_KEY = "bb-home-order";
const CHANGE_EVENT = "bb-home-order-change";

function readRaw() {
  try { return window.localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function save(order: string[] | null) {
  try {
    if (order) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* the order lasts for this visit */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Boxes you can drag by the grip (mouse or touch) or move with the arrow keys while the grip has focus. */
export default function MovableBoxes({ items }: { items: Item[] }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const ordered = arrangeById(items, raw);
  const [dragging, setDragging] = useState<string | null>(null);
  const boxes = useRef(new Map<string, HTMLElement>());

  function move(id: string, to: number) {
    const ids = ordered.map((item) => item.id);
    const from = ids.indexOf(id);
    if (from < 0 || to < 0 || to >= ids.length || to === from) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    save(ids);
  }

  function onPointerDown(id: string, event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(id);
  }

  function onPointerMove(id: string, event: PointerEvent<HTMLButtonElement>) {
    if (dragging !== id) return;
    const ids = ordered.map((item) => item.id);
    const from = ids.indexOf(id);
    let to = from;
    ids.forEach((other, index) => {
      if (other === id) return;
      const rect = boxes.current.get(other)?.getBoundingClientRect();
      if (!rect) return;
      const mid = rect.top + rect.height / 2;
      if (index < from && event.clientY < mid) to = Math.min(to, index);
      if (index > from && event.clientY > mid) to = Math.max(to, index);
    });
    if (to !== from) move(id, to);
  }

  function onKeyDown(id: string, event: KeyboardEvent<HTMLButtonElement>) {
    const from = ordered.findIndex((item) => item.id === id);
    if (event.key === "ArrowUp") { event.preventDefault(); move(id, from - 1); }
    if (event.key === "ArrowDown") { event.preventDefault(); move(id, from + 1); }
  }

  return (
    <div className="hub-home-calm hub-dash-stack">
      {ordered.map((item) => (
        <div key={item.id} ref={(node) => { if (node) boxes.current.set(item.id, node); else boxes.current.delete(item.id); }} className={`hub-box${dragging === item.id ? " is-dragging" : ""}`}>
          <button
            type="button"
            className="hub-box-grip"
            aria-label={`Move ${item.label}. Drag, or use the up and down arrow keys.`}
            title="Drag to move"
            onPointerDown={(event) => onPointerDown(item.id, event)}
            onPointerMove={(event) => onPointerMove(item.id, event)}
            onPointerUp={() => setDragging(null)}
            onPointerCancel={() => setDragging(null)}
            onKeyDown={(event) => onKeyDown(item.id, event)}
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
          {item.node}
        </div>
      ))}
      {raw ? <button type="button" className="hub-box-reset" onClick={() => save(null)}>Reset layout</button> : null}
    </div>
  );
}
