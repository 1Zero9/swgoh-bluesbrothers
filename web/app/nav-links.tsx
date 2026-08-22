"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  mark: string;
  href: string;
};

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/#guild-wire") {
      return pathname === "/";
    }
    const cleanHref = href.split("#")[0].split("?")[0];
    if (!cleanHref) return false;
    return pathname === cleanHref || pathname.startsWith(cleanHref + "/");
  }

  return (
    <nav className="main-nav" aria-label="Primary navigation">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            className={`nav-link${active ? " active" : ""}`}
            href={item.href}
            key={item.label}
          >
            <span className="nav-mark" aria-hidden="true">{item.mark}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
