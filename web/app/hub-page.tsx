import type { ReactNode } from "react";
import HubNav from "./hub-nav";

/** The frame for hub screens: the five-section navigation plus a themed page body. */
export default function HubPage({ children }: { children: ReactNode }) {
  return (
    <>
      <HubNav />
      <main className="hub-main">
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
