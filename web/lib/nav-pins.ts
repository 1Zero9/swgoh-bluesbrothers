/** Menu favourites: a list of page links the member pinned under the fixed items, kept on this device. */

export function parsePins(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    for (const item of value) if (typeof item === "string" && item.startsWith("/") && !out.includes(item)) out.push(item);
    return out;
  } catch {
    return [];
  }
}

/** Pin or unpin a link. New pins go at the end. */
export function togglePin(pins: string[], href: string): string[] {
  return pins.includes(href) ? pins.filter((item) => item !== href) : [...pins, href];
}

/** The pinned links that still exist (and that this member may see), in the order they were pinned. */
export function pinnedLinks<T extends { href: string }>(pins: string[], available: T[]): T[] {
  return pins.map((href) => available.find((link) => link.href === href)).filter((link): link is T => Boolean(link));
}
