"use client";

import { useEffect } from "react";

type ThemeMode = "dark" | "light";

const themeStorageKey = "skin-command-theme";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  const activeTheme = document.documentElement.dataset.theme;
  if (activeTheme === "light" || activeTheme === "dark") return activeTheme;
  return "dark";
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("theme-light", theme === "light");
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
  document.body.dataset.theme = theme;
  document.body.classList.toggle("light-mode", theme === "light");
  document.body.classList.toggle("dark-mode", theme === "dark");
}

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
}

export function setStoredTheme(theme: ThemeMode) {
  window.localStorage.setItem(themeStorageKey, theme);
  applyTheme(theme);
}

export function ThemeBoot() {
  useEffect(() => {
    const nextTheme = getStoredTheme();
    applyTheme(nextTheme);

    const handleThemeChange = (event: Event) => {
      const next = (event as CustomEvent<ThemeMode>).detail;
      if (next === "dark" || next === "light") {
        applyTheme(next);
      }
    };

    window.addEventListener("skin-command-theme-change", handleThemeChange);
    return () => window.removeEventListener("skin-command-theme-change", handleThemeChange);
  }, []);

  return null;
}
