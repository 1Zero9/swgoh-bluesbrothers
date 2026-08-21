import Image from "next/image";
import type { ReactNode } from "react";
import SiteHeader from "./site-header";

type PageHeroProps = {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
  className?: string;
  priority?: boolean;
  syncLabel?: string;
};

export default function PageHero({
  image,
  imageAlt,
  eyebrow,
  title,
  description,
  children,
  className = "",
  priority = false,
  syncLabel,
}: PageHeroProps) {
  return (
    <section className={`page-hero ${className}`.trim()}>
      <Image
        className="page-hero-image"
        src={image}
        alt={imageAlt}
        fill
        priority={priority}
        sizes="100vw"
      />
      <div className="page-hero-shade" />
      <SiteHeader homeHref="/" syncLabel={syncLabel} />
      <div className="page-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
    </section>
  );
}
