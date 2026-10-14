import type { CSSProperties, ReactNode } from "react";

/** The slim picture banner at the top of a hub page: the same look as Home, with the page's own picture and words. */
export default function HubBanner({ image, position = "center 30%", eyebrow, title, intro, children }: { image: string; position?: string; eyebrow: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  const style = { "--hub-banner-image": `url("${image}")`, "--hub-banner-pos": position } as CSSProperties;
  return (
    <section className="hub-banner is-page" aria-label={typeof title === "string" ? title : eyebrow} style={style}>
      <div className="hub-banner-bg" aria-hidden="true" />
      <div className="hub-banner-copy">
        <div>
          <p className="hub-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {intro ? <p className="hub-banner-intro">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
