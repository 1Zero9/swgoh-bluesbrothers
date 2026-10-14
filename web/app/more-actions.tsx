"use client";

import { OPEN_INSTALL_EVENT } from "./install-prompt";
import { signOutEverywhere } from "./sign-out";
import ThemeToggle from "./theme-toggle";

/** The account controls that need the browser: install the app, pick a theme, sign out. */
export default function MoreActions({ discordUrl }: { discordUrl: string }) {
  return (
    <div className="hub-actions">
      <div className="hub-action-row">
        <span><strong>Theme</strong><small>Rebel is light, Deep is navy, Classic is the original dark.</small></span>
        <ThemeToggle />
      </div>
      <button type="button" className="hub-action" onClick={() => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT))}>
        <span><strong>Add to home screen</strong><small>Install the guild hub like an app</small></span>
      </button>
      <a className="hub-action" href={discordUrl} target="_blank" rel="noreferrer">
        <span><strong>Open Discord</strong><small>Where the band talks</small></span>
      </a>
      <button type="button" className="hub-action is-quiet" onClick={() => void signOutEverywhere()}>
        <strong>Sign out</strong>
      </button>
    </div>
  );
}
