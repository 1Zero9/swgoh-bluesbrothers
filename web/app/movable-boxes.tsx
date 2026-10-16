"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { COLS, GAP, ROW, layoutRows, parseLayout, resolveLayout, rowsFor, type Pos } from "@/lib/home-layout";

type Item = { id: string; label: string; node: ReactNode; cols?: number };
type Drag = { id: string; startLeft: number; startTop: number; x: number; y: number; left: number; top: number };

/** Boxes are this many of the 12 grid columns wide. */
const DEFAULT_COLS = 7;
const STORAGE_KEY = "bb-home-layout";
const CHANGE_EVENT = "bb-home-layout-change";
/** Below this width the boxes simply stack; there is no room to place them freely. */
const MIN_FREE_WIDTH = 760;

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

function save(layout: Record<string, Pos> | null) {
  try {
    if (layout) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* the layout lasts for this visit */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * The Home boxes, placed anywhere on a snap grid. Drag the grip (mouse or touch) or move it with the arrow keys; the
 * spot is kept on this device. On a narrow screen they stack in their usual order.
 */
export default function MovableBoxes({ items }: { items: Item[] }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const saved = useMemo(() => parseLayout(raw), [raw]);
  const [width, setWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const box = useRef(new Map<string, HTMLElement>());
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = wrap.current;
    if (!node) return;
    const watch = new ResizeObserver(() => setWidth(node.clientWidth));
    watch.observe(node);
    setWidth(node.clientWidth);
    return () => watch.disconnect();
  }, []);

  const measure = useCallback((id: string, node: HTMLElement | null) => {
    if (node) box.current.set(id, node); else box.current.delete(id);
  }, []);

  useEffect(() => {
    const watch = new ResizeObserver(() => {
      setHeights((previous) => {
        const next = { ...previous };
        let changed = false;
        for (const [id, node] of box.current) {
          const height = Math.round(node.offsetHeight);
          if (next[id] !== height) { next[id] = height; changed = true; }
        }
        return changed ? next : previous;
      });
    });
    for (const node of box.current.values()) watch.observe(node);
    return () => watch.disconnect();
  }, [items.length]);

  const free = width >= MIN_FREE_WIDTH;
  const colW = (width + GAP) / COLS;
  const sized = items.map((item) => ({ id: item.id, w: item.cols ?? DEFAULT_COLS, rows: rowsFor(heights[item.id] ?? 200) }));
  const settled = resolveLayout(sized, saved);
  const live = drag ? resolveLayout(sized, { ...settled, [drag.id]: { c: Math.round(drag.left / colW), r: Math.round(drag.top / ROW) } }, drag.id) : settled;
  const rows = layoutRows(sized, live);

  function place(id: string, pos: Pos) {
    save({ ...resolveLayout(sized, { ...settled, [id]: pos }, id) });
  }

  function onPointerDown(id: string, event: PointerEvent<HTMLButtonElement>) {
    const pos = settled[id];
    if (!free || !pos) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id, startLeft: pos.c * colW, startTop: pos.r * ROW, x: event.clientX, y: event.clientY, left: pos.c * colW, top: pos.r * ROW });
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const maxLeft = (COLS - (items.find((item) => item.id === drag.id)?.cols ?? DEFAULT_COLS)) * colW;
    setDrag({ ...drag, left: Math.min(Math.max(drag.startLeft + event.clientX - drag.x, 0), maxLeft), top: Math.max(drag.startTop + event.clientY - drag.y, 0) });
  }

  function onPointerUp() {
    if (!drag) return;
    const target = live[drag.id];
    setDrag(null);
    if (target) save({ ...live });
  }

  function onKeyDown(id: string, event: KeyboardEvent<HTMLButtonElement>) {
    const pos = settled[id];
    if (!pos || !free) return;
    const step: Record<string, Pos> = { ArrowLeft: { c: pos.c - 1, r: pos.r }, ArrowRight: { c: pos.c + 1, r: pos.r }, ArrowUp: { c: pos.c, r: pos.r - 2 }, ArrowDown: { c: pos.c, r: pos.r + 2 } };
    const next = step[event.key];
    if (!next) return;
    event.preventDefault();
    place(id, { c: Math.max(next.c, 0), r: Math.max(next.r, 0) });
  }

  return (
    <div className="hub-home-calm hub-dash-stack">
      <div ref={wrap} className={`hub-boxes${free ? " is-free" : ""}`} style={free ? { height: rows * ROW } : undefined}>
        {free && drag && live[drag.id] ? (
          <div className="hub-box-ghost" aria-hidden="true" style={{ left: live[drag.id].c * colW, top: live[drag.id].r * ROW, width: (items.find((item) => item.id === drag.id)?.cols ?? DEFAULT_COLS) * colW - GAP, height: (rowsFor(heights[drag.id] ?? 200)) * ROW - GAP }} />
        ) : null}
        {items.map((item) => {
          const pos = live[item.id];
          const dragged = drag?.id === item.id;
          const style = free && pos
            ? { left: dragged ? drag.left : pos.c * colW, top: dragged ? drag.top : pos.r * ROW, width: (item.cols ?? DEFAULT_COLS) * colW - GAP }
            : undefined;
          return (
            <div key={item.id} ref={(node) => measure(item.id, node)} className={`hub-box${dragged ? " is-dragging" : ""}`} style={style}>
              {free ? (
                <button
                  type="button"
                  className="hub-box-grip"
                  aria-label={`Move ${item.label}. Drag it, or use the arrow keys.`}
                  title="Drag to move"
                  onPointerDown={(event) => onPointerDown(item.id, event)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={() => setDrag(null)}
                  onKeyDown={(event) => onKeyDown(item.id, event)}
                >
                  <GripVertical size={16} aria-hidden="true" />
                </button>
              ) : null}
              {item.node}
            </div>
          );
        })}
      </div>
      {raw && free ? <button type="button" className="hub-box-reset" onClick={() => save(null)}>Reset layout</button> : null}
    </div>
  );
}
