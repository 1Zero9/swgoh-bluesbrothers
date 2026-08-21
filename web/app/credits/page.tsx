import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/app/site-header";

export const metadata: Metadata = {
  title: "Sources & Credits · Blues Brothers",
  description: "Open-source acknowledgements and third-party notices for Blues Brothers Guild Command.",
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
      <section className="credits-hero">
        <SiteHeader homeHref="/" />
        <div className="credits-hero-copy">
          <p className="eyebrow">Open-source credits</p>
          <h1>Built with help from<br /><em>the wider holotable.</em></h1>
          <p>We keep borrowed code and data visible, attributed, and inside the permissions granted by each project.</p>
        </div>
      </section>
      <section className="credit-list" aria-label="Open-source projects used by the site">
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
      <footer className="intel-footer">
        <span>Full notices are kept in THIRD_PARTY_NOTICES.md.</span>
        <Link href="/arsenal">Open Guild Arsenal →</Link>
      </footer>
    </main>
  );
}
