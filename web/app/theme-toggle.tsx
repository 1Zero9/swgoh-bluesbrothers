"use client";

import { useSyncExternalStore } from "react";

type Theme = "gradient" | "light" | "dark";
const THEME_CHANGE_EVENT = "bb-theme-change";

function getThemeSnapshot(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "gradient" ? theme : "dark";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export default function ThemeToggle() {
  const activeTheme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "dark");

  function setTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("bb-theme", theme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <div className="theme-picker" role="group" aria-label="Colour theme">
      <button type="button" data-theme-choice="gradient" onClick={(event) => { event.stopPropagation(); setTheme("gradient"); }} aria-label="Use gradient theme" aria-pressed={activeTheme === "gradient"} title="Gradient theme">◐</button>
      <button type="button" data-theme-choice="light" onClick={(event) => { event.stopPropagation(); setTheme("light"); }} aria-label="Use light theme" aria-pressed={activeTheme === "light"} title="Light theme">☀</button>
      <button type="button" data-theme-choice="dark" onClick={(event) => { event.stopPropagation(); setTheme("dark"); }} aria-label="Use dark theme" aria-pressed={activeTheme === "dark"} title="Dark theme">☾</button>
    </div>
  );
}
