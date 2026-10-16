"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { GripVertical, LayoutGrid, MoveDiagonal2 } from "lucide-react";
import { COLS, GAP, MIN_H, MIN_W, ROW, compactLayout, layoutRows, parseLayout, resolveLayout, rowsFor, type Pos } from "@/lib/home-layout";

type Item = { id: string; label: string; node: ReactNode; cols?: number };
type Drag = { id: string; startLeft: number; startTop: number; x: number; y: number; left: number; top: number };
type Resize = { id: string; x: number; y: number; startW: number; startH: number; w: number; h: number };

/** Boxes are this many of the 12 grid columns wide until you resize them. */
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
 * The Home boxes, placed anywhere on a snap grid. Drag the grip to move a box, drag the corner to resize it (wider, narrower,
 * taller, shorter; double-click the corner to fit it to its content again), "Tidy up" slides everything up into the gaps.
 * Your layout is kept on this device. On a narrow screen the boxes stack in their usual order.
 */
export default function MovableBoxes({ items }: { items: Item[] }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const saved = useMemo(() => parseLayout(raw), [raw]);
  const [width, setWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [resize, setResize] = useState<Resize | null>(null);
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

  /** Size of each box right now: what you saved, or what it is mid-resize, or nothing (fits its content). */
  const sizeOf = (id: string): { w: number; h?: number } => {
    if (resize && resize.id === id) return { w: resize.w, h: resize.h };
    const item = items.find((candidate) => candidate.id === id);
    return { w: saved[id]?.w ?? item?.cols ?? DEFAULT_COLS, h: saved[id]?.h };
  };
  const sized = items.map((item) => {
    const size = sizeOf(item.id);
    return { id: item.id, w: size.w, rows: size.h ?? rowsFor(heights[item.id] ?? 200) };
  });
  const settled = resolveLayout(sized, saved);
  const live = drag ? resolveLayout(sized, { ...settled, [drag.id]: { c: Math.round(drag.left / colW), r: Math.round(drag.top / ROW) } }, drag.id)
    : resize ? resolveLayout(sized, settled, resize.id) : settled;
  const rows = layoutRows(sized, live);

  /** Positions plus the sizes you gave, ready to store. */
  function withSizes(layout: Record<string, Pos>): Record<string, Pos> {
    const out: Record<string, Pos> = {};
    for (const item of items) {
      const pos = layout[item.id];
      if (!pos) continue;
      const w = saved[item.id]?.w;
      const h = saved[item.id]?.h;
      out[item.id] = { c: pos.c, r: pos.r, ...(w ? { w } : {}), ...(h ? { h } : {}) };
    }
    return out;
  }

  function place(id: string, pos: Pos) {
    save(withSizes(resolveLayout(sized, { ...settled, [id]: pos }, id)));
  }

  function onPointerDown(id: string, event: PointerEvent<HTMLButtonElement>) {
    const pos = settled[id];
    if (!free || !pos) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id, startLeft: pos.c * colW, startTop: pos.r * ROW, x: event.clientX, y: event.clientY, left: pos.c * colW, top: pos.r * ROW });
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const width = sizeOf(drag.id).w;
    const maxLeft = (COLS - width) * colW;
    setDrag({ ...drag, left: Math.min(Math.max(drag.startLeft + event.clientX - drag.x, 0), maxLeft), top: Math.max(drag.startTop + event.clientY - drag.y, 0) });
  }

  function onPointerUp() {
    if (!drag) return;
    const target = live[drag.id];
    setDrag(null);
    if (target) save(withSizes(live));
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

  /* ----- resizing ----- */
  function startResize(id: string, event: PointerEvent<HTMLButtonElement>) {
    const node = box.current.get(id);
    const pos = settled[id];
    if (!free || !node || !pos) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const size = sizeOf(id);
    setResize({ id, x: event.clientX, y: event.clientY, startW: node.offsetWidth, startH: node.offsetHeight, w: size.w, h: size.h ?? rowsFor(node.offsetHeight) });
  }

  function moveResize(event: PointerEvent<HTMLButtonElement>) {
    if (!resize) return;
    const pos = settled[resize.id];
    const w = Math.min(Math.max(Math.round((resize.startW + event.clientX - resize.x + GAP) / colW), MIN_W), COLS - (pos?.c ?? 0));
    const h = Math.max(Math.round((resize.startH + event.clientY - resize.y + GAP) / ROW), MIN_H);
    if (w !== resize.w || h !== resize.h) setResize({ ...resize, w, h });
  }

  function endResize() {
    if (!resize) return;
    const { id, w, h } = resize;
    const result = resolveLayout(sized, settled, id);
    setResize(null);
    const next = withSizes(result);
    next[id] = { ...(next[id] ?? { c: 0, r: 0 }), w, h };
    save(next);
  }

  /** Back to fitting its content: double-click the corner. */
  function fit(id: string) {
    const next = withSizes(settled);
    const pos = next[id];
    if (pos) next[id] = { c: pos.c, r: pos.r };
    save(next);
  }

  function tidy() {
    save(withSizes(compactLayout(sized, settled)));
  }

  return (
    <div className="hub-home-calm hub-dash-stack">
      <div ref={wrap} className={`hub-boxes${free ? " is-free" : ""}`} style={free ? { height: rows * ROW } : undefined}>
        {free && (drag || resize) && live[(drag ?? resize)!.id] ? (
          <div className="hub-box-ghost" aria-hidden="true" style={{ left: live[(drag ?? resize)!.id].c * colW, top: live[(drag ?? resize)!.id].r * ROW, width: sizeOf((drag ?? resize)!.id).w * colW - GAP, height: (sized.find((entry) => entry.id === (drag ?? resize)!.id)?.rows ?? 8) * ROW - GAP }} />
        ) : null}
        {items.map((item) => {
          const pos = live[item.id];
          const dragged = drag?.id === item.id;
          const size = sizeOf(item.id);
          const style = free && pos
            ? { left: dragged ? drag.left : pos.c * colW, top: dragged ? drag.top : pos.r * ROW, width: size.w * colW - GAP, ...(size.h ? { height: size.h * ROW - GAP } : {}) }
            : undefined;
          return (
            <div key={item.id} ref={(node) => measure(item.id, node)} className={`hub-box${dragged ? " is-dragging" : ""}${resize?.id === item.id ? " is-resizing" : ""}${free && size.h ? " has-height" : ""}`} style={style}>
              {free ? (
                <>
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
                  <button
                    type="button"
                    className="hub-box-resize"
                    aria-label={`Resize ${item.label}. Drag the corner; double-click to fit it to its content.`}
                    title="Drag to resize, double-click to fit"
                    onPointerDown={(event) => startResize(item.id, event)}
                    onPointerMove={moveResize}
                    onPointerUp={endResize}
                    onPointerCancel={() => setResize(null)}
                    onDoubleClick={() => fit(item.id)}
                  >
                    <MoveDiagonal2 size={14} aria-hidden="true" />
                  </button>
                </>
              ) : null}
              {item.node}
            </div>
          );
        })}
      </div>
      {free ? (
        <div className="hub-box-tools">
          <button type="button" onClick={tidy}><LayoutGrid size={13} aria-hidden="true" /> Tidy up</button>
          {raw ? <button type="button" className="hub-box-reset" onClick={() => save(null)}>Reset layout</button> : null}
        </div>
      ) : null}
    </div>
  );
}
