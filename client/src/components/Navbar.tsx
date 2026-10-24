import { FaMoon, FaSun } from "react-icons/fa";
import { LuMoonStar } from "react-icons/lu";
import { Link } from "react-router-dom";
import { PALETTES, nextPalette, type Palette, type Theme } from "../hooks/useTheme";
import { useLanguage } from "../lib/i18n";

/**
 * Punkte im Design-Knopf: Akzentfarbe jedes Designs (hell/dunkel) und das Leuchten des aktiven
 * Punkts in derselben Farbe – wie kleine Planeten.
 */
const PALETTE_DOT: Record<Palette, { dot: string; glow: string }> = {
  cozy: {
    dot: "bg-[#1e66f5] dark:bg-[#89b4fa]",
    glow: "shadow-[0_0_6px_2px_rgba(30,102,245,0.6),0_0_16px_4px_rgba(30,102,245,0.3)] dark:shadow-[0_0_6px_2px_rgba(137,180,250,0.6),0_0_16px_4px_rgba(137,180,250,0.3)]",
  },
  evening: {
    dot: "bg-[#a8742c] dark:bg-[#e8c48c]",
    glow: "shadow-[0_0_6px_2px_rgba(168,116,44,0.6),0_0_16px_4px_rgba(168,116,44,0.3)] dark:shadow-[0_0_6px_2px_rgba(232,196,140,0.6),0_0_16px_4px_rgba(232,196,140,0.3)]",
  },
  classic: {
    dot: "bg-[#ea580c] dark:bg-[#f97316]",
    glow: "shadow-[0_0_6px_2px_rgba(234,88,12,0.6),0_0_16px_4px_rgba(234,88,12,0.3)] dark:shadow-[0_0_6px_2px_rgba(249,115,22,0.6),0_0_16px_4px_rgba(249,115,22,0.3)]",
  },
};

interface NavbarProps {
  theme: Theme;
  onToggleTheme: () => void;
  palette: Palette;
  onTogglePalette: () => void;
  /** Maximale Breite, passend zum Seiteninhalt (z. B. "max-w-5xl"). */
  width: string;
}

function Navbar({ theme, onToggleTheme, palette, onTogglePalette, width }: NavbarProps) {
  const { language, toggleLanguage, t, home } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-(--bg-primary)/75 backdrop-blur-md dark:border-(--accent)/15 dark:bg-(--bg-primary)/60">
      <div className={`mx-auto flex h-16 ${width} items-center justify-between px-4 sm:px-6`}>
        {/* Logo: kleiner Mond, „cozy“ in Textfarbe, „nyte“ in der Akzentfarbe. */}
        <Link
          to={home}
          aria-label="Cozynyte"
          className="flex items-center gap-1.5 text-xl font-bold tracking-tight"
        >
          <LuMoonStar aria-hidden="true" className="text-(--accent)" />
          <span>
            cozy<span className="text-(--accent)">nyte</span>
          </span>
        </Link>
        {/* Sprache und Design wie in der Navigation des Portfolios. */}
        <div className="flex items-center gap-2">
          {/* Design wechseln: drei Punkte in den Farben der Designs, der aktive größer und
              leuchtend. Ganz links mit eigenem Platz, ein feiner Strich trennt sie von Sprache und
              Hell/Dunkel. Reihenfolge Cozy → Gemütlicher Abend → Klassisch → Cozy … */}
          <button
            type="button"
            onClick={onTogglePalette}
            aria-label={t.nav.palette(
              t.nav.palettes[palette],
              t.nav.palettes[nextPalette(palette)],
            )}
            title={t.nav.palette(t.nav.palettes[palette], t.nav.palettes[nextPalette(palette)])}
            className="group flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-(--accent-border)"
          >
            {/* Ohne Rahmen – die Punkte wirken wie kleine Planeten; beim Drüberfahren rücken sie
                etwas auseinander. */}
            <span
              aria-hidden="true"
              className="flex items-center gap-1.5 transition-all group-hover:gap-2"
            >
              {PALETTES.map((p) => (
                <span
                  key={p}
                  className={`rounded-full transition-all ${PALETTE_DOT[p].dot} ${
                    p === palette
                      ? `h-2.5 w-2.5 ${PALETTE_DOT[p].glow}`
                      : "h-1.5 w-1.5 opacity-50 group-hover:opacity-80"
                  }`}
                />
              ))}
            </span>
          </button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200 dark:bg-white/10" />
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t.nav.switchLanguage}
            className="group flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 font-mono text-xs font-semibold"
          >
            {/* Beide Sprachen sichtbar, die aktive hervorgehoben; Klick wechselt zur anderen. */}
            {(["de", "en"] as const).map((lang, i) => (
              <span key={lang} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                <span
                  className={
                    lang === language
                      ? "text-(--accent)"
                      : "text-slate-400 transition group-hover:text-(--text-primary) dark:text-slate-500"
                  }
                >
                  {lang.toUpperCase()}
                </span>
              </span>
            ))}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? t.nav.light : t.nav.dark}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-(--surface) text-slate-700 shadow-sm transition hover:border-(--accent) hover:text-(--accent) dark:border-(--accent-border) dark:bg-(--bg-secondary) dark:text-(--text-secondary) dark:hover:border-(--accent)"
          >
            {theme === "dark" ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
