import { useEffect, useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import { FiChevronDown } from "react-icons/fi";
import {
  LuAudioWaveform,
  LuFlag,
  LuCalendarDays,
  LuDice5,
  LuEarth,
  LuHeadphones,
  LuHistory,
  LuMap,
  LuMoonStar,
  LuNotebookPen,
  LuPalette,
  LuRuler,
  LuShuffle,
} from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import ErrorText from "../components/ErrorText";
import LanguageHint from "../components/LanguageHint";
import { card, eyebrow, eyebrowBase, gameCard, input } from "../components/ui";
import { dailyStatus, prepareDaily, type DailyId, type DailyStatus } from "../games/dailyStatus";
import { useLanguage } from "../lib/i18n";
import { useOpenRooms } from "../hooks/useOpenRooms";
import { useStartRoom } from "../hooks/useStartRoom";
import { GAME_PATH, SEO, type GamePageId } from "../lib/seo";
import { confirmRoom, getName, saveName } from "../lib/socket";

/** Tagesrätsel (eigener Bereich, mit dem Stand von heute) – ohne Räume. */
const isDaily = (id: GamePageId): id is DailyId =>
  id === "snippet" || id === "flag" || id === "outline";

function Home() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState(getName);
  const [code, setCode] = useState("");
  const { joinRandom, busy, error, setError, validName } = useStartRoom(name);
  const open = useOpenRooms();
  // Stand der Tagesrätsel erst im Browser lesen – das vorgerenderte HTML kennt ihn nicht.
  const [daily, setDaily] = useState<Partial<Record<DailyId, DailyStatus>>>({});
  useEffect(() => {
    setDaily({
      snippet: dailyStatus("snippet"),
      flag: dailyStatus("flag"),
      outline: dailyStatus("outline"),
    });
  }, []);

  type Entry = { id: GamePageId; icon: IconType; meta: string; text: string; name?: string };
  /** `tone`: Farbe des Bereichs (theme.css, .tone-…). */
  const sections: { tone: string; title: string; text: string; games: Entry[] }[] = [
    {
      tone: "tone-daily",
      title: t.home.solo,
      text: t.home.soloText,
      games: [
        {
          id: "snippet",
          name: t.home.snippetDaily,
          icon: LuAudioWaveform,
          meta: t.home.soloMeta,
          text: t.home.snippetText,
        },
        { id: "flag", icon: LuFlag, meta: t.home.soloMeta, text: t.home.flagText },
        { id: "outline", icon: LuMap, meta: t.home.soloMeta, text: t.home.outlineText },
      ],
    },
    {
      tone: "tone-music",
      title: t.home.music,
      text: t.home.musicText,
      games: [
        { id: "song", icon: LuHeadphones, meta: t.home.meta, text: t.home.songText },
        { id: "year", icon: LuCalendarDays, meta: t.home.meta, text: t.home.yearText },
        { id: "timeline", icon: LuHistory, meta: t.home.meta, text: t.home.timelineText },
      ],
    },
    {
      tone: "tone-classics",
      title: t.home.classics,
      text: t.home.classicsText,
      games: [
        { id: "slf", icon: LuNotebookPen, meta: t.home.meta, text: t.home.slfText },
        { id: "kniffel", icon: LuDice5, meta: t.home.kniffelMeta, text: t.home.kniffelText },
        { id: "draw", icon: LuPalette, meta: t.home.meta, text: t.home.drawText },
      ],
    },
    {
      tone: "tone-quiz",
      title: t.home.quiz,
      text: t.home.quizText,
      games: [
        { id: "geo", icon: LuEarth, meta: t.home.meta, text: t.home.geoText },
        { id: "estimate", icon: LuRuler, meta: t.home.meta, text: t.home.estimateText },
      ],
    },
  ];
  const join = (event: FormEvent) => {
    event.preventDefault();
    if (!validName) return setError("name_required");
    if (code.length !== 4) return setError("code_length");
    saveName(name);
    confirmRoom(code);
    navigate(`/r/${code}`);
  };

  const seo = SEO[language];

  /** Stand von heute und Serie als Meta-Zeile einer Tageskachel. */
  const dailyMeta = (status: DailyStatus) =>
    [
      status.state === "won"
        ? t.home.dailyWon(status.tries, status.max)
        : status.state === "lost"
          ? t.home.dailyLost
          : status.state === "open"
            ? t.home.dailyOpen
            : t.home.dailyNew,
      status.streak > 0 && t.home.dailyStreak(status.streak),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="animate-in space-y-10">
      <LanguageHint />

      {/* Oben: Begrüßung links, „Raum beitreten“ rechts – die meisten kommen mit einem Code. */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
        <header>
          <p className="flex items-center gap-2 text-sm font-semibold text-(--accent)">
            <LuMoonStar aria-hidden="true" /> {t.home.tagline}
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            {t.home.heroLead} <span className="text-(--accent)">{t.home.heroAccent}</span>
          </h1>
          <p className="mt-4 max-w-xl text-(--text-secondary)">{seo.intro}</p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs text-(--text-secondary)">
            {t.home.perks.map((perk) => (
              <li
                key={perk}
                className="rounded-full border border-slate-200 px-3 py-1 dark:border-white/10"
              >
                {perk}
              </li>
            ))}
          </ul>
        </header>

        <section className={`${card} p-6`}>
          <h2 className="text-lg font-bold">{t.home.joinCardTitle}</h2>
          <p className="mt-1 text-sm text-(--text-secondary)">{t.home.joinCardText}</p>
          <div className="mt-5 space-y-4">
            <div>
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
            </div>
            <form onSubmit={join}>
              <label htmlFor="code" className="text-sm font-semibold">
                {t.home.joinTitle}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="code"
                  className={`${input} font-mono uppercase tracking-[0.3em]`}
                  value={code}
                  maxLength={4}
                  placeholder="CODE"
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                />
                <Button type="submit">{t.home.join}</Button>
              </div>
            </form>
            <div className="flex items-center gap-3 text-xs text-(--text-secondary)">
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              {t.home.or}
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>
            <div>
              <Button
                variant="secondary"
                onClick={() => joinRandom()}
                disabled={busy}
                className="w-full"
              >
                <LuShuffle aria-hidden="true" /> {t.home.random}
              </Button>
              {open && (
                <p className="mt-2 text-center text-xs text-(--text-secondary)">
                  {t.home.openRooms(open.total)}
                </p>
              )}
            </div>
          </div>
          <ErrorText code={error} />
        </section>
      </section>

      {/* Spiele: kompakte Kacheln, ein Klick führt zur Spielseite – dort wird der Raum erstellt. */}
      {sections.map((section) => (
        <section key={section.title} className={section.tone}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={`${eyebrowBase} flex items-center gap-2 text-(--tone)`}>
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-(--tone)" />
              {section.title}
            </h2>
            <p className="text-sm text-(--text-secondary)">{section.text}</p>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.games.map(({ id, icon: Icon, meta, text, name: title }) => {
              const status = isDaily(id) ? daily[id] : undefined;
              const openCount = isDaily(id) ? 0 : (open?.byGame[id] ?? 0);
              return (
                <Link
                  key={id}
                  to={GAME_PATH[id][language]}
                  onClick={() => {
                    // Name mitnehmen: Die Spielseite füllt ihn aus dem Speicher vor.
                    if (validName) saveName(name);
                    // Die Kachel heißt „Song des Tages“ – also nicht im Endlos-Modus öffnen.
                    if (isDaily(id)) prepareDaily(id);
                  }}
                  className={`${gameCard} flex min-w-0 items-center gap-3 p-4 sm:p-5`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--tone) text-xl text-(--on-accent)">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <h3 className="font-bold tracking-tight">{title ?? t.games[id]}</h3>
                    <span className="block text-xs text-(--text-secondary)">{text}</span>
                    <span
                      className={`mt-0.5 block font-mono text-[11px] ${status?.state === "won" ? "text-(--success)" : "text-(--tone)"}`}
                    >
                      {status ? dailyMeta(status) : meta}
                      {openCount > 0 && ` · ${t.home.openShort(openCount)}`}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {/* So funktioniert's und FAQ – vor allem für Neulinge (und Suchmaschinen). */}
      <section className="grid gap-10 border-t border-slate-200 pt-10 md:grid-cols-2 dark:border-(--accent-soft)">
        <div>
          <h2 className={eyebrow}>{seo.howTitle}</h2>
          <ol className="mt-4 space-y-4">
            {seo.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) font-mono text-sm font-bold text-(--accent)">
                  {i + 1}
                </span>
                <span className="pt-1 text-(--text-secondary)">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className={eyebrow}>{seo.faqTitle}</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-(--accent-soft)">
            {seo.faq.map((item) => (
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
        </div>
      </section>
    </div>
  );
}

export default Home;
