export type Inline = { kind: "text" | "bold" | "italic"; text: string };
export type Block =
  | { kind: "paragraph"; inline: Inline[] }
  | { kind: "bullets"; items: Inline[][] }
  | { kind: "numbers"; items: Inline[][]; start: number };

/** **bold** and *italic* in a line; everything else stays as plain text (React escapes it, so nothing here can inject markup). */
export function parseInline(line: string): Inline[] {
  const parts: Inline[] = [];
  for (const piece of line.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)) {
    if (!piece) continue;
    if (piece.startsWith("**") && piece.endsWith("**") && piece.length > 4) parts.push({ kind: "bold", text: piece.slice(2, -2) });
    else if (piece.startsWith("*") && piece.endsWith("*") && piece.length > 2) parts.push({ kind: "italic", text: piece.slice(1, -1) });
    else parts.push({ kind: "text", text: piece });
  }
  return parts;
}

/** B-Lue3's reply as paragraphs and lists, so "* item" and "1. item" read as lists, not stray symbols. */
export function parseBlueText(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const bullet = /^\s*[*•-]\s+(.*)$/.exec(line);
    const number = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const item = bullet ?? number;
    if (item) {
      const last = blocks[blocks.length - 1];
      if (bullet) {
        if (last && last.kind === "bullets") last.items.push(parseInline(item[1]));
        else blocks.push({ kind: "bullets", items: [parseInline(item[1])] });
      } else if (last && last.kind === "numbers") {
        last.items.push(parseInline(item[1]));
      } else {
        // A numbered list interrupted by sub-bullets carries on from its own number, not from 1.
        blocks.push({ kind: "numbers", items: [parseInline(item[1])], start: Number(/^\s*(\d+)/.exec(line)?.[1] ?? 1) });
      }
    } else {
      blocks.push({ kind: "paragraph", inline: parseInline(line.trim()) });
    }
  }
  return blocks;
}
