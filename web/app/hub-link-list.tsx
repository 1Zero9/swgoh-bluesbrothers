import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HubLink } from "@/lib/hub-links";
import NavIcon from "./nav-icon";

export default function HubLinkList({ links, quiet = false }: { links: HubLink[]; quiet?: boolean }) {
  return (
    <ul className={`hub-links${quiet ? " is-quiet" : ""}`}>
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="hub-link">
            <span className="hub-link-icon"><NavIcon name={link.icon} size={18} /></span>
            <span className="hub-link-text"><strong>{link.label}</strong><small>{link.hint}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
