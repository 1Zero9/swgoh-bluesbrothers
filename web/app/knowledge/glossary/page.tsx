import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { TERMS, UNIT_NICKNAMES } from "@/lib/glossary";
import { canViewMembersArea } from "@/lib/member-gate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Glossary · Blues Brothers", description: "What the short forms mean: JMK, CLS, GAS, TM, TW, GAC and the rest." };

export default async function GlossaryPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/knowledge/glossary" area="The glossary" />;
  return <GlossaryView />;
}

export function GlossaryView() {
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Knowledge · Help" title="Glossary" intro="The guild's short forms in plain words. You can type any of the unit ones into a search or a question to B-Lue3, and it finds the right unit.">
        <Link className="hub-pagehead-link" href="/knowledge/handbook">Combat handbook →</Link>
      </HubHeader>
      <section className="help-box">
        <h2>Game terms</h2>
        <ul className="hb-rows">{TERMS.map((term) => <li key={term.abbr}><strong>{term.abbr}</strong> <span>{term.meaning}</span>{term.detail ? <em>{term.detail}</em> : null}</li>)}</ul>
      </section>
      <section className="help-box">
        <h2>Unit nicknames</h2>
        <ul className="hb-rows">{UNIT_NICKNAMES.map((nick) => <li key={nick.abbr}><strong>{nick.abbr}</strong> <span>{nick.name}</span></li>)}</ul>
      </section>
    </HubPage>
  );
}
