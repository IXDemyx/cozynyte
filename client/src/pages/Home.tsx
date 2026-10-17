import { useEffect, useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import {
  LuCalendarDays,
  LuDice5,
  LuEarth,
  LuHeadphones,
  LuHistory,
  LuMoonStar,
  LuNotebookPen,
  LuPalette,
  LuShuffle,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { PUBLIC_GAMES, type Ack, type Game, type OpenRooms } from "../../../shared/types";
import Button from "../components/Button";
import ErrorText from "../components/ErrorText";
import LanguageHint from "../components/LanguageHint";
import { card, eyebrow, gameCard, input } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { SEO } from "../lib/seo";
import { confirmRoom, getName, playerId, rememberPlayerId, saveName, socket } from "../lib/socket";

function Home() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState(getName);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<OpenRooms | null>(null);

  // Wie viele öffentliche Räume gerade Mitspieler suchen – regelmäßig nachfragen.
  useEffect(() => {
    const load = () =>
      socket.timeout(5000).emit("rooms:open", (failure: Error | null, res: Ack<OpenRooms>) => {
        if (!failure && res.ok) setOpen({ total: res.total, byGame: res.byGame });
      });
    load();
    const timer = setInterval(load, 15_000);
    socket.on("connect", load);
    return () => {
      clearInterval(timer);
      socket.off("connect", load);
    };
  }, []);

  type Entry = { id: Game; icon: IconType; meta: string; text: string };
  const sections: { title: string; text: string; games: Entry[] }[] = [
    {
      title: t.home.music,
      text: t.home.musicText,
      games: [
        { id: "song", icon: LuHeadphones, meta: t.home.meta, text: t.home.songText },
        { id: "year", icon: LuCalendarDays, meta: t.home.meta, text: t.home.yearText },
        { id: "timeline", icon: LuHistory, meta: t.home.meta, text: t.home.timelineText },
      ],
    },
    {
      title: t.home.classics,
      text: t.home.classicsText,
      games: [
        { id: "slf", icon: LuNotebookPen, meta: t.home.meta, text: t.home.slfText },
        { id: "kniffel", icon: LuDice5, meta: t.home.kniffelMeta, text: t.home.kniffelText },
        { id: "draw", icon: LuPalette, meta: t.home.meta, text: t.home.drawText },
      ],
    },
    {
      title: t.home.quiz,
      text: t.home.quizText,
      games: [{ id: "geo", icon: LuEarth, meta: t.home.meta, text: t.home.geoText }],
    },
  ];
  const validName = name.trim().length > 0;

  const create = (game: Game, isPublic = false) => {
    if (!validName) return setError("name_required");
    saveName(name);
    setBusy(true);
    setError("");
    socket
      .timeout(6000)
      .emit(
        "room:create",
        { name: name.trim(), playerId, game, isPublic, language },
        (failure: Error | null, res: Ack<{ code: string }>) => {
          setBusy(false);
          if (failure) return setError("server_unreachable");
          if (!res.ok) return setError(res.error);
          confirmRoom(res.code);
          rememberPlayerId(res.code, playerId);
          navigate(`/r/${res.code}`);
        },
      );
  };

  // Zufälliger Raum: offenen öffentlichen Raum suchen (optional für ein Spiel). Gibt es keinen,
  // wird ein neuer öffentlicher Raum erstellt, in den andere dann zufällig dazukommen.
  const joinRandom = (game?: Game) => {
    if (!validName) return setError("name_required");
    saveName(name);
    setBusy(true);
    setError("");
    socket
      .timeout(6000)
      .emit(
        "room:random",
        { game, language },
        (failure: Error | null, res: Ack<{ code: string | null }>) => {
          if (failure) {
            setBusy(false);
            return setError("server_unreachable");
          }
          if (res.ok && res.code) {
            setBusy(false);
            confirmRoom(res.code);
            return navigate(`/r/${res.code}`);
          }
          create(game ?? "song", true);
        },
      );
  };

  const join = (event: FormEvent) => {
    event.preventDefault();
    if (!validName) return setError("name_required");
    if (code.length !== 4) return setError("code_length");
    saveName(name);
    confirmRoom(code);
    navigate(`/r/${code}`);
  };

  const seo = SEO[language];

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

      {/* Spiele: kompakte Kacheln, ein Klick erstellt den Raum. */}
      {sections.map((section) => (
        <section key={section.title}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={eyebrow}>{section.title}</h2>
            <p className="text-sm text-(--text-secondary)">{section.text}</p>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.games.map(({ id, icon: Icon, meta, text }) => {
              const openCount = open?.byGame[id] ?? 0;
              return (
                // Kachel = Raum erstellen; rechts daneben (außer Kniffel) „zufälliger Raum“.
                <div key={id} className={`${gameCard} flex items-stretch`}>
                  <button
                    type="button"
                    onClick={() => create(id)}
                    disabled={busy}
                    aria-label={t.home.createGame(t.games[id])}
                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-4 text-left disabled:opacity-60 sm:p-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--accent) text-xl text-(--on-accent)">
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <h3 className="font-bold tracking-tight">{t.games[id]}</h3>
                      <span className="block text-xs text-(--text-secondary)">{text}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-(--accent)">
                        {meta}
                        {openCount > 0 && ` · ${t.home.openShort(openCount)}`}
                      </span>
                    </span>
                    <FiArrowRight
                      aria-hidden="true"
                      className="shrink-0 text-(--text-secondary) transition group-hover:translate-x-0.5 group-hover:text-(--accent)"
                    />
                  </button>
                  {PUBLIC_GAMES.includes(id) && (
                    <button
                      type="button"
                      onClick={() => joinRandom(id)}
                      disabled={busy}
                      aria-label={t.home.randomGame(t.games[id])}
                      title={t.home.randomGame(t.games[id])}
                      className="flex w-12 shrink-0 items-center justify-center rounded-r-2xl border-l border-slate-200 text-lg text-(--text-secondary) transition hover:bg-(--accent-soft) hover:text-(--accent) disabled:opacity-60 dark:border-white/10"
                    >
                      <LuShuffle aria-hidden="true" />
                    </button>
                  )}
                </div>
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
