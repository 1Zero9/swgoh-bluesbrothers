/** Free placement of the Home boxes on a snap grid: 12 columns across, rows of ROW px down. */
export const COLS = 12;
export const ROW = 24;
export const GAP = 16;

/** A box's spot on the grid (column, row), and optionally the size you gave it: `w` columns wide, `h` rows tall. No size means it fits its content. */
export type Pos = { c: number; r: number; w?: number; h?: number };
export const MIN_W = 3;
export const MIN_H = 5;
export type Box = { id: string; w: number; rows: number };

/** How many grid rows a box of this pixel height covers, including the gap under it. */
export function rowsFor(heightPx: number): number {
  return Math.max(1, Math.ceil((heightPx + GAP) / ROW));
}

/** Read saved positions. Anything that is not a whole-number position is ignored. */
export function parseLayout(raw: string): Record<string, Pos> {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const out: Record<string, Pos> = {};
    for (const [id, pos] of Object.entries(value as Record<string, unknown>)) {
      const p = pos as Partial<Pos> | null;
      if (p && Number.isInteger(p.c) && Number.isInteger(p.r) && (p.c as number) >= 0 && (p.r as number) >= 0) {
        const w = Number.isInteger(p.w) && (p.w as number) >= MIN_W && (p.w as number) <= COLS ? (p.w as number) : undefined;
        const h = Number.isInteger(p.h) && (p.h as number) >= MIN_H && (p.h as number) <= 400 ? (p.h as number) : undefined;
        out[id] = { c: p.c as number, r: p.r as number, ...(w ? { w } : {}), ...(h ? { h } : {}) };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function collides(a: Pos & { w: number; rows: number }, b: Pos & { w: number; rows: number }) {
  return a.c < b.c + b.w && b.c < a.c + a.w && a.r < b.r + b.rows && b.r < a.r + a.rows;
}

/**
 * Settle every box on the grid. The `priority` box (the one being dragged) keeps its wanted spot; the rest keep theirs
 * too unless something is in the way, in which case they slide down to the first free row. Boxes with no saved spot
 * start in the left half, one under another.
 */
export function resolveLayout(boxes: Box[], wanted: Record<string, Pos | undefined>, priority?: string): Record<string, Pos> {
  const index = new Map(boxes.map((box, i) => [box.id, i]));
  const order = [...boxes].sort((a, b) => {
    if (a.id === priority) return -1;
    if (b.id === priority) return 1;
    const wa = wanted[a.id];
    const wb = wanted[b.id];
    if (wa && wb) return wa.r - wb.r || wa.c - wb.c || (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0);
    if (wa) return -1;
    if (wb) return 1;
    return (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0);
  });
  const placed: Array<Pos & { w: number; rows: number }> = [];
  const out: Record<string, Pos> = {};
  for (const box of order) {
    const want = wanted[box.id];
    const c = Math.min(Math.max(want?.c ?? 0, 0), Math.max(COLS - box.w, 0));
    let r = Math.max(want?.r ?? 0, 0);
    while (placed.some((other) => collides({ c, r, w: box.w, rows: box.rows }, other))) r += 1;
    placed.push({ c, r, w: box.w, rows: box.rows });
    out[box.id] = { c, r };
  }
  return out;
}

/** The lowest edge of the layout, in rows. */
export function layoutRows(boxes: Box[], layout: Record<string, Pos>): number {
  return boxes.reduce((max, box) => Math.max(max, (layout[box.id]?.r ?? 0) + box.rows), 0);
}

/** Slide every box up as far as it will go without overlapping (and without changing columns or sizes): the "Tidy up" button. */
export function compactLayout(boxes: Box[], layout: Record<string, Pos>): Record<string, Pos> {
  const order = [...boxes].sort((a, b) => (layout[a.id]?.r ?? 0) - (layout[b.id]?.r ?? 0) || (layout[a.id]?.c ?? 0) - (layout[b.id]?.c ?? 0));
  const placed: Array<Pos & { w: number; rows: number }> = [];
  const out: Record<string, Pos> = {};
  for (const box of order) {
    const c = Math.min(Math.max(layout[box.id]?.c ?? 0, 0), Math.max(COLS - box.w, 0));
    let r = 0;
    while (placed.some((other) => collides({ c, r, w: box.w, rows: box.rows }, other))) r += 1;
    placed.push({ c, r, w: box.w, rows: box.rows });
    out[box.id] = { ...layout[box.id], c, r };
  }
  return out;
}
