import { FiMoon, FiSun } from "react-icons/fi";
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
  const control =
    "flex h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 px-2.5 text-(--text-secondary) transition hover:border-(--accent) hover:text-(--accent) dark:border-slate-700";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-(--bg-primary)/85 backdrop-blur dark:border-(--accent-soft)">
      <div className={`mx-auto flex h-16 ${width} items-center justify-between px-4 sm:px-6`}>
        <Link to="/" className="font-mono text-lg font-semibold tracking-tight">
          <span className="text-(--accent)">&lt;/</span>
          games
          <span className="text-(--accent)">&gt;</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t.nav.switchLanguage}
            className={`${control} font-mono text-xs font-semibold`}
          >
            {language === "de" ? "EN" : "DE"}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? t.nav.light : t.nav.dark}
            className={control}
          >
            {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
