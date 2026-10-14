import Link from "next/link";
import BlueIntro from "./blue-intro";
import type { Welcome } from "@/lib/welcome";

/** "Welcome to the band": the first thing members see when someone new has joined (see `buildWelcome`). */
export default function WelcomeBanner({ welcome }: { welcome: Welcome | null }) {
  if (!welcome) return null;
  return (
    <div className="welcome-banner">
      <BlueIntro variant="welcome" endHref="/chat" endLabel="Say hello in chat" />
      <Link className="welcome-banner-link" href="/chat">
      <span className="welcome-banner-copy">
        <small>Welcome to the band</small>
        <strong>{welcome.names.join(" · ")}{welcome.more > 0 ? ` and ${welcome.more} more` : ""}</strong>
        <span>{welcome.single ? "Joined" : "Latest joined"} {welcome.latest}. Say hello in chat.</span>
      </span>
      <span className="welcome-banner-go" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
