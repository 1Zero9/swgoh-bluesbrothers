"use client";

import { useState } from "react";
import Link from "next/link";
import { DISC_CATEGORIES, CURATED_DISCS } from "@/lib/discs";

type Props = {
  discordUrl: string;
  isOfficerConfigured: boolean;
  isMemberAuthConfigured: boolean;
  pendingDiscordUsername?: string;
  initialRole?: string;
  membershipState?: string;
  playerName?: string;
};

export default function CrewGate({
  discordUrl,
  isOfficerConfigured,
  isMemberAuthConfigured,
  pendingDiscordUsername,
  initialRole = "PUBLIC",
  membershipState,
  playerName,
}: Props) {
  const [activeTab, setActiveTab] = useState<"discord" | "ally-code" | "officer">(
    pendingDiscordUsername ? "ally-code" : "discord",
  );
  const [allyCode, setAllyCode] = useState("");
  const [officerPassword, setOfficerPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    membershipState === "LEFT"
      ? {
          type: "info",
          text: `Your account (${playerName || "Player"}) is currently listed as departed from the active in-game guild roster. If you have re-joined, please ask an officer to run a roster sync.`,
        }
      : pendingDiscordUsername
        ? {
            type: "info",
            text: `Signed in as Discord user "${pendingDiscordUsername}". Enter your 9-digit SWGOH Ally Code below to link your player profile.`,
          }
        : null,
  );

  // Mini Jukebox Teaser state
  const sampleTracks = CURATED_DISCS.slice(0, 3);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeTrack = sampleTracks[selectedTrackIndex];

  async function handleAllyCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allyCode.trim()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/members/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allyCode }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage({
          type: "success",
          text: `Welcome back to the gig, ${data.name}! Unlocking crew access...`,
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Could not verify ally code. Ensure you are an active guild member.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error connecting to the cantina gatekeeper.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOfficerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!officerPassword.trim()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/officer/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: officerPassword }),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Officer keycard accepted. Unlocking command deck...",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setMessage({
          type: "error",
          text: "Invalid officer password. Check your leadership credentials.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error validating officer keycard.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="crew-gate-container">
      {/* 1. Interactive Gatekeeper / Credential Terminal */}
      <section className="crew-terminal-card" aria-label="Cantina Entrance Gate">
        <div className="terminal-header">
          <div className="terminal-badge">
            <span className="bouncer-beacon" />
            <strong>CREW PASS TERMINAL</strong>
          </div>
          <p className="terminal-subtitle">
            Restricted Guild Access · Present credentials to enter the backstage command deck.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="terminal-tabs" role="tablist">
          <button
            type="button"
            className={`terminal-tab-btn${activeTab === "discord" ? " active" : ""}`}
            onClick={() => setActiveTab("discord")}
          >
            ◈ Discord Sign-In
          </button>
          <button
            type="button"
            className={`terminal-tab-btn${activeTab === "ally-code" ? " active" : ""}`}
            onClick={() => setActiveTab("ally-code")}
          >
            ⚡ SWGOH Ally Code
          </button>
          <button
            type="button"
            className={`terminal-tab-btn${activeTab === "officer" ? " active" : ""}`}
            onClick={() => setActiveTab("officer")}
          >
            🔑 Officer Keycard
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`terminal-alert alert-${message.type}`} role="status">
            <i>{message.type === "success" ? "✓" : message.type === "error" ? "⚠" : "ℹ"}</i>
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Discord Sign-In */}
        {activeTab === "discord" && (
          <div className="terminal-body">
            <p className="tab-instructions">
              Connect your Discord account. If you hold the verified Blues Brothers guild role, the doors will open immediately.
            </p>
            <div className="auth-action-box">
              <a href="/api/auth/discord" className="btn-discord-gate">
                <span>◈</span>
                <b>Enter with Discord OAuth</b>
              </a>
              <span className="auth-hint">
                No Discord account yet? <a href={discordUrl} target="_blank" rel="noreferrer">Join our public server →</a>
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: SWGOH Ally Code Link */}
        {activeTab === "ally-code" && (
          <form className="terminal-body" onSubmit={handleAllyCodeSubmit}>
            <p className="tab-instructions">
              Enter your 9-digit in-game SWGOH Ally Code (e.g. <code>123-456-789</code>). We will verify your active membership on the guild roster.
            </p>
            <div className="input-group-gate">
              <input
                type="text"
                className="gate-input"
                placeholder="123456789 or 123-456-789"
                value={allyCode}
                onChange={(e) => setAllyCode(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <button type="submit" className="btn-gate-submit" disabled={isLoading || !allyCode.trim()}>
                {isLoading ? "Verifying..." : "Verify Pass →"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Officer Keycard */}
        {activeTab === "officer" && (
          <form className="terminal-body" onSubmit={handleOfficerSubmit}>
            <p className="tab-instructions">
              Guild Leadership Access. Enter the shared officer master keycard password.
            </p>
            <div className="input-group-gate">
              <input
                type="password"
                className="gate-input"
                placeholder="Enter officer site password"
                value={officerPassword}
                onChange={(e) => setOfficerPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <button type="submit" className="btn-gate-submit" disabled={isLoading || !officerPassword.trim()}>
                {isLoading ? "Authenticating..." : "Unlock →"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. Public Teaser Sampler Deck ("Taste of the Cantina") */}
      <section className="public-teaser-deck" aria-label="Public Cantina Preview">
        <header className="teaser-heading">
          <p className="eyebrow">Public Access · The Blues Brothers Experience</p>
          <h2>While you wait for the doors to open...</h2>
          <p>Enjoy a sample of our galactic blues records, secret recipes, and guild history.</p>
        </header>

        <div className="teaser-grid">
          {/* Teaser 1: Dougie's Jukebox Sample */}
          <article className="teaser-card">
            <div className="teaser-card-head">
              <span className="teaser-icon">🎵</span>
              <div>
                <h3>Dougie&apos;s Discs Sampler</h3>
                <small>Spinning timeless Chicago blues classics</small>
              </div>
            </div>

            <div className="sample-track-player">
              <div className="sample-track-info">
                <strong>{activeTrack.title}</strong>
                <span>{activeTrack.artist} · {activeTrack.album} ({activeTrack.year})</span>
              </div>

              <div className="sample-track-nav">
                {sampleTracks.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn-sample-chip${idx === selectedTrackIndex ? " active" : ""}`}
                    onClick={() => {
                      setSelectedTrackIndex(idx);
                      setIsPlaying(true);
                    }}
                  >
                    #{idx + 1} {t.title.slice(0, 18)}...
                  </button>
                ))}
              </div>

              {isPlaying && activeTrack.youtubeId ? (
                <div className="sample-video-embed">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeTrack.youtubeId}?autoplay=1&rel=0`}
                    title={activeTrack.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-sample-play"
                  onClick={() => setIsPlaying(true)}
                >
                  ▶ Spin {activeTrack.title}
                </button>
              )}
            </div>
          </article>

          {/* Teaser 2: Soul Food Cantina Sample */}
          <article className="teaser-card">
            <div className="teaser-card-head">
              <span className="teaser-icon">🥘</span>
              <div>
                <h3>Soul Food Cafe Specials</h3>
                <small>Authentic Chicago fuel from the outer rim</small>
              </div>
            </div>

            <ul className="teaser-menu-list">
              <li>
                <strong>Jake&apos;s Four Whole Fried Chickens</strong>
                <p>Crispy golden outer crust, served with a side of pure rhythm and blues.</p>
              </li>
              <li>
                <strong>Elwood&apos;s Dry White Toast</strong>
                <p>Four slices of toasted white bread. Nothing on &apos;em. No butter, no jam.</p>
              </li>
              <li>
                <strong>Dougie&apos;s Slow-Smoked Chicago Ribs</strong>
                <p>Glazed with sweet corellian spice glaze and oak wood smoke.</p>
              </li>
            </ul>
          </article>

          {/* Teaser 3: Join the Band & Discord */}
          <article className="teaser-card teaser-card-discord">
            <div className="teaser-card-head">
              <span className="teaser-icon">💬</span>
              <div>
                <h3>Want to Join the Band?</h3>
                <small>The Blues Brothers SWGOH Guild</small>
              </div>
            </div>

            <div className="join-band-copy">
              <p>
                We are an active, friendly, competitive Star Wars: Galaxy of Heroes guild running regular Territory Wars, RotE Territory Battles, and Speeder / Naboo raids.
              </p>
              <div className="join-band-stats">
                <div><strong>480M+</strong><small>Guild GP</small></div>
                <div><strong>35+ ⭐</strong><small>RotE Stars</small></div>
                <div><strong>50/50</strong><small>Active Crew</small></div>
              </div>
              <a href={discordUrl} target="_blank" rel="noreferrer" className="btn-join-discord">
                <span>◈</span> Join Public Discord &amp; Apply
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
