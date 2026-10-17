"use client";

import { useState } from "react";
import type { AdminMember, AdminQuestion, AdminSearch } from "@/lib/blue/log";

type Data = { questions: AdminQuestion[]; members: AdminMember[]; searches: AdminSearch[]; cutoffs: { playerId: string; name: string; reason: string | null; at: string }[] };
const when = (value: string) => new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function BlueLog({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial);
  const [filter, setFilter] = useState<"all" | "blocked">("all");
  const [who, setWho] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load(next: "all" | "blocked") {
    setFilter(next);
    const response = await fetch(`/api/admin/blue?filter=${next}`, { cache: "no-store" }).catch(() => null);
    const json = (await response?.json().catch(() => null)) as (Data & { ok?: boolean }) | null;
    if (json?.ok) setData({ questions: json.questions, members: json.members, searches: json.searches, cutoffs: json.cutoffs });
  }

  async function act(action: "cutoff" | "restore", playerId: string, name: string) {
    if (action === "cutoff" && !window.confirm(`Cut ${name} off from B-Lue3?`)) return;
    const reason = action === "cutoff" ? window.prompt("Reason (only you see this)", "Misuse") ?? "" : "";
    const response = await fetch("/api/admin/blue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, playerId, name, reason }) }).catch(() => null);
    const json = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setMessage(json?.ok ? (action === "cutoff" ? `${name} is cut off.` : `${name} is restored.`) : json?.error ?? "That did not work.");
    await load(filter);
  }

  const shown = data.questions.filter((entry) => !who || entry.playerId === who);
  const cutIds = new Set(data.cutoffs.map((entry) => entry.playerId));

  return (
    <div className="hub-knowledge bl">
      {message ? <p className="kb-notice" role="status">{message}<button type="button" onClick={() => setMessage(null)} aria-label="Dismiss">×</button></p> : null}

      <section className="bl-box">
        <h3>What members search for in Find a counter, last 30 days</h3>
        {data.searches.length ? (
          <ul className="bl-members">
            {data.searches.map((item) => (
              <li key={item.term}><span><strong>{item.term}</strong> <small>{item.count} search{item.count === 1 ? "" : "es"} · {item.people} member{item.people === 1 ? "" : "s"}{item.hadAnswer ? "" : " · nothing found"}</small></span></li>
            ))}
          </ul>
        ) : <p className="kb-meta">No searches yet.</p>}
        <p className="kb-meta">Searches where nothing was found are the best ideas for what to add next.</p>
      </section>

      <section className="bl-box">
        <h3>Members, last 30 days</h3>
        {data.members.length ? (
          <ul className="bl-members">
            {data.members.map((member) => (
              <li key={member.playerId} className={member.blocked ? "has-blocked" : undefined}>
                <button type="button" className="bl-name" onClick={() => setWho(who === member.playerId ? "" : member.playerId)} aria-pressed={who === member.playerId}>{member.name}</button>
                <span>{member.total} asked</span>
                <span className={member.blocked ? "bl-bad" : undefined}>{member.blocked} blocked</span>
                <span className="bl-when">{member.lastAt ? when(member.lastAt) : ""}</span>
                {cutIds.has(member.playerId)
                  ? <button type="button" className="bl-restore" onClick={() => void act("restore", member.playerId, member.name)}>Restore</button>
                  : <button type="button" className="bl-cut" onClick={() => void act("cutoff", member.playerId, member.name)}>Cut off</button>}
              </li>
            ))}
          </ul>
        ) : <p className="bl-empty">Nobody has asked B-Lue3 anything yet.</p>}
        {data.cutoffs.length ? <p className="bl-cutlist">Cut off now: {data.cutoffs.map((entry) => `${entry.name}${entry.reason ? ` (${entry.reason})` : ""}`).join(", ")}</p> : null}
      </section>

      <div className="hub-kbar">
        <div className="hub-segment" role="group" aria-label="Which questions">
          <button type="button" aria-pressed={filter === "all"} onClick={() => void load("all")}>Everything</button>
          <button type="button" aria-pressed={filter === "blocked"} onClick={() => void load("blocked")}>Blocked only</button>
        </div>
        {who ? <button type="button" className="mc-refresh" onClick={() => setWho("")}>Showing one member · clear</button> : null}
      </div>

      <ul className="bl-list">
        {shown.length === 0 ? <li className="kb-empty"><strong>Nothing to show.</strong></li> : null}
        {shown.map((entry) => (
          <li key={entry.id} className={`bl-item is-${entry.verdict.toLowerCase()}`}>
            <div className="bl-top"><strong>{entry.name}</strong><span className={`bl-route is-${entry.route}`}>{entry.verdict === "BLOCKED" ? "Blocked" : entry.route === "ai" ? "AI answer" : "Free answer"}</span><time>{when(entry.at)}</time></div>
            <p className="bl-q">{entry.question}</p>
            {entry.reason ? <p className="bl-reason">Why: {entry.reason}</p> : null}
            {entry.answer ? <p className="bl-a">{entry.answer}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
