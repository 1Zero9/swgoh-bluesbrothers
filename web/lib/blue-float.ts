/** Where B-Lue3's floating icon sits. Stored as a share of the free space so it survives a resized window. */

export type FloatPos = { fx: number; fy: number };

export const FLOAT_SIZE = 76;
export const EDGE = 8;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function parsePos(raw: string): FloatPos | null {
  try {
    const value = JSON.parse(raw) as Partial<FloatPos>;
    if (typeof value.fx === "number" && typeof value.fy === "number" && Number.isFinite(value.fx) && Number.isFinite(value.fy)) {
      return { fx: clamp01(value.fx), fy: clamp01(value.fy) };
    }
  } catch {
    /* nothing saved, or not ours */
  }
  return null;
}

/** Pixel position (top-left) for a stored share, kept fully on screen. */
export function toPixels(pos: FloatPos, width: number, height: number, size = FLOAT_SIZE) {
  const freeX = Math.max(0, width - size - EDGE * 2);
  const freeY = Math.max(0, height - size - EDGE * 2);
  return { x: EDGE + pos.fx * freeX, y: EDGE + pos.fy * freeY };
}

/** The share to store for a pixel position (top-left), clamped on screen. */
export function fromPixels(x: number, y: number, width: number, height: number, size = FLOAT_SIZE): FloatPos {
  const freeX = Math.max(1, width - size - EDGE * 2);
  const freeY = Math.max(1, height - size - EDGE * 2);
  return { fx: clamp01((x - EDGE) / freeX), fy: clamp01((y - EDGE) / freeY) };
}

/** A pointer that barely moved is a tap, not a drag. */
export function isTap(dx: number, dy: number, slop = 6) {
  return Math.hypot(dx, dy) < slop;
}
