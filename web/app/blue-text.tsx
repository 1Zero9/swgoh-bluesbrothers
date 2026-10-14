import { parseBlueText, type Inline } from "@/lib/blue/format";

function Inlines({ parts }: { parts: Inline[] }) {
  return <>{parts.map((part, index) => (part.kind === "bold" ? <strong key={index}>{part.text}</strong> : part.kind === "italic" ? <em key={index}>{part.text}</em> : <span key={index}>{part.text}</span>))}</>;
}

/** B-Lue3's reply with bold, italics and lists shown properly. Built from React elements only, never raw HTML. */
export default function BlueText({ text }: { text: string }) {
  return (
    <div className="blue-text">
      {parseBlueText(text).map((block, index) => {
        if (block.kind === "paragraph") return <p key={index}><Inlines parts={block.inline} /></p>;
        const items = block.items.map((item, i) => <li key={i}><Inlines parts={item} /></li>);
        return block.kind === "bullets" ? <ul key={index}>{items}</ul> : <ol key={index} start={block.start}>{items}</ol>;
      })}
    </div>
  );
}
