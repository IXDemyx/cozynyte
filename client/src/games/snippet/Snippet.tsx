import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  FiCalendar,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiSquare,
} from "react-icons/fi";
import {
  SNIPPET_STAGES,
  dailyDate,
  dailyDateOf,
  snippetPoints,
  type SnippetAttempt,
  type SnippetGlobal,
  type SnippetResult,
  type SnippetSolution,
  type SnippetTrack,
  type SnippetTurn,
} from "../../../../shared/snippet";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import { ArchiveList, berlinZone, Countdown, GlobalResult } from "../../components/DailyParts";
import NextDaily from "../../components/NextDaily";
import VolumeControl from "../../components/VolumeControl";
import { card, eyebrow, input } from "../../components/ui";
import { dayResults } from "../dailyStatus";
import { useLanguage } from "../../lib/i18n";
import { GAME_PATH } from "../../lib/seo";
import { playEffect } from "../../lib/sounds";
import {
  audioUrl,
  dailySnippet,
  guessSnippet,
  newSnippet,
  searchSnippet,
  skipSnippet,
} from "./api";
import {
  dailyStreak,
  emptyRun,
  loadDailyStats,
  loadDays,
  loadStats,
  recordDaily,
  recordResult,
  saveDay,
  type DailyProgress,
  type DailyStats,
  type RunChange,
  type SnippetStats,
} from "./stats";
import { useClip } from "./useClip";

/** Kategorien wie bei den Songvorschlägen der Musikspiele (server/src/music/suggestions.ts). */
const CATEGORIES = [
  "surprise",
  "current",
  "pop",
  "rock",
  "hiphop",
  "german",
  "80s",
  "90s",
  "2000s",
  "electronic",
];

const LAST = SNIPPET_STAGES.length - 1;

/** Farben der Versuche: übersprungen grau, falsch rot, Interpret stimmt gelb, richtig grün. */
const ROW: Record<SnippetResult, string> = {
  skip: "bg-slate-100 text-(--text-secondary) dark:bg-white/5",
  wrong: "bg-red-500/10 text-(--text-primary)",
  artist: "bg-amber-500/15 text-(--text-primary)",
  right: "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-(--text-primary)",
};
const TAG: Record<SnippetResult, string> = {
  skip: "",
  wrong: "text-red-600 dark:text-red-400",
  artist: "text-amber-700 dark:text-amber-300",
  right: "text-(--success)",
};
const BOX: Record<SnippetResult, string> = { skip: "⬜", wrong: "🟥", artist: "🟨", right: "🟩" };

type Mode = "daily" | "endless";

/** Endlos-Modus anbieten? Vorerst aus – dann gibt es nur den Song des Tages (Code bleibt drin). */
const ENDLESS = false;

/** Zuletzt gewählter Modus; beim ersten Besuch der Song des Tages. */
function savedMode(): Mode {
  if (!ENDLESS) return "daily";
  try {
    return localStorage.getItem("snippetMode") === "endless" ? "endless" : "daily";
  } catch {
    return "daily";
  }
}

function savedCategory(): string {
  try {
    const saved = localStorage.getItem("snippetCategory");
    return saved && CATEGORIES.includes(saved) ? saved : "surprise";
  } catch {
    return "surprise";
  }
}

/** Füllt die Stufe, solange der Ausschnitt läuft. */
function StageFill({ playing }: { playing: { length: number; at: number } | null }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    if (!playing) {
      el.style.width = "0%";
      return;
    }
    let frame = 0;
    const step = () => {
      const progress = Math.min(
        1,
        Math.max(0, (performance.now() - playing.at) / (playing.length * 1000)),
      );
      el.style.width = `${progress * 100}%`;
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  return <div ref={bar} className="absolute inset-y-0 left-0 w-0 bg-(--accent)" />;
}

/**
 * Song-Schnipsel: Song des Tages (für alle gleich, einmal am Tag) oder endlos zufällige Songs.
 * Ein Song, erst 0,1 s, nach jedem Fehlversuch oder
 * Überspringen mehr (der längere Ausschnitt spielt dann gleich). Raten nur über die Suche.
 * Endlos: Punkte je nach Stufe, Serie und Rekord pro Kategorie. Song des Tages: Serie in Tagen,
 * der Stand bleibt im Browser, damit Neuladen nichts verliert. Ohne Raum – läuft direkt auf der
 * Spielseite. Am PC zwei Spalten: links die Versuche, rechts Abspielen und Suche.
 *
 * Tastatur: Leertaste spielt ab (im Suchfeld, solange es leer ist), Enter rät bzw. holt nach der
 * Auflösung den nächsten Song, Tab im leeren Suchfeld überspringt.
 */
function Snippet() {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<Mode>(savedMode);
  const [category, setCategory] = useState(savedCategory);
  const [round, setRound] = useState<{ id: string; number: number; category: string } | null>(null);
  /** Song des Tages: Tag, laufende Nummer und wann der nächste kommt. */
  const [daily, setDaily] = useState<{
    date: string;
    number: number;
    today: number;
    nextAt: number;
  } | null>(null);
  /** Song des Tages: Ergebnisse aller an diesem Tag (sobald die Runde vorbei ist). */
  const [global, setGlobal] = useState<SnippetGlobal | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats>(loadDailyStats);
  const [attempts, setAttempts] = useState<SnippetAttempt[]>([]);
  const [solution, setSolution] = useState<SnippetSolution | null>(null);
  const [stats, setStats] = useState<SnippetStats>(loadStats);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SnippetTrack[]>([]);
  const [selected, setSelected] = useState<SnippetTrack | null>(null);
  const [active, setActive] = useState(-1);
  const [listOpen, setListOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ points: number; change: RunChange } | null>(null);
  const songs = useRef(0);
  const started = useRef(false);
  /** Zählt Ladevorgänge – Antworten auf einen überholten (Moduswechsel) werden verworfen. */
  const loads = useRef(0);
  const field = useRef<HTMLInputElement>(null);
  const clip = useClip(round ? audioUrl(round.id) : null);

  const sec = (s: number) => `${s.toLocaleString(language)} s`;
  const stage = Math.min(attempts.length, LAST);
  const done = solution !== null;
  const run = stats.runs[round?.category ?? category] ?? emptyRun();
  const worth = snippetPoints(stage);
  const categoryName = (key: string) => t.picking.categories[key] ?? key;
  /** „28. Okt.“ bzw. „28 Oct“ für einen Tag. */
  const dayLabel = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString(language, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  const reset = () => {
    setError("");
    setAttempts([]);
    setSolution(null);
    setRound(null);
    setTerm("");
    setSelected(null);
    setResults([]);
    setResult(null);
    return ++loads.current;
  };

  /** Endlos: neuer zufälliger Song aus der Kategorie. */
  const start = async (from: string) => {
    const load = reset();
    const res = await newSnippet(from, loadStats().recent);
    if (load !== loads.current) return;
    if (!res.ok) return setError(res.error);
    songs.current += 1;
    setRound({ id: res.id, number: songs.current, category: from });
  };

  /**
   * Song des Tages – heute oder (`number`) ein früherer Tag aus dem Archiv, mit dem Stand aus dem
   * Browser, falls schon angefangen.
   */
  const startDaily = async (number?: number): Promise<void> => {
    const load = reset();
    setGlobal(null);
    setArchiveOpen(false);
    const date = number ? dailyDateOf(number) : dailyDate();
    const saved = loadDays()[date];
    const res = await dailySnippet(
      number ?? null,
      date,
      saved?.attempts.length ?? 0,
      Boolean(saved?.solution),
    );
    if (load !== loads.current) return;
    if (!res.ok) return setError(res.error);
    // Geht die Uhr im Browser falsch, meint der Server einen anderen Tag – dann dessen Stand laden.
    const mine = res.date === date ? saved : loadDays()[res.date];
    if (res.date !== date && mine?.attempts.length) return startDaily(res.number);
    const progress: DailyProgress = mine
      ? { ...mine, number: res.number, solution: res.solution ?? mine.solution }
      : { date: res.date, number: res.number, attempts: [], solution: null };
    setDaily({
      date: res.date,
      number: res.number,
      today: res.today,
      nextAt: Date.now() + res.nextIn,
    });
    setGlobal(res.global ?? null);
    setAttempts(progress.attempts);
    setSolution(progress.solution);
    setRound({ id: res.id, number: res.number, category: "" });
  };

  const load = (next: Mode) => (next === "daily" ? startDaily() : start(category));
  /** Song des Tages aus dem Archiv (früherer Tag) – zählt nicht für Tagesserie und Vergleich. */
  const archive = mode === "daily" && daily !== null && daily.number < daily.today;

  // Endlos ab dem zweiten Song gleich ins Suchfeld – mit der Tastatur geht es so ohne Maus weiter.
  useEffect(() => {
    if (round?.category && round.number > 1) field.current?.focus();
  }, [round]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void load(mode);
    // Nur beim ersten Öffnen; danach startet „Nächster Song“ bzw. der Moduswechsel.
  }, []);

  const chooseMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    try {
      localStorage.setItem("snippetMode", next);
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
    }
    clip.stop();
    void load(next);
  };

  // Suche mit kurzer Verzögerung, damit nicht jeder Tastendruck eine Anfrage auslöst.
  useEffect(() => {
    const query = term.trim();
    if (selected || query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await searchSnippet(query);
      if (cancelled) return;
      if (!res.ok) return setError(res.error);
      setError("");
      // Schon geratene Songs nicht noch einmal anbieten.
      const guessed = new Set(attempts.map((a) => a.guess?.id));
      setResults(res.tracks.filter((track) => !guessed.has(track.id)).slice(0, 8));
      setActive(-1);
      setListOpen(true);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [term, selected, attempts]);

  const chooseCategory = (next: string) => {
    setCategory(next);
    try {
      localStorage.setItem("snippetCategory", next);
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
    }
    // Noch nicht angefangen: gleich einen Song aus der neuen Kategorie holen.
    if (!attempts.length && !done) void start(next);
  };

  const apply = (res: Awaited<ReturnType<typeof skipSnippet>>) => {
    if (!res.ok) return setError(res.error);
    const turn: SnippetTurn = res;
    setError("");
    const next = [...attempts, turn.attempt];
    setAttempts(next);
    if (mode === "daily" && daily) {
      saveDay({
        date: daily.date,
        number: daily.number,
        attempts: next,
        solution: turn.solution ?? null,
      });
    }
    setTerm("");
    setSelected(null);
    setResults([]);
    if (turn.done && turn.solution) {
      clip.stop();
      const won = turn.attempt.result === "right";
      setSolution(turn.solution);
      playEffect(won ? "correct" : "miss");
      if (mode === "daily") {
        setGlobal(turn.global ?? null);
        if (daily && !archive) setDailyStats(recordDaily(daily.date, won ? next.length - 1 : null));
        return;
      }
      const points = won ? snippetPoints(next.length - 1) : 0;
      const recorded = recordResult(
        turn.solution.id,
        round?.category ?? category,
        won ? next.length - 1 : null,
        points,
      );
      setStats(recorded.stats);
      setResult({ points, change: recorded.change });
    } else {
      // Gleich den längeren Ausschnitt spielen – nach einem Fehlversuch erst nach dem Ton.
      const length = SNIPPET_STAGES[Math.min(next.length, LAST)];
      if (turn.attempt.result === "skip") clip.play(length);
      else {
        playEffect("miss");
        setTimeout(() => clip.play(length), 400);
      }
      field.current?.focus();
    }
  };

  /** Abspielen bzw. anhalten: im Spiel die aktuelle Stufe, nach der Auflösung die ganze Hörprobe. */
  const togglePlay = () => {
    if (clip.status !== "ready") return;
    if (clip.playing) clip.stop();
    else clip.play(done ? undefined : SNIPPET_STAGES[stage]);
  };

  const guess = async () => {
    if (!round || !selected || busy) return;
    setBusy(true);
    apply(await guessSnippet(round.id, selected.id));
    setBusy(false);
  };

  const skip = async () => {
    if (!round || busy) return;
    setBusy(true);
    apply(await skipSnippet(round.id));
    setBusy(false);
  };

  const pick = (track: SnippetTrack) => {
    setSelected(track);
    setTerm(`${track.title} – ${track.artist}`);
    setListOpen(false);
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setListOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (selected) void guess();
      else if (listOpen && results.length) pick(results[Math.max(0, active)]);
    } else if (event.key === "Escape") {
      setListOpen(false);
    } else if (event.key === " " && !term) {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "Tab" && !event.shiftKey && !term && round && !busy) {
      event.preventDefault();
      void skip();
    }
  };

  // Tastenkürzel außerhalb des Suchfelds. Knöpfe und Felder reagieren selbst auf Leertaste/Enter.
  const shortcut = useRef<(event: globalThis.KeyboardEvent) => void>(() => {});
  shortcut.current = (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, button, a, [contenteditable]")) return;
    if (event.key === " ") {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "Enter" && done && mode === "endless") {
      event.preventDefault();
      void start(category);
    }
  };
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => shortcut.current(event);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const won = attempts.at(-1)?.result === "right";
  const shareText = [
    `Cozynyte · ${mode === "daily" && daily ? t.snippet.shareDaily(daily.number) : t.games.snippet} · ${won ? attempts.length : "X"}/${SNIPPET_STAGES.length}` +
      (won && result ? ` · ${t.snippet.points(result.points)}` : ""),
    `🔊${SNIPPET_STAGES.map((_, i) => (attempts[i] ? BOX[attempts[i].result] : "⬛")).join("")}`,
    ...(won && mode === "endless" && run.streak > 1
      ? [t.snippet.shareRun(run.streak, categoryName(round?.category ?? category))]
      : []),
    `https://cozynyte.com${GAME_PATH.snippet[language]}`,
  ].join("\n");

  /** Meldung zur Serie in der Auflösung (neuer Rekord oder Serie gerissen). */
  const change = result?.change;
  const runNote = !change
    ? ""
    : won
      ? change.newBest && change.before.best > 0
        ? t.snippet.newRecord(change.after.best)
        : change.newBestPoints && change.before.bestPoints > 0
          ? t.snippet.newPointsRecord(change.after.bestPoints)
          : ""
      : change.before.streak > 0
        ? t.snippet.streakEnded(change.before.streak, change.before.points)
        : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ohne Zwischenablage bleibt der Text zum Markieren stehen.
    }
  };

  /** Statistik in der Auflösung: Endlos über alles (Serie je Kategorie), sonst die des Tagessongs. */
  const view =
    mode === "daily"
      ? {
          played: dailyStats.played,
          won: dailyStats.won,
          byStage: dailyStats.byStage,
          streak: dailyStreak(dailyStats, daily ? dailyDateOf(daily.today) : ""),
          best: dailyStats.best,
        }
      : { ...stats, streak: run.streak, best: run.best };
  const best = Math.max(1, ...view.byStage, view.played - view.won);

  return (
    <section className={`${card} min-w-0 p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-4">
        {!ENDLESS && <p className={eyebrow}>{t.snippet.modeDaily}</p>}
        {ENDLESS && (
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold dark:bg-white/5">
            {(["daily", "endless"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={key === mode}
                onClick={() => chooseMode(key)}
                className={`rounded-md px-3 py-1.5 transition ${
                  key === mode
                    ? "bg-(--surface) text-(--accent) shadow-sm"
                    : "text-(--text-secondary) hover:text-(--accent)"
                }`}
              >
                {key === "daily" ? t.snippet.modeDaily : t.snippet.modeEndless}
              </button>
            ))}
          </div>
        )}
        <VolumeControl />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        {mode === "daily" ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--text-secondary)">
            <p>
              {daily && (
                <span className="font-mono font-bold text-(--accent)">#{daily.number}</span>
              )}{" "}
              {archive && daily
                ? t.snippet.archiveDay(dayLabel(daily.date))
                : t.snippet.dailyInfo(berlinZone(language))}
            </p>
            {daily && (
              <button
                type="button"
                aria-expanded={archiveOpen}
                onClick={() => setArchiveOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 font-semibold text-(--accent) transition hover:text-(--accent-hover)"
              >
                <FiCalendar aria-hidden="true" /> {t.snippet.archive}
              </button>
            )}
            {archive && (
              <button
                type="button"
                onClick={() => void startDaily()}
                className="font-semibold text-(--accent) transition hover:text-(--accent-hover)"
              >
                {t.snippet.backToday}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-(--text-secondary)">{t.snippet.from}</span>
            {CATEGORIES.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={key === category}
                onClick={() => chooseCategory(key)}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition ${
                  key === category
                    ? "border-(--accent) bg-(--accent-soft) font-semibold text-(--accent)"
                    : "border-slate-300 text-(--text-secondary) hover:border-(--accent) hover:text-(--accent) dark:border-slate-700"
                }`}
              >
                {t.picking.categories[key]}
              </button>
            ))}
          </div>
        )}

        {/* Serie und Rekord (Tage bzw. gewählte Kategorie) – die Zahl springt bei jedem Treffer kurz. */}
        {mode === "daily" ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg bg-(--accent-soft) px-3 py-2 text-sm lg:min-w-64">
            <span>
              <span className="text-(--text-secondary)">{t.snippet.dailyStreak}</span>{" "}
              <span
                key={view.streak}
                className="animate-pop inline-block font-bold tabular-nums text-(--accent)"
              >
                {view.streak}
              </span>
            </span>
            <span className="text-xs text-(--text-secondary)">
              {t.snippet.dailyRecord(dailyStats.best)}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg bg-(--accent-soft) px-3 py-2 text-sm lg:min-w-64">
            <span>
              <span className="text-(--text-secondary)">{t.snippet.streak}</span>{" "}
              <span
                key={`${run.streak}-${run.points}`}
                className="animate-pop inline-block font-bold tabular-nums text-(--accent)"
              >
                {run.streak}
              </span>
              <span className="text-(--text-secondary)"> · {t.snippet.points(run.points)}</span>
            </span>
            <span className="text-xs text-(--text-secondary)">
              {t.snippet.record(run.best, run.bestPoints)}
            </span>
          </div>
        )}
      </div>

      {mode === "daily" && daily && archiveOpen && (
        <ArchiveList
          today={daily.today}
          current={daily.number}
          max={SNIPPET_STAGES.length}
          dateOf={dailyDateOf}
          result={dayResults("snippet")}
          dayLabel={dayLabel}
          text={t.snippet}
          onPick={(number) => void startDaily(number)}
        />
      )}

      {!done ? (
        <div className="mt-5 grid gap-5 lg:mt-6 lg:grid-cols-2 lg:gap-8">
          <ol className="grid content-start gap-1.5">
            {SNIPPET_STAGES.map((length, i) => {
              const attempt = attempts[i];
              const current = i === stage && !attempt;
              return (
                <li
                  key={length}
                  className={`grid min-h-10 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-1.5 text-sm ${
                    attempt
                      ? `border-transparent ${ROW[attempt.result]}`
                      : current
                        ? "border-(--accent-border) bg-(--accent-soft)"
                        : "border-transparent bg-slate-100 dark:bg-white/5"
                  }`}
                >
                  <span className="font-mono text-xs tabular-nums text-(--text-secondary)">
                    {sec(length)}
                  </span>
                  <span className={`truncate ${attempt?.result === "skip" ? "italic" : ""}`}>
                    {attempt &&
                      (attempt.guess
                        ? `${attempt.guess.title} – ${attempt.guess.artist}`
                        : t.snippet.skipped)}
                  </span>
                  <span className={`text-xs font-bold ${attempt ? TAG[attempt.result] : ""}`}>
                    {attempt && attempt.result !== "skip" && t.snippet.results[attempt.result]}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="min-w-0 space-y-5">
            <div>
              {/* Alle Stufen gleich breit – maßstabsgetreu wären 0,1 s neben 12 s unsichtbar. */}
              <div className="grid grid-cols-7 gap-1">
                {SNIPPET_STAGES.map((length, i) => (
                  <div
                    key={length}
                    className={`relative h-2.5 overflow-hidden rounded ${i <= stage ? "bg-(--accent-border)" : "bg-slate-200 dark:bg-white/10"}`}
                  >
                    {i === stage && <StageFill playing={clip.playing} />}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-center font-mono text-[10px] tabular-nums text-(--text-secondary)">
                {SNIPPET_STAGES.map((length, i) => (
                  <span key={length} className={i === stage ? "font-bold text-(--accent)" : ""}>
                    {length.toLocaleString(language)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={clip.status !== "ready"}
                onClick={() => (clip.playing ? clip.stop() : clip.play(SNIPPET_STAGES[stage]))}
                aria-label={
                  clip.playing ? t.snippet.stop : t.snippet.play(sec(SNIPPET_STAGES[stage]))
                }
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-(--accent) text-xl text-(--on-accent) shadow-[3px_3px_0_var(--press),0_8px_26px_-6px_var(--button-glow)] transition enabled:hover:bg-(--accent-hover) enabled:active:translate-x-[3px] enabled:active:translate-y-[3px] enabled:active:shadow-none disabled:opacity-40"
              >
                {clip.playing ? (
                  <FiSquare aria-hidden="true" />
                ) : (
                  <FiPlay aria-hidden="true" className="translate-x-0.5" />
                )}
              </button>
              <div className="min-w-0">
                <p className="font-bold">
                  {clip.status === "loading" || !round
                    ? t.snippet.loading
                    : clip.status === "error"
                      ? t.snippet.audioError
                      : t.snippet.play(sec(SNIPPET_STAGES[stage]))}
                </p>
                <p className="text-sm text-(--text-secondary)">
                  {t.snippet.attempt(stage + 1, SNIPPET_STAGES.length)}
                  {mode === "endless" && ` · ${t.snippet.worth(worth)}`}
                </p>
              </div>
            </div>

            <div className="relative">
              <FiSearch
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)"
                aria-hidden="true"
              />
              <input
                ref={field}
                role="combobox"
                aria-expanded={listOpen && results.length > 0}
                aria-controls="snippet-results"
                aria-label={t.snippet.search}
                autoComplete="off"
                className={`${input} pl-11`}
                value={term}
                placeholder={t.picking.searchPlaceholder}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setSelected(null);
                }}
                onKeyDown={onKey}
                onFocus={() => setListOpen(true)}
                onBlur={() => setListOpen(false)}
              />
              {listOpen && results.length > 0 && (
                <ul
                  id="snippet-results"
                  role="listbox"
                  className="absolute inset-x-0 top-[calc(100%+6px)] z-10 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-(--surface) p-1 shadow-xl dark:border-white/10"
                >
                  {results.map((track, i) => (
                    <li
                      key={track.id}
                      role="option"
                      aria-selected={i === active}
                      // mousedown statt click: sonst schließt das Verlassen des Felds die Liste vorher.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(track);
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 ${i === active ? "bg-(--accent-soft)" : "hover:bg-(--accent-soft)"}`}
                    >
                      <img
                        src={track.artwork}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-md object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{track.title}</span>
                        <span className="block truncate text-xs text-(--text-secondary)">
                          {track.artist}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="secondary" onClick={skip} disabled={!round || busy}>
                {stage === LAST ? t.snippet.giveUp : t.snippet.skip}
                {stage < LAST && (
                  <span className="font-mono text-xs text-(--text-secondary)">
                    +{sec(SNIPPET_STAGES[stage + 1] - SNIPPET_STAGES[stage])}
                  </span>
                )}
              </Button>
              <Button onClick={guess} disabled={!selected || busy}>
                {t.snippet.guess}
              </Button>
            </div>
            <p className="hidden text-[11px] text-(--text-secondary) sm:block">{t.snippet.keys}</p>
            <ErrorText code={error} className="mt-0" />
            {error && !round && (
              <Button variant="secondary" size="small" onClick={() => void load(mode)}>
                <FiRefreshCw aria-hidden="true" /> {t.snippet.retry}
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Am Handy eine Spalte in Lesereihenfolge (order), am PC links Song und Teilen, rechts Statistik. */
        <div className="mt-5 flex flex-col gap-5 lg:mt-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <div className="order-1 flex items-center gap-4 lg:order-none">
              {solution.artwork && (
                <img
                  src={solution.artwork}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-xl object-cover shadow-sm"
                />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold ${won ? "text-(--success)" : "text-red-600 dark:text-red-400"}`}
                >
                  {won ? t.snippet.won(sec(SNIPPET_STAGES[attempts.length - 1])) : t.snippet.lost}
                  {won && result && ` · +${t.snippet.points(result.points)}`}
                </p>
                <h2 className="mt-0.5 text-xl font-bold leading-tight tracking-tight">
                  {solution.title}
                </h2>
                <p className="truncate text-sm text-(--text-secondary)">
                  {solution.artist}
                  {solution.year && ` · ${solution.year}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => (clip.playing ? clip.stop() : clip.play())}
                    disabled={clip.status !== "ready"}
                    className="inline-flex items-center gap-1.5 text-(--accent) transition hover:text-(--accent-hover) disabled:opacity-40"
                  >
                    {clip.playing ? <FiSquare aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
                    {clip.playing ? t.snippet.stop : t.snippet.listen}
                  </button>
                  <a
                    href={`https://music.apple.com/de/song/${solution.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-(--accent) transition hover:text-(--accent-hover)"
                  >
                    <FiExternalLink aria-hidden="true" /> {t.snippet.apple}
                  </a>
                </div>
              </div>
            </div>

            {runNote && (
              <p className="animate-pop order-2 rounded-lg border lg:order-none border-(--accent-border) bg-(--accent-soft) px-3 py-2 text-sm font-semibold">
                {runNote}
              </p>
            )}

            {mode === "daily" && global && (
              <GlobalResult
                global={global}
                mine={won ? attempts.length - 1 : SNIPPET_STAGES.length}
                alone={!archive}
                label={(i) => SNIPPET_STAGES[i].toLocaleString(language)}
                same={(pct) => t.snippet.globalSame(pct, sec(SNIPPET_STAGES[attempts.length - 1]))}
                text={t.snippet}
              />
            )}

            <pre className="order-5 overflow-x-auto lg:order-none whitespace-pre-wrap rounded-lg border border-slate-200 bg-(--bg-primary) px-3 py-2 font-mono text-xs select-all dark:border-white/10">
              {shareText}
            </pre>

            <div className="order-6 flex flex-wrap justify-between gap-3 lg:order-none">
              <Button variant="secondary" onClick={copy}>
                {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                {copied ? t.snippet.copied : t.snippet.copy}
              </Button>
              {archive || (mode === "daily" && !ENDLESS) ? (
                <Button onClick={() => setArchiveOpen(true)}>{t.snippet.archive}</Button>
              ) : mode === "daily" ? (
                <Button onClick={() => chooseMode("endless")}>{t.snippet.playEndless}</Button>
              ) : (
                <Button onClick={() => void start(category)}>{t.snippet.next}</Button>
              )}
            </div>
            {mode === "daily" && daily && (
              <div className="order-7 lg:order-none">
                <Countdown at={daily.nextAt} onReady={() => void startDaily()} text={t.snippet} />
              </div>
            )}
            {mode === "daily" && daily && !archive && (
              <div className="order-7 lg:order-none">
                <NextDaily current="snippet" />
              </div>
            )}
            <ErrorText code={error} className="order-8 mt-0 lg:order-none" />
          </div>
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            {/* Endlos: gespielt und Quote über alles, Serie und Rekord der Kategorie dieses Songs. */}
            <dl className="order-3 grid grid-cols-4 gap-2 text-center lg:order-none">
              {[
                [t.snippet.stats.played, view.played],
                [
                  t.snippet.stats.won,
                  view.played ? `${Math.round((view.won / view.played) * 100)} %` : "–",
                ],
                [t.snippet.stats.streak, view.streak],
                [t.snippet.stats.best, view.best],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col-reverse rounded-lg bg-slate-100 px-1 py-2 dark:bg-white/5"
                >
                  <dt className="text-[11px] text-(--text-secondary)">{label}</dt>
                  <dd className="text-xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="order-4 space-y-1 lg:order-none">
              {[...view.byStage, view.played - view.won].map((value, i) => {
                // Im Archiv zählt die Runde nicht zur eigenen Statistik – dann nichts markieren.
                const mine =
                  !archive && (won ? i === attempts.length - 1 : i === SNIPPET_STAGES.length);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2 font-mono text-[11px] tabular-nums text-(--text-secondary)"
                  >
                    <span>{i < SNIPPET_STAGES.length ? sec(SNIPPET_STAGES[i]) : "✕"}</span>
                    <span
                      className={`flex h-4.5 min-w-6 items-center justify-end rounded px-1.5 ${mine ? "bg-(--accent) font-bold text-(--on-accent)" : "bg-slate-100 dark:bg-white/5"}`}
                      style={{ width: `${Math.max(6, (value / best) * 100)}%` }}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Snippet;
