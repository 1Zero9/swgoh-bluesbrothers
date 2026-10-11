"use client";

import { useEffect, useState } from "react";

// Texas and Chicago share Central time, so they share one clock.
const ZONES = [
  { label: "Arizona", short: "AZ", tz: "America/Phoenix" },
  { label: "Texas · Chicago", short: "TX·CHI", tz: "America/Chicago" },
  { label: "New York", short: "NY", tz: "America/New_York" },
  { label: "Dublin", short: "DUB", tz: "Europe/Dublin" },
];

function formatTime(now: Date, tz: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}

/** Guild members span the US and Europe, so show the time where they are. Renders blank until mounted to avoid a server/client mismatch. */
export default function WorldClocks() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 15000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, []);

  return (
    <ul className="world-clocks" aria-label="Current time in guild time zones">
      {ZONES.map((zone) => (
        <li key={zone.tz}>
          <span><b className="clock-long">{zone.label}</b><b className="clock-short" aria-hidden="true">{zone.short}</b></span>
          <time>{now ? formatTime(now, zone.tz) : "--:--"}</time>
        </li>
      ))}
    </ul>
  );
}
