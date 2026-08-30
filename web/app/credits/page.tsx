import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/app/site-header";
import IntelFooter from "@/app/intel-footer";
import { OneZeroNineLogo } from "@/app/built-by-badge";

export const metadata: Metadata = {
  title: "Sources & Credits · Blues Brothers",
  description: "Open-source acknowledgements and studio attribution for Blues Brothers Guild Command.",
};

const projects = [
  {
    name: "swgoh-comlink",
    author: "swgoh-utils",
    use: "Read-only access to live guild and player data.",
    licence: "External service · no code copied",
    url: "https://github.com/swgoh-utils/swgoh-comlink",
  },
  {
    name: "SWGoHBot",
    author: "Jeffrey Milner and contributors",
    use: "The Guild Arsenal priority-unit checklist is adapted from its unitChecklist data.",
    licence: "MIT",
    url: "https://github.com/jmiln/SWGoHBot",
  },
];

export default function CreditsPage() {
  return (
    <main className="intel-shell credits-shell">
      <SiteHeader homeHref="/" />
      <section className="credits-hero">
        <div className="credits-hero-copy">
          <p className="eyebrow">Studio &amp; Open-source credits</p>
          <h1>Built with help from<br /><em>the wider holotable.</em></h1>
          <p>Designed and built at 1Zero9 Studio, with live data sync and borrowed code visible, attributed, and inside the permissions granted by each project.</p>
        </div>
      </section>
      <section className="credit-list" aria-label="Studio attribution and open-source projects used by the site">
        <article className="credit-card studio-credit-card">
          <div className="studio-credit-head">
            <span className="studio-pill">Design &amp; Architecture</span>
            <div className="studio-title-row">
              <OneZeroNineLogo className="studio-card-logo" />
              <h2>1Zero9 Studio</h2>
            </div>
            <p>Stephen Cranfield · 1zero9.com</p>
          </div>
          <p>Product thinking, custom interface design, live Comlink sync architecture, and high-performance guild operations platform.</p>
          <a href="https://1zero9.com" target="_blank" rel="noreferrer" className="studio-visit-link">
            Visit 1zero9.com <span>↗</span>
          </a>
        </article>
        {projects.map((project) => (
          <article className="credit-card" key={project.name}>
            <div><span>{project.licence}</span><h2>{project.name}</h2><p>{project.author}</p></div>
            <p>{project.use}</p>
            <a href={project.url} target="_blank" rel="noreferrer">View repository <span>↗</span></a>
          </article>
        ))}
      </section>
      <section className="credit-note">
        <h2>Star Wars and game assets</h2>
        <p>Star Wars: Galaxy of Heroes and related names, characters, imagery and marks belong to their respective owners. This is an independent guild utility and is not affiliated with or endorsed by Electronic Arts, Capital Games, Lucasfilm or Disney.</p>
      </section>
      <IntelFooter message="Full notices are kept in THIRD_PARTY_NOTICES.md.">
        <Link href="/arsenal">Open Guild Arsenal →</Link>
      </IntelFooter>
    </main>
  );
}
