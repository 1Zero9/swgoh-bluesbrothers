import { TriangleAlert } from "lucide-react";

type Left = { left: number; limit: number; resetsLabel: string } | null;

const STEPS = [
  { n: 1, badge: "Free", tone: "free", title: "The guild's own knowledge", text: "Counters the guild has saved, and who has which unit. No AI, no question used.", ai: false },
  { n: 2, badge: "Uses 1 question", tone: "paid", title: "Search the web", text: "Only if you tap it, when the guild has nothing saved.", ai: true },
  { n: 3, badge: "Uses 1 question", tone: "paid", title: "Ask the AI", text: "For anything else, like \"what should I farm next?\".", ai: true },
] as const;

/** How B-Lue3 answers, cheapest first, with the cost of each step and a plain warning about the AI ones. */
export default function AnswerLadder({ left = null, compact = false }: { left?: Left; compact?: boolean }) {
  return (
    <section className={`hub-ladder${compact ? " is-compact" : ""}`} aria-label="How B-Lue3 answers">
      <ol>
        {STEPS.map((step) => (
          <li key={step.n} className={`is-${step.tone}`}>
            <span className="hub-ladder-n" aria-hidden="true">{step.n}</span>
            <div>
              <div className="hub-ladder-top">
                <span className={`hub-cost is-${step.tone}`}>{step.badge}</span>
                {step.ai ? <span className="hub-aitag">AI</span> : null}
              </div>
              <strong>{step.title}</strong>
              <small>{step.text}</small>
            </div>
          </li>
        ))}
      </ol>
      {left ? <p className="hub-ladder-left"><strong>{left.left} of {left.limit}</strong> questions left this week. Back on {left.resetsLabel}. Steps 2 and 3 use them; step 1 never does.</p> : null}
      <p className="hub-disclaimer" role="note">
        <TriangleAlert size={18} aria-hidden="true" />
        <span><strong>AI can be wrong.</strong> Steps 2 and 3 use AI and web pages, which can be out of date or just mistaken. Check in game before you commit a squad. Nothing the AI finds is shared with the guild until an officer has checked it.</span>
      </p>
    </section>
  );
}
