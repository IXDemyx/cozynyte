import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
/**
 * Farbwelt: das bisherige Orange-Schwarz, „Cozy“ (Catppuccin) oder „Gemütlicher Abend“
 * (Kerzenlicht). Wird als Klasse am <html>-Element gesetzt (außer „classic“).
 */
export const PALETTES = ["classic", "cozy", "evening"] as const;
export type Palette = (typeof PALETTES)[number];

function getInitialPalette(): Palette {
  try {
    const saved = localStorage.getItem("palette");
    return PALETTES.find((p) => p === saved) ?? "classic";
  } catch {
    return "classic";
  }
}

/** Das Design, zu dem der Knopf als Nächstes wechselt. */
export const nextPalette = (palette: Palette): Palette =>
  PALETTES[(PALETTES.indexOf(palette) + 1) % PALETTES.length];

function getInitialTheme(): Theme {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [palette, setPalette] = useState<Palette>(getInitialPalette);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    for (const p of PALETTES)
      document.documentElement.classList.toggle(p, p === palette && p !== "classic");
    try {
      localStorage.setItem("palette", palette);
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
    }
  }, [palette]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const togglePalette = () => setPalette(nextPalette);

  return { theme, toggleTheme, palette, togglePalette };
}
