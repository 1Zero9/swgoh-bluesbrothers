import type { ReactNode } from "react";
import HubNav from "./hub-nav";

/**
 * The frame for hub screens: the navigation, a themed ground (stars in Deep, a grid in Classic) and the page body.
 * A `banner` runs edge to edge above the padded content.
 */
export default function HubPage({ children, banner }: { children: ReactNode; banner?: ReactNode }) {
  return (
    <>
      <HubNav />
      <main className="hub-main">
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
