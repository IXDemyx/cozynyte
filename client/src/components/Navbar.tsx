import { FaMoon, FaSun } from "react-icons/fa";
import { LuLamp, LuMoonStar } from "react-icons/lu";
import { Link } from "react-router-dom";
import { nextPalette, type Palette, type Theme } from "../hooks/useTheme";
import { useLanguage } from "../lib/i18n";

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
          {/* Designs zum Ausprobieren: Klassisch → Cozy → Gemütlicher Abend → Klassisch … */}
          <button
            type="button"
            onClick={onTogglePalette}
            aria-pressed={palette !== "classic"}
            aria-label={t.nav.palette(
              t.nav.palettes[palette],
              t.nav.palettes[nextPalette(palette)],
            )}
            title={t.nav.palette(t.nav.palettes[palette], t.nav.palettes[nextPalette(palette)])}
            className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-(--surface) shadow-sm transition hover:border-(--accent) hover:text-(--accent) dark:bg-(--bg-secondary) dark:hover:border-(--accent) ${
              palette !== "classic"
                ? "border-(--accent-border) text-(--accent)"
                : "border-slate-200 text-slate-700 dark:border-(--accent-border) dark:text-(--text-secondary)"
            }`}
          >
            <LuLamp aria-hidden="true" />
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
