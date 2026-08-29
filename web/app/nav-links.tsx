"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavCategoryItem } from "./site-header";

export default function NavLinks({ items }: { items: NavCategoryItem[] }) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLElement>(null);

  function isItemActive(item: NavCategoryItem) {
    if (item.href === "/#guild-wire" && pathname === "/") {
      return true;
    }

    if (item.children?.length) {
      return item.children.some((child) => {
        const cleanHref = child.href.split("#")[0].split("?")[0];
        if (cleanHref === "/" && pathname === "/") return true;
        if (cleanHref !== "/" && (pathname === cleanHref || pathname.startsWith(cleanHref + "/"))) {
          return true;
        }
        return false;
      });
    }

    const cleanHref = item.href.split("#")[0].split("?")[0];
    if (!cleanHref) return false;
    return pathname === cleanHref || pathname.startsWith(cleanHref + "/");
  }

  function isChildActive(href: string) {
    if (href === "/#guild-wire") return pathname === "/";
    const cleanHref = href.split("#")[0].split("?")[0];
    if (!cleanHref) return false;
    return pathname === cleanHref || pathname.startsWith(cleanHref + "/");
  }

  function handleMouseEnter(label: string) {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(label);
  }

  function handleMouseLeave() {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  }

  // Close dropdown on route change or Escape
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="main-nav" ref={navRef} aria-label="Primary navigation">
      {items.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isActive = isItemActive(item);
        const isOpen = openDropdown === item.label;

        if (!hasChildren) {
          return (
            <Link
              className={`nav-link${isActive ? " active" : ""}`}
              href={item.href}
              key={item.label}
            >
              <span className="nav-mark" aria-hidden="true">{item.mark}</span>
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <div
            key={item.label}
            className={`nav-dropdown-wrap${isOpen ? " is-open" : ""}`}
            onMouseEnter={() => handleMouseEnter(item.label)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`nav-link nav-dropdown-trigger${isActive ? " active" : ""}`}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => setOpenDropdown(isOpen ? null : item.label)}
            >
              <span className="nav-mark" aria-hidden="true">{item.mark}</span>
              <span>{item.label}</span>
              <span className="nav-chevron" aria-hidden="true">▾</span>
            </button>

            {isOpen && item.children && (
              <div className="nav-dropdown-menu" role="menu">
                <div className="nav-dropdown-grid">
                  {item.children.map((child) => {
                    const childActive = isChildActive(child.href);
                    return (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={`nav-dropdown-item${childActive ? " active" : ""}`}
                        role="menuitem"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <div className="nav-drop-icon">
                          <span>{child.icon || "◈"}</span>
                        </div>
                        <div className="nav-drop-info">
                          <div className="nav-drop-title-row">
                            <strong>{child.label}</strong>
                            <span className="nav-drop-mark">{child.mark}</span>
                          </div>
                          {child.description && <small>{child.description}</small>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
