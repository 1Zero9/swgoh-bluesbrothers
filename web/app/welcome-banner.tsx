import Link from "next/link";
import NavIcon from "./nav-icon";

type NewMember = { playerId: string; name: string; joinedAt: Date };

/** A new arrival stays on the banner for three weeks, long enough for everyone to say hello. */
const FRESH_DAYS = 21;
const MAX_NAMES = 4;

function joinedLabel(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

/** "Welcome to the band": the first thing members see when someone new has joined. Nothing at all when nobody has. */
export default function WelcomeBanner({ members }: { members: NewMember[] }) {
  const cutoff = Date.now() - FRESH_DAYS * 86_400_000;
  const fresh = members.filter((member) => new Date(member.joinedAt).getTime() >= cutoff);
  if (!fresh.length) return null;
  const shown = fresh.slice(0, MAX_NAMES);
  const more = fresh.length - shown.length;
  return (
    <Link className="welcome-banner" href="/chat">
      <span className="welcome-banner-icon"><NavIcon name="party" size={26} /></span>
      <span className="welcome-banner-copy">
        <small>Welcome to the band</small>
        <strong>{shown.map((member) => member.name).join(" · ")}{more > 0 ? ` and ${more} more` : ""}</strong>
        <span>{shown.length === 1 ? `Joined ${joinedLabel(new Date(shown[0].joinedAt))}.` : `Latest joined ${joinedLabel(new Date(shown[0].joinedAt))}.`} Say hello in chat.</span>
      </span>
      <span className="welcome-banner-go" aria-hidden="true">→</span>
    </Link>
  );
}
