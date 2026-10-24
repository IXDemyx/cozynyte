import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
/**
 * Farbwelt: „Cozy“ (Catppuccin-Blau, Standard), „Gemütlicher Abend“ (Kerzenlicht) oder das
 * ursprüngliche Orange-Schwarz. Wird als Klasse am <html>-Element gesetzt (außer „classic“).
 */
export const PALETTES = ["cozy", "evening", "classic"] as const;
export type Palette = (typeof PALETTES)[number];

/**
 * Speicherschlüssel der Wahl. Neuer Name seit Blau der Standard ist: So landen alle einmal beim
 * blauen Design (auch wer vorher durchprobiert hat) und können danach wieder frei wählen.
 * Muss zum Inline-Skript in index.html passen.
 */
const PALETTE_KEY = "design";

function getInitialPalette(): Palette {
  try {
    const saved = localStorage.getItem(PALETTE_KEY);
    return PALETTES.find((p) => p === saved) ?? "cozy";
  } catch {
    return "cozy";
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
      localStorage.setItem(PALETTE_KEY, palette);
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
    }
  }, [palette]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const togglePalette = () => setPalette(nextPalette);

  return { theme, toggleTheme, palette, togglePalette };
}
