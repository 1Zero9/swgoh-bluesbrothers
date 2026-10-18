"use client";

export type NeedItem = { unit: string; kind: "own" | "stars" | "relic"; have: number; want: number };
export type Option = { label: string; needs: NeedItem[] };

/** How far a squad is: not owning a unit is the biggest job, then missing stars, then relic levels. */
export const effortOf = (needs: NeedItem[]) => needs.reduce((sum, need) => sum + (need.kind === "own" ? 12 : need.kind === "stars" ? 4 : need.want - need.have), 0);

const line = (need: NeedItem) => (need.kind === "own" ? `Farm ${need.unit} (you don't have it yet)` : need.kind === "stars" ? `Raise ${need.unit} from ${need.have}★ to ${need.want}★` : `Level ${need.unit} to R${need.want} (it's R${need.have} now)`);

/**
 * When none of the counters found are ready for you: the one closest to ready, and exactly what to farm or level to get there.
 * Hidden when you can already run something, or when nothing has a roster comparison (not signed in or not linked).
 */
export default function NextSteps({ options, onAskFarm }: { options: Option[]; onAskFarm?: (question: string) => void }) {
  const open = options.filter((option) => option.needs.length > 0);
  if (!open.length || open.length < options.length) return null;
  const best = [...open].sort((a, b) => effortOf(a.needs) - effortOf(b.needs))[0];
  const farm = best.needs.filter((need) => need.kind === "own");
  return (
    <section className="cf-next" aria-label="What to work on">
      <h3>You can&apos;t run these yet. Here&apos;s the quickest way to get there.</h3>
      <p className="cf-next-lead">Closest for you: <strong>{best.label}</strong></p>
      <ul>
        {best.needs.map((need) => <li key={`${need.unit}-${need.kind}`}>{line(need)}</li>)}
      </ul>
      {farm.length && onAskFarm ? (
        <p className="cf-actions">
          {farm.slice(0, 2).map((need) => <button key={need.unit} type="button" className="kb-secondary" onClick={() => onAskFarm(`Where do I farm ${need.unit} in Star Wars Galaxy of Heroes?`)}>Where to farm {need.unit} · uses 1 question</button>)}
        </p>
      ) : null}
    </section>
  );
}
