"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Flips the `data-theme` attribute the token blocks in globals.css key off.
 * Until mounted it renders a neutral placeholder, so the server and client
 * markup agree and the icon never flashes the wrong way round.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("atlas-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("atlas-theme", theme);
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="border-line text-ink-muted hover:border-line-strong hover:text-ink rounded-control inline-flex size-9 items-center justify-center border transition-colors"
      aria-label={theme ? `Mudar para tema ${next === "dark" ? "escuro" : "claro"}` : "Mudar tema"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
