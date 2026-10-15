import type { CSSProperties, ReactNode } from "react";
import HubNav from "./hub-nav";

/**
 * The frame for hub screens: the navigation, a themed ground (stars in Deep, a grid in Classic) and the page body.
 * A `banner` runs edge to edge above the padded content; a `backdrop` picture sits fixed behind the whole page instead.
 */
export default function HubPage({ children, banner, backdrop }: { children: ReactNode; banner?: ReactNode; backdrop?: string }) {
  return (
    <>
      <HubNav />
      <main className="hub-main">
        {backdrop ? <div className="hub-backdrop" aria-hidden="true" style={{ "--hub-backdrop-image": `url("${backdrop}")` } as CSSProperties} /> : null}
        <div className="hub-ground" aria-hidden="true" />
        {banner}
        <div className="hub-wrap">{children}</div>
      </main>
    </>
  );
}

export function HubHeading({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <header className="hub-heading">
      <p className="hub-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {intro ? <p className="hub-intro">{intro}</p> : null}
    </header>
  );
}
