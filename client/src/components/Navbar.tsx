import { FaMoon, FaSun } from "react-icons/fa";
import { Link } from "react-router-dom";
import type { Theme } from "../hooks/useTheme";
import { useLanguage } from "../lib/i18n";

interface NavbarProps {
  theme: Theme;
  onToggleTheme: () => void;
  /** Maximale Breite, passend zum Seiteninhalt (z. B. "max-w-5xl"). */
  width: string;
}

function Navbar({ theme, onToggleTheme, width }: NavbarProps) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-(--accent-border) dark:bg-(--bg-primary)/90">
      <div className={`mx-auto flex h-16 ${width} items-center justify-between px-4 sm:px-6`}>
        <Link to="/" className="font-mono text-lg font-semibold tracking-tight">
          <span className="text-(--accent)">&lt;/</span>
          games
          <span className="text-(--accent)">&gt;</span>
        </Link>
        {/* Sprache und Design wie in der Navigation des Portfolios. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t.nav.switchLanguage}
            className="flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg px-2 font-mono text-xs font-semibold text-slate-500 transition hover:text-(--accent) dark:text-(--text-secondary)"
          >
            {language === "de" ? "EN" : "DE"}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? t.nav.light : t.nav.dark}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-(--accent) hover:text-(--accent) dark:border-(--accent-border) dark:bg-(--bg-secondary) dark:text-(--text-secondary) dark:hover:border-(--accent)"
          >
            {theme === "dark" ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
