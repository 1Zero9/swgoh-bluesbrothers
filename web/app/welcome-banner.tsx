import Link from "next/link";
import NavIcon from "./nav-icon";
import type { Welcome } from "@/lib/welcome";

/** "Welcome to the band": the first thing members see when someone new has joined (see `buildWelcome`). */
export default function WelcomeBanner({ welcome }: { welcome: Welcome | null }) {
  if (!welcome) return null;
  return (
    <Link className="welcome-banner" href="/chat">
      <span className="welcome-banner-icon"><NavIcon name="party" size={26} /></span>
      <span className="welcome-banner-copy">
        <small>Welcome to the band</small>
        <strong>{welcome.names.join(" · ")}{welcome.more > 0 ? ` and ${welcome.more} more` : ""}</strong>
        <span>{welcome.single ? "Joined" : "Latest joined"} {welcome.latest}. Say hello in chat.</span>
      </span>
      <span className="welcome-banner-go" aria-hidden="true">→</span>
    </Link>
  );
}
