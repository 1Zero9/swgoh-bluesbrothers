export type WelcomeTickerMember = {
  playerId: string;
  name: string;
  joinedAt: string;
  galacticPower: string | null;
  memberRole: string | null;
};

function formatPower(value: string | null) {
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return number.toLocaleString("en-GB");
}

function relativeJoin(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days <= 0) return "Joined today";
  if (days === 1) return "Joined yesterday";
  if (days < 14) return `Joined ${days}d ago`;
  return `Joined ${Math.floor(days / 7)}w ago`;
}

export default function MemberWelcomeTicker({ members }: { members: WelcomeTickerMember[] }) {
  if (!members.length) return null;
  const loop = members.length > 1 ? [...members, ...members] : members;

  return (
    <section className="welcome-ticker" aria-label="Recently joined members">
      <div className="welcome-ticker-label">
        <p className="eyebrow">Fresh arrivals</p>
        <strong>{members.length} {members.length === 1 ? "member" : "members"} joined in the last 30 days</strong>
      </div>
      <div className="welcome-ticker-track-wrap">
        <div className={`welcome-ticker-track${members.length > 1 ? " is-scrolling" : ""}`}>
          {loop.map((member, index) => (
            <span className="welcome-chip" key={`${member.playerId}-${index}`}>
              <i aria-hidden="true">{member.name.charAt(0).toUpperCase()}</i>
              <span>
                <b>Welcome, {member.name}!</b>
                <small>{relativeJoin(member.joinedAt)}{formatPower(member.galacticPower) ? ` · ${formatPower(member.galacticPower)} GP` : ""}</small>
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
