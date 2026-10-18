import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import Jargon from "@/app/knowledge/jargon";
import { MOD_SETS, MOD_SLOTS, MOD_STORE, OMICRON_TIERS, SLICING, SQUAD_ORDERS } from "@/lib/handbook";
import { canViewMembersArea } from "@/lib/member-gate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Combat handbook · Blues Brothers", description: "Mods, mod sets, slicing, the Mod Store, turn orders for top squads and the omicron priority list." };

export default async function HandbookPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/knowledge/handbook" area="The combat handbook" />;
  return <HandbookView />;
}

/** The page itself, without the sign-in gate, so the local preview can show it. */
export function HandbookView() {
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Knowledge · Help" title="Combat handbook" intro="Mods, turn order and omicron priority: what to equip, what to buy and what to unlock first. Hover (or tap) a short form like TM or CLS to see what it means.">
        <Link className="hub-pagehead-link" href="/knowledge/glossary">Glossary →</Link>
      </HubHeader>
      <nav className="hb-jump" aria-label="Sections">
        <a href="#mods">Mod slots</a><a href="#sets">Mod sets</a><a href="#slicing">Slicing and the store</a><a href="#orders">Turn orders</a><a href="#omicrons">Omicron priority</a>
      </nav>

      <section className="help-box" id="mods">
        <h2>Mod slots and what each can have</h2>
        <p className="hb-lead">Every character wears six mods. The Square, Diamond and Circle have tight choices; the Arrow, Triangle and Cross carry the stats that matter most (Speed, Crit Damage, Potency).</p>
        <div className="hb-grid">
          {MOD_SLOTS.map((slot) => (
            <article key={slot.shape} className="hb-card">
              <h3>{slot.shape} <small>{slot.name} · slot {slot.slot}</small></h3>
              <p className="hb-tag">{slot.kind}</p>
              <ul>{slot.primaries.map((primary) => <li key={primary}>{primary}</li>)}</ul>
              <p><Jargon text={slot.note} /></p>
            </article>
          ))}
        </div>
      </section>

      <section className="help-box" id="sets">
        <h2>The 8 mod sets (at the top mod level)</h2>
        <div className="hb-grid">
          {MOD_SETS.map((set) => (
            <article key={set.name} className="hb-card">
              <h3>{set.name} <small>needs {set.needs} pieces</small></h3>
              <p className="hb-tag">{set.bonus}</p>
              <p><Jargon text={set.note} /></p>
            </article>
          ))}
        </div>
      </section>

      <section className="help-box" id="slicing">
        <h2>Mod colours, slicing and the Mod Store</h2>
        <p className="hb-lead">Each colour tier shows more of the mod&apos;s secondary stats. Upgrading a tier also rolls the stats it already has higher.</p>
        <ul className="hb-rows">{SLICING.map((row) => <li key={row.tier}><strong>{row.tier}</strong> <span>{row.shows}</span><em>{row.advice}</em></li>)}</ul>
        <h3>The Mod Store</h3>
        <p>{MOD_STORE.intro}</p>
        <div className="hb-two">
          <div><h4>Always buy (credits or ship currency only)</h4><ul>{MOD_STORE.buy.map((line) => <li key={line}>{line}</li>)}</ul></div>
          <div><h4>Never buy</h4><ul>{MOD_STORE.skip.map((line) => <li key={line}>{line}</li>)}</ul></div>
        </div>
      </section>

      <section className="help-box" id="orders">
        <h2>Turn order and mods for top squads</h2>
        {SQUAD_ORDERS.map((squad) => (
          <article key={squad.name} className="hb-squad">
            <h3>{squad.name}</h3>
            <p className="hb-tag">Core engine: {squad.engine}</p>
            <h4>Best turn order</h4>
            <ol>{squad.steps.map((step) => <li key={step}><Jargon text={step} /></li>)}</ol>
            <div className="hb-table" role="table" aria-label={`${squad.name} mods`}>
              <div className="hb-tr hb-th" role="row"><span>Unit</span><span>Sets</span><span>Arrow</span><span>Triangle</span><span>Cross</span><span>Aim for</span></div>
              {squad.units.map((unit) => <div key={unit.toon} className="hb-tr" role="row"><strong>{unit.toon}</strong><span>{unit.sets}</span><span>{unit.arrow}</span><span>{unit.triangle}</span><span>{unit.cross}</span><span>{unit.target}</span></div>)}
            </div>
            {squad.note ? <p className="hb-note"><Jargon text={squad.note} /></p> : null}
          </article>
        ))}
      </section>

      <section className="help-box" id="omicrons">
        <h2>Omicron priority</h2>
        <p className="hb-lead">Which omicrons to unlock first. GAC means Grand Arena Championship; TW means Territory War.</p>
        {OMICRON_TIERS.map((tier) => (
          <div key={tier.tier} className="hb-tier">
            <h3>Tier {tier.tier} <small>{tier.label}</small></h3>
            <ul className="hb-rows">{tier.items.map((item) => <li key={item.unit}><strong>{item.unit}</strong> <span>{item.ability} · {item.mode}</span><em><Jargon text={item.why} /></em></li>)}</ul>
          </div>
        ))}
      </section>
    </HubPage>
  );
}
