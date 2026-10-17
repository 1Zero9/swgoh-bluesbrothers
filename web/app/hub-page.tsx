import type { CSSProperties, ReactNode } from "react";
import HubNav from "./hub-nav";

/**
 * The frame for hub screens: the navigation, a themed ground (stars in Deep, a grid in Classic) and the page body.
 * A `banner` runs edge to edge above the padded content; a `backdrop` picture sits fixed behind the whole page instead ("themed" picks the picture for the chosen theme).
 */
export default function HubPage({ children, banner, backdrop, inner = false }: { children: ReactNode; banner?: ReactNode; backdrop?: string; inner?: boolean }) {
  return (
    <>
      <HubNav />
      <main className={`hub-main${inner ? " is-inner" : ""}`}>
        {backdrop === "themed" ? <div className={`hub-backdrop is-themed${inner ? " is-quiet" : ""}`} aria-hidden="true" /> : backdrop ? <div className="hub-backdrop" aria-hidden="true" style={{ "--hub-backdrop-image": `url("${backdrop}")` } as CSSProperties} /> : null}
        <div className="hub-ground" aria-hidden="true" />
        {banner}
        <div className="hub-wrap">{children}</div>
      </main>
    </>
  );
}

/**
 * The header every inner page shares: a slim frosted bar with the page's small label, its title, one line about it, and
 * (on the right) the page's main actions. The page's picture is the themed background behind it, not a tall banner.
 */
export function HubHeader({ eyebrow, title, intro, meta, children }: { eyebrow: string; title: ReactNode; intro?: ReactNode; meta?: ReactNode; children?: ReactNode }) {
  return (
    <header className="hub-pagehead">
      <div>
        <p className="hub-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro ? <p className="hub-pagehead-intro">{intro}</p> : null}
        {meta ? <p className="hub-pagehead-meta">{meta}</p> : null}
      </div>
      {children ? <div className="hub-pagehead-actions">{children}</div> : null}
    </header>
  );
}

/** The quiet row of links and a note at the foot of an inner page. */
export function HubLinks({ message, children }: { message?: ReactNode; children?: ReactNode }) {
  return (
    <footer className="hub-linkrow">
      {message ? <span>{message}</span> : null}
      {children ? <nav>{children}</nav> : null}
    </footer>
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
