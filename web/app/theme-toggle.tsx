"use client";

export default function ThemeToggle() {
  function setTheme(theme: "gradient" | "light" | "dark") {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("bb-theme", theme);
  }

  return (
    <div className="theme-picker" role="group" aria-label="Colour theme">
      <button type="button" data-theme-choice="gradient" onClick={() => setTheme("gradient")} aria-label="Use gradient theme" title="Gradient theme">◐</button>
      <button type="button" data-theme-choice="light" onClick={() => setTheme("light")} aria-label="Use light theme" title="Light theme">☀</button>
      <button type="button" data-theme-choice="dark" onClick={() => setTheme("dark")} aria-label="Use dark theme" title="Dark theme">☾</button>
    </div>
  );
}
