import { splitAcronyms } from "@/lib/glossary";

/** Text with a hover hint on the game's short forms: tap or hover JMK and it says "Jedi Master Kenobi". */
export default function Jargon({ text }: { text: string }) {
  return <>{splitAcronyms(text).map((part, index) => (part.meaning ? <abbr key={index} className="jargon" title={part.meaning}>{part.text}</abbr> : <span key={index}>{part.text}</span>))}</>;
}
