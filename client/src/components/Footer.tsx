import { FiCoffee } from "react-icons/fi";
import { Link } from "react-router-dom";
import { DONATE_URL } from "../lib/donate";
import { useLanguage } from "../lib/i18n";
import { IMPRINT_URL, PORTFOLIO_URL } from "../lib/privacy";

/** Schlichte Fußzeile mit Impressum (auf dem Portfolio) und Datenschutz. */
function Footer({ width }: { width: string }) {
  const { t } = useLanguage();
  const link = "transition hover:text-(--accent)";

  return (
    <footer className="border-t border-slate-200 dark:border-(--accent-soft)">
      <div
        className={`mx-auto flex ${width} flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-xs text-(--text-secondary) sm:px-6`}
      >
        <p>
          {t.footer.by}{" "}
          <a href={PORTFOLIO_URL} className={`font-semibold ${link}`}>
            Daniel Keller
          </a>
        </p>
        <nav aria-label={t.footer.legal} className="flex flex-wrap gap-x-4 gap-y-2">
          {DONATE_URL && (
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 font-semibold text-(--accent) ${link}`}
            >
              <FiCoffee aria-hidden="true" />
              {t.footer.donate}
            </a>
          )}
          <a href={IMPRINT_URL} className={link}>
            {t.footer.imprint}
          </a>
          <Link to="/privacy" className={link}>
            {t.footer.privacy}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
