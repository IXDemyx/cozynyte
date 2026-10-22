import { useEffect } from "react";
import { card } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { IMPRINT_URL, privacy } from "../lib/privacy";

/** Datenschutzerklärung der Spiele. Das Impressum liegt auf dem Portfolio. */
function Privacy() {
  const { language } = useLanguage();
  const text = privacy[language];

  // Eigener Tab-Titel; zurück auf der Startseite gilt wieder deren Titel.
  useEffect(() => {
    const previous = document.title;
    document.title = `${text.title} | Cozynyte`;
    return () => {
      document.title = previous;
    };
  }, [text.title]);

  return (
    <article className={`${card} animate-in mx-auto max-w-3xl p-7 sm:p-10`}>
      <h1 className="text-3xl font-extrabold tracking-tight">{text.title}</h1>
      <p className="mt-2 font-mono text-xs text-(--text-secondary)">{text.updated}</p>

      <div className="mt-8 space-y-8 leading-7 text-(--text-secondary)">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-(--text-primary)">
            {text.controller.title}
          </h2>
          <p>
            {text.controller.text}{" "}
            <a href={IMPRINT_URL} className="text-(--accent) underline-offset-2 hover:underline">
              {text.controller.link}
            </a>
            .
          </p>
        </section>

        {text.sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-lg font-semibold text-(--text-primary)">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

export default Privacy;
