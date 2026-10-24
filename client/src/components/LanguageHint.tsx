import { useState } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { browserLanguage, useLanguage } from "../lib/i18n";
import { SEO, pageOfPath, pathOf } from "../lib/seo";

const DISMISSED_KEY = "languageHintDismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Start- oder Spielseite in der „falschen“ Sprache für diesen Browser (etwa über Google auf der deutschen
 * Seite gelandet, Browser aber englisch): dezenter Hinweis auf die andere Version. Bewusst keine
 * automatische Umleitung – sonst bekäme z. B. Google eine der beiden Seiten nie zu sehen.
 */
function LanguageHint() {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(readDismissed);
  const other = browserLanguage();
  if (dismissed || other === language) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Dann eben nur bis zum Neuladen ausgeblendet.
    }
  };

  return (
    <div
      lang={other}
      className="animate-in flex items-center gap-3 rounded-xl border border-(--accent-border) bg-(--accent-soft) px-4 py-2.5 text-sm"
    >
      <Link
        to={pathOf(pageOfPath(pathname)?.page ?? "home", other)}
        className="flex flex-1 items-center gap-2 font-semibold text-(--accent) transition hover:text-(--accent-hover)"
      >
        {SEO[other].otherLanguage}
        <FiArrowRight aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label={other === "de" ? "Hinweis schließen" : "Close"}
        className="shrink-0 rounded-md p-1 text-(--text-secondary) transition hover:text-(--text-primary)"
      >
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

export default LanguageHint;
