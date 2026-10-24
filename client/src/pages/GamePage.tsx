import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import {
  LuAudioWaveform,
  LuCalendarDays,
  LuDice5,
  LuEarth,
  LuHeadphones,
  LuHistory,
  LuNotebookPen,
  LuPalette,
  LuShuffle,
} from "react-icons/lu";
import { Link } from "react-router-dom";
import type { Game } from "../../../shared/types";
import Button from "../components/Button";
import ErrorText from "../components/ErrorText";
import LanguageHint from "../components/LanguageHint";
import Snippet from "../games/snippet/Snippet";
import { card, eyebrow, gameCard, input } from "../components/ui";
import { useOpenRooms } from "../hooks/useOpenRooms";
import { useStartRoom } from "../hooks/useStartRoom";
import { useLanguage } from "../lib/i18n";
import { GAME_SEO, type GamePageId } from "../lib/seo";
import { getName } from "../lib/socket";

/** Symbole wie auf den Kacheln der Startseite. */
const ICONS: Record<GamePageId, IconType> = {
  song: LuHeadphones,
  year: LuCalendarDays,
  timeline: LuHistory,
  slf: LuNotebookPen,
  kniffel: LuDice5,
  draw: LuPalette,
  geo: LuEarth,
  snippet: LuAudioWaveform,
};

/** Name eingeben, dann Raum erstellen oder einem zufälligen öffentlichen Raum beitreten. */
function RoomStart({ page }: { page: Game }) {
  const { t } = useLanguage();
  const [name, setName] = useState(getName);
  const { create, joinRandom, busy, error } = useStartRoom(name);
  const openCount = useOpenRooms()?.byGame[page] ?? 0;

  return (
    <div className={`${card} mt-6 p-5`}>
      <label htmlFor="name" className="text-sm font-semibold">
        {t.home.name}
      </label>
      <input
        id="name"
        className={`${input} mt-2`}
        value={name}
        maxLength={16}
        autoComplete="nickname"
        placeholder={t.home.namePlaceholder}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => create(page)} disabled={busy}>
          {t.home.createGame(t.games[page])}
        </Button>
        <Button variant="secondary" onClick={() => joinRandom(page)} disabled={busy}>
          <LuShuffle aria-hidden="true" /> {t.home.random}
          {openCount > 0 && ` · ${t.home.openShort(openCount)}`}
        </Button>
      </div>
      <ErrorText code={error} />
    </div>
  );
}

/**
 * Eigene Seite pro Spiel (für Suchmaschinen): Einstieg zum Sofort-Spielen, Regeln, Punkte und
 * FAQ. Texte aus src/lib/seo.ts – dieselben landen beim Build als Vorab-HTML in der Seite.
 * Song-Schnipsel (Einzelspieler) läuft ohne Raum direkt hier: Überschrift oben, darunter das Spiel
 * über die ganze Breite (statt der Beispielrunde daneben).
 */
function GamePage({ page }: { page: GamePageId }) {
  const { language, home } = useLanguage();
  const s = GAME_SEO[page][language];
  const Icon = ICONS[page];

  // Beim Wechsel aus der App heraus (z. B. von der Startseite) den Titel der Spielseite setzen.
  useEffect(() => {
    const previous = document.title;
    document.title = s.metaTitle;
    return () => {
      document.title = previous;
    };
  }, [s.metaTitle]);

  const accentAt = s.title.indexOf(s.titleAccent);
  const title =
    accentAt < 0 ? (
      s.title
    ) : (
      <>
        {s.title.slice(0, accentAt)}
        <span className="text-(--accent)">{s.titleAccent}</span>
        {s.title.slice(accentAt + s.titleAccent.length)}
      </>
    );

  return (
    <div className="animate-in space-y-12">
      <LanguageHint />

      <section className={`grid gap-8 ${page === "snippet" ? "" : "lg:grid-cols-[1.15fr_1fr]"}`}>
        <div>
          <nav className="flex items-center gap-2 text-sm text-(--text-secondary)">
            <Link to={home} className="transition hover:text-(--accent)">
              {s.breadcrumb}
            </Link>
            <span aria-hidden="true">›</span>
            <span>{s.name}</span>
          </nav>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p
            className={`mt-4 text-(--text-secondary) ${page === "snippet" ? "max-w-2xl" : "max-w-xl"}`}
          >
            {s.intro}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs text-(--text-secondary)">
            {s.facts.map((fact) => (
              <li
                key={fact}
                className="rounded-full border border-slate-200 px-3 py-1 dark:border-white/10"
              >
                {fact}
              </li>
            ))}
          </ul>

          {page !== "snippet" && <RoomStart page={page} />}
        </div>

        {page === "snippet" ? (
          <Snippet />
        ) : (
          /* Beispielrunde: zeigt auf einen Blick, wie das Spiel aussieht. */
          <figure className={`${gameCard} self-start p-5`}>
            <div className="flex items-center justify-between gap-4">
              <span
                className={`flex h-14 min-w-14 items-center justify-center rounded-xl bg-(--accent) px-2 font-extrabold text-(--on-accent) ${s.example.badge && s.example.badge.length > 2 ? "text-xl" : "text-3xl"}`}
              >
                {s.example.badge ?? <Icon aria-hidden="true" />}
              </span>
              <span className="text-right text-xs text-(--text-secondary)">
                <span className="block font-bold text-(--text-primary)">{s.example.title}</span>
                {s.example.round}
              </span>
            </div>
            <dl className="mt-4 divide-y divide-dashed divide-slate-200 text-sm dark:divide-white/10">
              {s.example.rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[6.5rem_1fr_auto] gap-3 py-2">
                  <dt className="text-xs font-semibold text-(--text-secondary)">{row.label}</dt>
                  <dd className="font-semibold">{row.value}</dd>
                  <dd
                    className={`font-mono text-xs ${row.points ? "text-(--success)" : "text-red-500"}`}
                  >
                    {row.points === undefined ? "" : row.points > 0 ? `+${row.points}` : 0}
                  </dd>
                </div>
              ))}
            </dl>
            <figcaption className="mt-3 text-xs text-(--text-secondary)">
              {s.example.note}
            </figcaption>
          </figure>
        )}
      </section>

      <section>
        <h2 className={eyebrow}>{s.howTitle}</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {s.steps.map((step, i) => (
            <li key={step.title} className={`${card} p-5`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--accent-soft) font-mono text-sm font-bold text-(--accent)">
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold">{step.title}</h3>
              <p className="mt-1 text-sm text-(--text-secondary)">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className={eyebrow}>{s.rulesTitle}</h2>
          <div className="mt-4 space-y-4">
            {s.rules.map((rule) => (
              <div key={rule.title}>
                <h3 className="text-sm font-bold">{rule.title}</h3>
                <p className="mt-1 text-sm text-(--text-secondary)">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className={eyebrow}>{s.scoreTitle}</h2>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-slate-200 dark:divide-(--accent-soft)">
              {s.scores.map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5 pr-4 text-(--text-secondary)">{row.label}</td>
                  <td className="py-2.5 text-right font-mono font-bold tabular-nums">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-10 dark:border-(--accent-soft)">
        <h2 className={eyebrow}>{s.faqTitle}</h2>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-(--accent-soft)">
          {s.faq.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold transition hover:text-(--accent) [&::-webkit-details-marker]:hidden">
                <h3>{item.q}</h3>
                <FiChevronDown
                  aria-hidden="true"
                  className="shrink-0 text-(--text-secondary) transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-2 text-sm text-(--text-secondary)">{item.a}</p>
            </details>
          ))}
        </div>
        <Link
          to={home}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-(--accent) transition hover:text-(--accent-hover)"
        >
          {s.allGames} <FiArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export default GamePage;
