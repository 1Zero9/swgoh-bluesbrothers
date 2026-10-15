"use client";

import { useSyncExternalStore } from "react";

type Theme = "rebel" | "deep" | "dark";
const THEME_CHANGE_EVENT = "bb-theme-change";
const CHOICES: { theme: Theme; label: string; title: string }[] = [
  { theme: "rebel", label: "Rebel", title: "Rebel base: light" },
  { theme: "deep", label: "Deep", title: "Deep space: navy dark" },
  { theme: "dark", label: "Classic", title: "Classic dark: the original look" },
];

function getThemeSnapshot(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "rebel" || theme === "dark" ? theme : "deep";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { window.localStorage.setItem("bb-theme", theme); } catch { /* private mode: the choice lasts for this visit */ }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export default function ThemeToggle() {
  const activeTheme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "deep");

  return (
    <div className="theme-picker" role="group" aria-label="Colour theme">
      {CHOICES.map((choice) => (
        <button
          key={choice.theme}
          type="button"
          className="theme-choice"
          data-theme-choice={choice.theme}
          onClick={(event) => { event.stopPropagation(); setTheme(choice.theme); }}
          aria-pressed={activeTheme === choice.theme}
          title={choice.title}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
