import Link from "next/link";
import type { ReactNode } from "react";
import { BuiltByBadge } from "./built-by-badge";

type IntelFooterProps = {
  message?: string;
  links?: Array<{ href: string; label: string }>;
  children?: ReactNode;
};

export default function IntelFooter({
  message,
  links,
  children,
}: IntelFooterProps) {
  return (
    <footer className="intel-footer">
      <div className="intel-footer-left">
        {message ? <span>{message}</span> : null}
        <BuiltByBadge />
      </div>
      {children ? (
        <div className="intel-footer-nav">{children}</div>
      ) : links && links.length > 0 ? (
        <div className="intel-footer-nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </footer>
  );
}
