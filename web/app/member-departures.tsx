export type DepartedMemberEntry = {
  playerId: string;
  name: string;
  joinedAt: string;
  leftAt: string;
  tenureDays: number;
};

function formatTenure(days: number) {
  if (days < 1) return "less than a day";
  if (days < 31) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = days / 365;
  return `${years.toFixed(years >= 10 ? 0 : 1)}yr`;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function MemberDepartures({ members }: { members: DepartedMemberEntry[] }) {
  if (!members.length) return null;

  return (
    <section className="departures-block" aria-label="Recent departures">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Guild archive</p>
          <h2>Until the next gig</h2>
        </div>
        <span className="departures-count">{members.length} in the last 60 days</span>
      </div>
      <ul className="departures-list">
        {members.map((member) => (
          <li key={member.playerId}>
            <i aria-hidden="true">{member.name.charAt(0).toUpperCase()}</i>
            <span>
              <strong>{member.name}</strong>
              <small>Served {formatTenure(member.tenureDays)} · left {shortDate(member.leftAt)}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
