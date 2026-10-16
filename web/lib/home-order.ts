/** Put items in the order saved on this device (a JSON list of ids). Unknown ids are dropped, new items go at the end. */
export function arrangeById<T extends { id: string }>(items: T[], raw: string): T[] {
  let saved: string[] = [];
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (Array.isArray(value)) saved = value.filter((id): id is string => typeof id === "string");
  } catch { /* fall back to the default order */ }
  const known: T[] = [];
  for (const id of saved) {
    const item = items.find((candidate) => candidate.id === id);
    if (item && !known.includes(item)) known.push(item);
  }
  return [...known, ...items.filter((item) => !known.includes(item))];
}
