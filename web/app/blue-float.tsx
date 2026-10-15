"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EDGE, FLOAT_SIZE, SIDEBAR_FROM, SIDEBAR_W, fromPixels, isTap, parsePos, toPixels, type FloatPos } from "@/lib/blue-float";
import BlueIntro from "./blue-intro";

const KEY = "bb-blue-pos";
const CHANGE = "bb-blue-pos-change";
const PANEL_W = 320;
const PANEL_H = 330;

function readRaw() {
  try { return window.localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}
function subscribeStore(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener(CHANGE, onChange); };
}
function subscribeSize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;

function save(pos: FloatPos | null) {
  try {
    if (pos) window.localStorage.setItem(KEY, JSON.stringify(pos)); else window.localStorage.removeItem(KEY);
  } catch { /* the spot lasts for this visit only */ }
  window.dispatchEvent(new Event(CHANGE));
}

/** Out of the way in the bottom corner until moved: above the tab bar on phones. */
function defaultPixels(width: number, height: number) {
  return { x: width - FLOAT_SIZE - 20, y: height - FLOAT_SIZE - (width < 1024 ? 86 : 20) };
}

/**
 * B-Lue3 as a floating chat icon you can drag anywhere. A tap opens a quick ask box; his spot is remembered on this device.
 * Arrow keys move him when he has focus.
 */
export default function BlueFloat() {
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribeStore, readRaw, () => "");
  const size = useSyncExternalStore(subscribeSize, readSize, () => "0x0");
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const [width, height] = size.split("x").map(Number);
  const saved = parsePos(raw);
  const inset = width >= SIDEBAR_FROM ? SIDEBAR_W : 0;
  const base = saved ? toPixels(saved, width, height, FLOAT_SIZE, inset) : defaultPixels(width, height);
  const at = live ?? base;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onDown = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
  }, [open]);

  // Home has its own ask box, and the ask page is the chat itself, so he steps aside on both (phones keep him).
  if (width === 0 || pathname.startsWith("/ask") || (pathname === "/" && width >= 760)) return null;

  const clampX = (x: number) => Math.min(width - FLOAT_SIZE - EDGE, Math.max(EDGE + inset, x));
  const clampY = (y: number) => Math.min(height - FLOAT_SIZE - EDGE, Math.max(EDGE, y));

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    drag.current = { id: event.pointerId, sx: event.clientX, sy: event.clientY, ox: at.x, oy: at.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.sx;
    const dy = event.clientY - d.sy;
    if (!d.moved && isTap(dx, dy)) return;
    d.moved = true;
    setOpen(false);
    setLive({ x: clampX(d.ox + dx), y: clampY(d.oy + dy) });
  }
  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (d.moved && live) {
      justDragged.current = true;
      save(fromPixels(live.x, live.y, width, height, FLOAT_SIZE, inset));
      setLive(null);
    }
  }
  function onClick() {
    if (justDragged.current) { justDragged.current = false; return; }
    setOpen((value) => !value);
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 80 : 24;
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const delta = move[event.key];
    if (!delta) return;
    event.preventDefault();
    save(fromPixels(clampX(at.x + delta[0]), clampY(at.y + delta[1]), width, height, FLOAT_SIZE, inset));
  }

  // The ask box opens above or below the icon, and stays on screen.
  const panelTop = at.y > PANEL_H + 24 ? at.y - PANEL_H - 10 : at.y + FLOAT_SIZE + 10;
  const panelLeft = Math.min(width - PANEL_W - EDGE, Math.max(EDGE + inset, at.x + FLOAT_SIZE / 2 - PANEL_W / 2));

  return (
    <div ref={rootRef} className="hub-blue-float-root">
      <button
        type="button"
        className={`hub-blue-float${live ? " is-dragging" : ""}`}
        style={{ left: at.x, top: at.y }}
        aria-label="B-Lue3: ask a question. Drag to move me, or use the arrow keys."
        aria-expanded={open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <Image src="/blue.png" alt="" width={FLOAT_SIZE * 2} height={FLOAT_SIZE * 2} draggable={false} />
      </button>
      {open ? (
        <div className="hub-blue-panel" style={{ left: panelLeft, top: panelTop, width: PANEL_W }} role="dialog" aria-label="Ask B-Lue3">
          <p className="hub-eyebrow is-amber">B-Lue3 · your guild droid</p>
          <form action="/ask" method="get">
            <input name="q" aria-label="Ask B-Lue3" placeholder="How do I beat Lord Vader in TW?" maxLength={500} autoComplete="off" autoFocus />
            <button type="submit">Ask</button>
          </form>
          <p className="hub-blue-note">Free from the guild&apos;s knowledge first. The AI and web search use a question and can be wrong.</p>
          <div className="hub-blue-links">
            <Link href="/ask" onClick={() => setOpen(false)}>Open the full Ask page</Link>
            <BlueIntro variant="text" endHref="/ask" endLabel="Ask B-Lue3 a question" />
          </div>
          <button type="button" className="hub-text-button" onClick={() => { save(null); setLive(null); }}>Put me back in the corner</button>
        </div>
      ) : null}
    </div>
  );
}
