"use client";

import { useMemo, useState } from "react";
import { buildDiscordGuildMessage, buildDiscordPersonalMessage, type AssignmentRecord, type EligiblePlayer } from "@/lib/tw-planning-engine";
import type { EffectiveZone } from "@/lib/tw-view";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function TwDiscordExport({
  planName,
  zones,
  assignments,
  pool,
  busy,
  onPostToDiscord,
}: {
  planName: string;
  zones: EffectiveZone[];
  assignments: AssignmentRecord[];
  pool: EligiblePlayer[];
  busy: boolean;
  onPostToDiscord: (title: string, message: string) => Promise<unknown>;
}) {
  const [detailed, setDetailed] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<string | null>(null);

  const joinedPool = useMemo(() => pool.filter((p) => p.joined).sort((a, b) => a.name.localeCompare(b.name)), [pool]);
  const guildMessage = useMemo(
    () => buildDiscordGuildMessage(planName, zones, assignments, pool, detailed),
    [planName, zones, assignments, pool, detailed]
  );
  const selectedPlayer = joinedPool.find((p) => p.playerId === selectedPlayerId) ?? null;
  const personalMessage = selectedPlayer ? buildDiscordPersonalMessage(selectedPlayer, assignments, zones) : "";

  async function copy(text: string, label: string) {
    const ok = await copyText(text);
    setCopyStatus(ok ? `${label} copied.` : `Couldn't access the clipboard — copy manually.`);
    window.setTimeout(() => setCopyStatus(null), 3000);
  }

  return (
    <div className="twc-discord">
      <section className="twc-panel">
        <header>
          <h3>Guild strategy message</h3>
          <label className="twc-toggle">
            <input type="checkbox" checked={detailed} onChange={(event) => setDetailed(event.target.checked)} />
            <span>Detailed (include officer notes)</span>
          </label>
        </header>
        <textarea readOnly rows={12} value={guildMessage} />
        <div className="twc-discord-actions">
          <button type="button" onClick={() => copy(guildMessage, "Guild message")}>Copy guild message</button>
          <button
            type="button"
            className="twc-primary-btn"
            disabled={busy}
            onClick={async () => {
              try {
                await onPostToDiscord(`Territory War Defence — ${planName}`, guildMessage);
                setPostStatus("Posted to Discord.");
              } catch {
                setPostStatus("Failed to post — check DISCORD_WEBHOOK_URL is configured.");
              }
              window.setTimeout(() => setPostStatus(null), 4000);
            }}
          >
            Post to Discord
          </button>
        </div>
        {copyStatus ? <p className="twc-muted">{copyStatus}</p> : null}
        {postStatus ? <p className="twc-muted">{postStatus}</p> : null}
      </section>

      <section className="twc-panel">
        <header><h3>Personal message</h3></header>
        <label>
          <span>Member</span>
          <select value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)}>
            <option value="">Select a joined member…</option>
            {joinedPool.map((p) => (
              <option key={p.playerId} value={p.playerId}>{p.name}</option>
            ))}
          </select>
        </label>
        <textarea readOnly rows={4} value={personalMessage} placeholder="Select a member to preview their message." />
        <div className="twc-discord-actions">
          <button type="button" disabled={!personalMessage} onClick={() => copy(personalMessage, "Personal message")}>
            Copy personal message
          </button>
        </div>
      </section>
    </div>
  );
}
