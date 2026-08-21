import Image from "next/image";
import type { ReactNode } from "react";

type PageHeroProps = {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
  className?: string;
  priority?: boolean;
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
}: PageHeroProps) {
  return (
    <section className={`page-hero ${className}`.trim()}>
      <Image
        className="page-hero-image"
        src={image}
        alt={imageAlt}
        fill
        priority={priority}
        sizes="(max-width: 760px) calc(100vw - 28px), 1220px"
      />
      <div className="page-hero-shade" />
      <div className="page-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
    </section>
  );
}
