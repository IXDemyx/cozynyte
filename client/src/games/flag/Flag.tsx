import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { FiArrowUp, FiCalendar, FiCheck, FiCopy, FiFlag, FiSearch } from "react-icons/fi";
import { COUNTRIES, COUNTRY_BY_CODE } from "../../../../shared/countries";
import {
  FLAG_GRID,
  FLAG_PALETTE,
  FLAG_TRIES,
  decodeGrid,
  decodeMask,
  flagDateOf,
  type DailyKind,
  type FlagAttempt,
  type FlagGlobal,
  type FlagTurn,
} from "../../../../shared/flag";
import { dailyDate } from "../../../../shared/snippet";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import { ArchiveList, berlinZone, Countdown, GlobalResult } from "../../components/DailyParts";
import NextDaily from "../../components/NextDaily";
import { card, eyebrow, input } from "../../components/ui";
import { dayResults } from "../dailyStatus";
import { useConfirm } from "../../hooks/useConfirm";
import { useLanguage, type Language } from "../../lib/i18n";
import { GAME_PATH } from "../../lib/seo";
import { playEffect } from "../../lib/sounds";
import { flagGrid, flagImage, outlineImage, playFlag } from "./api";
import {
  flagStreak,
  loadFlagDays,
  loadFlagStats,
  recordFlag,
  saveFlagDay,
  type FlagStats,
} from "./stats";

/** Zeichenfläche der verdeckten Flagge (4:3 wie die Flaggen). */
const CANVAS = { w: 640, h: 480 };

/** Texte je Rätsel: die der Flagge, beim Umriss teils ersetzt. */
function useTexts(kind: DailyKind) {
  const { t } = useLanguage();
  return kind === "outline" ? { ...t.flag, ...t.outline } : t.flag;
}

/** Kleinschreibung ohne Akzente und Satzzeichen – für die Suche. */
const simple = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Länder, deren Name (oder eine andere Schreibweise) zur Eingabe passt – Anfänge zuerst. */
function searchCountries(term: string, language: Language, skip: Set<string>): string[] {
  const query = simple(term);
  if (!query) return [];
  const found: { code: string; rank: number }[] = [];
  for (const country of COUNTRIES) {
    if (skip.has(country.code)) continue;
    const names = [
      country[language],
      country[language === "de" ? "en" : "de"],
      ...(country.alt ?? []),
    ];
    let rank = Infinity;
    for (const [i, name] of names.entries()) {
      const at = simple(name).indexOf(query);
      if (at < 0) continue;
      // Eigener Name vor fremdem, Anfang vor Mitte.
      rank = Math.min(rank, (at === 0 ? 0 : 2) + (i === 0 ? 0 : 1));
    }
    if (rank < Infinity) found.push({ code: country.code, rank });
  }
  const name = (code: string) => COUNTRY_BY_CODE.get(code)?.[language] ?? code;
  return found
    .sort((a, b) => a.rank - b.rank || name(a.code).localeCompare(name(b.code), language))
    .slice(0, 8)
    .map((item) => item.code);
}

/** Größe einer Rasterzelle auf der Zeichenfläche. */
const CELL = { w: CANVAS.w / FLAG_GRID.w, h: CANVAS.h / FLAG_GRID.h };

/** Farben der Palette für die aufgedeckten Zellen. */
const TONES = FLAG_PALETTE.map(([r, g, b]) => `rgb(${r} ${g} ${b})`);

/** Farbraster einer Flagge laden (einmal pro Land) – dasselbe, mit dem der Server vergleicht. */
const grids = new Map<string, Promise<Uint8Array>>();
function loadGrid(code: string): Promise<Uint8Array> {
  let grid = grids.get(code);
  if (!grid) {
    grid = fetch(flagGrid(code))
      .then((res) => res.json() as Promise<{ runs: string }>)
      .then(({ runs }) => decodeGrid(runs));
    grid.catch(() => grids.delete(code));
    grids.set(code, grid);
  }
  return grid;
}

/**
 * Die gesuchte Flagge, soweit aufgedeckt: Jede Zelle, an der eine getippte Flagge farblich passt
 * (Maske vom Server), wird flach in dieser Farbe gefüllt. Die gesuchte Flagge selbst kennt der
 * Browser erst nach der Auflösung.
 */
function HiddenFlag({ attempts, solution }: { attempts: FlagAttempt[]; solution: string | null }) {
  const { t, language } = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const masks = useMemo(() => attempts.map((a) => decodeMask(a.mask ?? "")), [attempts]);
  const shown = useMemo(() => {
    const cells = FLAG_GRID.w * FLAG_GRID.h;
    let open = 0;
    for (let i = 0; i < cells; i++) if (masks.some((mask) => mask[i])) open++;
    return Math.round((open / cells) * 100);
  }, [masks]);

  useEffect(() => {
    const target = canvas.current?.getContext("2d");
    if (!target || solution) return;
    let cancelled = false;
    void Promise.all(attempts.map((a) => loadGrid(a.code).catch(() => null))).then((cells) => {
      if (cancelled) return;
      target.clearRect(0, 0, CANVAS.w, CANVAS.h);
      cells.forEach((grid, n) => {
        if (!grid) return;
        // Passende Zellen flach in ihrer Palettenfarbe füllen – Muster der getippten Flagge
        // (Sterne, Wappen) gehören nicht zur gesuchten und würden sonst mitgezeichnet.
        masks[n].forEach((on, i) => {
          if (!on) return;
          target.fillStyle = TONES[grid[i]];
          target.fillRect(
            (i % FLAG_GRID.w) * CELL.w,
            Math.floor(i / FLAG_GRID.w) * CELL.h,
            CELL.w,
            CELL.h,
          );
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [attempts, masks, solution]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-[4px_4px_0_var(--card-pop)] dark:border-white/10 dark:bg-white/10">
      {solution ? (
        <img
          src={flagImage(solution)}
          alt={t.flag.flagOf(COUNTRY_BY_CODE.get(solution)?.[language] ?? "")}
          className="animate-in h-full w-full object-cover"
        />
      ) : (
        <>
          <canvas
            ref={canvas}
            width={CANVAS.w}
            height={CANVAS.h}
            role="img"
            aria-label={t.flag.shown(shown)}
            className="h-full w-full"
          />
          <span className="absolute left-2.5 top-2.5 rounded-full border border-slate-200 bg-(--surface)/90 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums dark:border-white/10">
            {t.flag.shown(shown)}
          </span>
        </>
      )}
    </div>
  );
}

/** Umriss des Tages – von Anfang an ganz zu sehen, nach der Auflösung mit Namen. */
function DailyOutline({ number, solution }: { number: number; solution: string | null }) {
  const { t, language } = useLanguage();
  const country = solution ? COUNTRY_BY_CODE.get(solution)?.[language] : undefined;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-4 shadow-[4px_4px_0_var(--card-pop)] dark:border-white/10 dark:bg-white/5">
      <img
        src={outlineImage(number)}
        alt={country ? t.outline.outlineOf(country) : t.flag.question}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/** Nähe als Farbe fürs Teilen: grün getroffen, gelb nah, orange mittel, rot weit weg. */
const nearSquare = (a: FlagAttempt) =>
  a.right ? "🟩" : a.near >= 80 ? "🟨" : a.near >= 50 ? "🟧" : "🟥";

const ARROWS = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];

/** Ein Tipp fürs Teilen: Nähe und Richtung (ohne Land, damit nichts verraten wird). */
const shareMark = (a: FlagAttempt) =>
  a.right ? nearSquare(a) : `${nearSquare(a)}${ARROWS[Math.round(a.bearing / 45) % 8]}`;

/** Zufallszahlen aus einem Text – gleicher Text, gleiche Folge (Mulberry32). */
function seeded(text: string) {
  let seed = 0;
  for (const char of text) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Vier Hauptstädte zur Auswahl (Länder-Codes): die richtige und drei andere, möglichst vom selben
 * Kontinent. An einem Tag für alle gleich. Leer, wenn das Land keine Hauptstadt hat.
 */
function capitalChoices(kind: DailyKind, date: string, solution: string): string[] {
  const goal = COUNTRY_BY_CODE.get(solution);
  if (!goal?.capital) return [];
  const random = seeded(`${kind}:${date}`);
  const shuffle = <T,>(items: T[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const others = COUNTRIES.filter((c) => c.capital && c.code !== solution);
  const same = shuffle(others.filter((c) => c.continent === goal.continent));
  const rest = shuffle(others.filter((c) => c.continent !== goal.continent));
  return shuffle([solution, ...[...same, ...rest].slice(0, 3).map((c) => c.code)]);
}

/** Bonusfrage nach der Auflösung: die Hauptstadt des Landes, ein Versuch. */
function CapitalBonus({
  kind,
  date,
  solution,
  picked,
  onPick,
}: {
  kind: DailyKind;
  date: string;
  solution: string;
  picked: string | null;
  onPick: (code: string) => void;
}) {
  const { t, language } = useLanguage();
  const choices = useMemo(() => capitalChoices(kind, date, solution), [kind, date, solution]);
  if (!choices.length) return null;
  const city = (code: string) => COUNTRY_BY_CODE.get(code)?.capital?.[language] ?? "";
  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <p className="text-sm font-semibold">{t.flag.capitalQuestion}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {choices.map((code) => {
          const state = !picked
            ? "open"
            : code === solution
              ? "right"
              : code === picked
                ? "wrong"
                : "rest";
          return (
            <button
              key={code}
              type="button"
              disabled={Boolean(picked)}
              onClick={() => onPick(code)}
              className={`min-w-0 truncate rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                state === "right"
                  ? "border-transparent bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-(--success)"
                  : state === "wrong"
                    ? "border-transparent bg-red-500/15 text-red-600 dark:text-red-400"
                    : state === "rest"
                      ? "border-slate-200 text-(--text-secondary) opacity-60 dark:border-white/10"
                      : "border-slate-200 hover:border-(--accent) hover:bg-(--accent-soft) dark:border-white/10"
              }`}
            >
              {city(code)}
            </button>
          );
        })}
      </div>
      {picked && (
        <p
          className={`mt-2 text-xs font-semibold ${picked === solution ? "text-(--success)" : "text-red-600 dark:text-red-400"}`}
        >
          {picked === solution ? t.flag.capitalRight : t.flag.capitalWrong(city(solution))}
        </p>
      )}
    </div>
  );
}

/**
 * Flagge des Tages: für alle dieselbe Flagge, einmal am Tag. Die Flagge ist verdeckt; jeder Tipp
 * deckt die Stellen auf, an denen die Flagge des getippten Landes dieselbe Farbe hat. Dazu
 * Entfernung, Richtung und Nähe zum gesuchten Land. Sieben Versuche, kein Überspringen.
 * Umriss des Tages (`kind` „outline“): derselbe Ablauf, zu sehen ist der Umriss des Landes.
 * Der Stand bleibt im Browser (der Server rechnet die Tipps jedes Mal neu aus), frühere Tage gibt
 * es im Archiv. Ohne Raum – läuft direkt auf der Spielseite. Am PC zwei Spalten: links die Tipps,
 * rechts Flagge und Suche.
 */
function Flag({ kind = "flag" }: { kind?: DailyKind }) {
  const { t, language } = useLanguage();
  const text = useTexts(kind);
  const [day, setDay] = useState<{
    date: string;
    number: number;
    today: number;
    nextAt: number;
  } | null>(null);
  const [attempts, setAttempts] = useState<FlagAttempt[]>([]);
  const [solution, setSolution] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  /** Bonusfrage: gewählte Hauptstadt (ISO-Code ihres Landes). */
  const [capitalPick, setCapitalPick] = useState<string | null>(null);
  const [global, setGlobal] = useState<FlagGlobal | null>(null);
  const [stats, setStats] = useState<FlagStats>(() => loadFlagStats(kind));
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const [listOpen, setListOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { armed, confirm } = useConfirm();
  const started = useRef(false);
  /** Zählt Ladevorgänge – Antworten auf einen überholten (anderer Tag) werden verworfen. */
  const loads = useRef(0);
  const field = useRef<HTMLInputElement>(null);

  const name = (code: string) => COUNTRY_BY_CODE.get(code)?.[language] ?? code;
  const done = solution !== null;
  const archive = day !== null && day.number < day.today;
  const won = attempts.at(-1)?.right === true;
  /** „28. Okt.“ bzw. „28 Oct“ für einen Tag. */
  const dayLabel = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString(language, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  const km = (n: number) => `${n.toLocaleString(language)} km`;

  const show = (turn: FlagTurn) => {
    setDay({
      date: turn.date,
      number: turn.number,
      today: turn.today,
      nextAt: Date.now() + turn.nextIn,
    });
    setAttempts(turn.attempts);
    setSolution(turn.solution ?? null);
    setGlobal(turn.global ?? null);
  };

  /** Flagge des Tages – heute oder (`number`) ein früherer Tag aus dem Archiv, mit dem Stand im Browser. */
  const load = async (number?: number): Promise<void> => {
    const current = ++loads.current;
    setError("");
    setArchiveOpen(false);
    setTerm("");
    setSelected(null);
    const date = number ? flagDateOf(number) : dailyDate();
    const saved = loadFlagDays(kind)[date];
    const res = await playFlag({
      kind,
      number: number ?? null,
      date,
      guesses: saved?.guesses ?? [],
      giveUp: saved?.gaveUp ?? false,
      count: false,
    });
    if (current !== loads.current) return;
    if (!res.ok) return setError(res.error);
    // Geht die Uhr im Browser falsch, meint der Server einen anderen Tag – dann dessen Stand laden.
    if (res.date !== date && loadFlagDays(kind)[res.date]?.guesses.length) return load(res.number);
    setGaveUp(saved && res.date === date ? saved.gaveUp : false);
    setCapitalPick(saved && res.date === date ? saved.capital : null);
    show(res);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void load();
  }, []);

  /** Neuer Tipp (`code`) oder aufgeben (null). */
  const submit = async (code: string | null) => {
    if (!day || busy || done) return;
    setBusy(true);
    const guesses = [...attempts.map((a) => a.code), ...(code ? [code] : [])];
    const ends = code === null || guesses.length >= FLAG_TRIES;
    const res = await playFlag({
      kind,
      number: day.number,
      date: day.date,
      guesses,
      giveUp: code === null,
      // Ob die Runde endet, weiß erst der Server (Treffer) – mitzählen darf er, wenn es so ist.
      count: !archive,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (res.date !== day.date) return void load();
    setError("");
    setTerm("");
    setSelected(null);
    setListOpen(false);
    const last = res.attempts.at(-1);
    saveFlagDay(kind, {
      date: res.date,
      guesses: res.attempts.map((a) => a.code),
      gaveUp: code === null,
      solution: res.solution ?? null,
      capital: null,
    });
    setGaveUp(code === null);
    show(res);
    if (res.done) {
      const hit = last?.right === true;
      playEffect(hit ? "correct" : "miss");
      if (!archive) setStats(recordFlag(kind, res.date, hit ? res.attempts.length - 1 : null));
    } else {
      if (!ends) playEffect("miss");
      field.current?.focus();
    }
  };

  const guessed = useMemo(() => new Set(attempts.map((a) => a.code)), [attempts]);
  const results = useMemo(
    () => (selected ? [] : searchCountries(term, language, guessed)),
    [term, selected, language, guessed],
  );

  const pick = (code: string) => {
    setSelected(code);
    setTerm(name(code));
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
      if (selected) void submit(selected);
      else if (results.length) pick(results[Math.max(0, active)]);
    } else if (event.key === "Escape") {
      setListOpen(false);
    }
  };

  /** Bonusfrage beantworten (einmal pro Tag, auch im Archiv). */
  const pickCapital = (code: string) => {
    if (!day || !solution || capitalPick) return;
    setCapitalPick(code);
    playEffect(code === solution ? "correct" : "miss");
    const saved = loadFlagDays(kind)[day.date];
    if (saved) saveFlagDay(kind, { ...saved, capital: code });
  };

  const shareText = [
    `Cozynyte · ${day ? text.share(day.number) : t.games[kind]} · ${won ? attempts.length : "X"}/${FLAG_TRIES}`,
    attempts.map(shareMark).join(" "),
    capitalPick && `🏛️ ${capitalPick === solution ? "✅" : "❌"}`,
    `https://cozynyte.com${GAME_PATH[kind][language]}`,
  ]
    .filter(Boolean)
    .join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ohne Zwischenablage bleibt der Text zum Markieren stehen.
    }
  };

  const streak = flagStreak(stats, day ? flagDateOf(day.today) : "");
  const best = Math.max(1, ...stats.byStage, stats.played - stats.won);
  const country = solution ? COUNTRY_BY_CODE.get(solution) : undefined;

  const rows = (
    <ol className="grid content-start gap-1.5" aria-label={text.attempts}>
      {Array.from({ length: FLAG_TRIES }, (_, i) => {
        const attempt = attempts[i];
        const current = i === attempts.length && !done;
        return (
          <li
            key={i}
            className={`grid min-h-10 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-1.5 text-sm ${
              attempt?.right
                ? "border-transparent bg-[color-mix(in_srgb,var(--success)_16%,transparent)]"
                : attempt
                  ? "border-transparent bg-slate-100 dark:bg-white/5"
                  : current
                    ? "border-(--accent-border) bg-(--accent-soft)"
                    : "border-transparent bg-slate-100 dark:bg-white/5"
            }`}
          >
            {attempt ? (
              <img
                src={flagImage(attempt.code)}
                alt=""
                className="aspect-[4/3] w-9 rounded-sm border border-slate-200 object-cover dark:border-white/10"
              />
            ) : (
              <span className="aspect-[4/3] w-9 rounded-sm border border-dashed border-slate-300 dark:border-white/15" />
            )}
            <span className="truncate">{attempt && name(attempt.code)}</span>
            {attempt &&
              (attempt.right ? (
                <span className="text-xs font-bold text-(--success)">{text.right}</span>
              ) : (
                <span className="flex items-center gap-2 font-mono text-xs tabular-nums text-(--text-secondary)">
                  {km(attempt.km)}
                  <FiArrowUp
                    role="img"
                    aria-label={text.direction(attempt.bearing)}
                    className="text-base text-(--text-primary)"
                    style={{ transform: `rotate(${attempt.bearing}deg)` }}
                  />
                  <span className="w-9 text-right font-bold text-(--text-primary)">
                    {attempt.near} %
                  </span>
                </span>
              ))}
          </li>
        );
      })}
    </ol>
  );

  return (
    <section className={`${card} min-w-0 p-5 sm:p-6`}>
      <p className={eyebrow}>{t.games[kind]}</p>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--text-secondary)">
          <p>
            {day && <span className="font-mono font-bold text-(--accent)">#{day.number}</span>}{" "}
            {archive && day
              ? text.archiveDay(dayLabel(day.date))
              : text.dailyInfo(berlinZone(language))}
          </p>
          {day && (
            <button
              type="button"
              aria-expanded={archiveOpen}
              onClick={() => setArchiveOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 font-semibold text-(--accent) transition hover:text-(--accent-hover)"
            >
              <FiCalendar aria-hidden="true" /> {text.archive}
            </button>
          )}
          {archive && (
            <button
              type="button"
              onClick={() => void load()}
              className="font-semibold text-(--accent) transition hover:text-(--accent-hover)"
            >
              {text.backToday}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg bg-(--accent-soft) px-3 py-2 text-sm lg:min-w-64">
          <span>
            <span className="text-(--text-secondary)">{text.streak}</span>{" "}
            <span
              key={streak}
              className="animate-pop inline-block font-bold tabular-nums text-(--accent)"
            >
              {streak}
            </span>
          </span>
          <span className="text-xs text-(--text-secondary)">{text.record(stats.best)}</span>
        </div>
      </div>
      {day && archiveOpen && (
        <ArchiveList
          today={day.today}
          current={day.number}
          max={FLAG_TRIES}
          dateOf={flagDateOf}
          result={dayResults(kind)}
          dayLabel={dayLabel}
          text={text}
          onPick={(number) => void load(number)}
        />
      )}

      {!done ? (
        <div className="mt-5 grid gap-5 lg:mt-6 lg:grid-cols-2 lg:gap-8">
          {/* Am Handy erst die Flagge und die Suche, darunter die Tipps. */}
          <div className="order-2 lg:order-none">{rows}</div>
          <div className="order-1 min-w-0 space-y-4 lg:order-none">
            {kind === "outline" && day ? (
              <DailyOutline number={day.number} solution={null} />
            ) : (
              <HiddenFlag attempts={attempts} solution={null} />
            )}
            <div>
              <p className="font-bold">{text.question}</p>
              <p className="text-sm text-(--text-secondary)">
                {text.attempt(Math.min(attempts.length + 1, FLAG_TRIES), FLAG_TRIES)}
              </p>
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
                aria-controls={`${kind}-results`}
                aria-label={text.search}
                autoComplete="off"
                className={`${input} pl-11`}
                value={term}
                placeholder={text.searchPlaceholder}
                disabled={!day}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setSelected(null);
                  setActive(-1);
                  setListOpen(true);
                }}
                onKeyDown={onKey}
                onFocus={() => setListOpen(true)}
                onBlur={() => setListOpen(false)}
              />
              {listOpen && results.length > 0 && (
                <ul
                  id={`${kind}-results`}
                  role="listbox"
                  className="absolute inset-x-0 top-[calc(100%+6px)] z-10 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-(--surface) p-1 shadow-xl dark:border-white/10"
                >
                  {results.map((code, i) => (
                    <li
                      key={code}
                      role="option"
                      aria-selected={i === active}
                      // mousedown statt click: sonst schließt das Verlassen des Felds die Liste vorher.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(code);
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 ${i === active ? "bg-(--accent-soft)" : "hover:bg-(--accent-soft)"}`}
                    >
                      <span className="min-w-0 truncate text-sm font-semibold">{name(code)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => confirm("giveUp") && void submit(null)}
                disabled={!day || busy}
              >
                <FiFlag aria-hidden="true" />
                {armed === "giveUp" ? text.giveUpConfirm : text.giveUp}
              </Button>
              <Button
                onClick={() => selected && void submit(selected)}
                disabled={!selected || busy}
              >
                {text.guess}
              </Button>
            </div>
            <p className="hidden text-[11px] text-(--text-secondary) sm:block">{text.hint}</p>
            <ErrorText code={error} className="mt-0" />
          </div>
        </div>
      ) : (
        /* Am Handy eine Spalte in Lesereihenfolge (order), am PC links Flagge und Teilen, rechts Statistik. */
        <div className="mt-5 flex flex-col gap-5 lg:mt-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <div className="order-1 lg:order-none">
              {kind === "outline" && day ? (
                <DailyOutline number={day.number} solution={solution} />
              ) : (
                <HiddenFlag attempts={attempts} solution={solution} />
              )}
              <p
                className={`mt-4 text-sm font-bold ${won ? "text-(--success)" : "text-red-600 dark:text-red-400"}`}
              >
                {won ? text.won(attempts.length) : gaveUp ? text.gaveUp : text.lost}
              </p>
              <h2 className="mt-0.5 text-xl font-bold leading-tight tracking-tight">
                {country?.[language]}
              </h2>
              {country && (
                <p className="text-sm text-(--text-secondary)">
                  {t.geo.continents[country.continent]}
                  {/* Hauptstadt erst nach der Bonusfrage – sonst wäre sie verraten. */}
                  {country.capital &&
                    capitalPick &&
                    ` · ${text.capital(country.capital[language])}`}
                </p>
              )}
              {day && solution && (
                <CapitalBonus
                  kind={kind}
                  date={day.date}
                  solution={solution}
                  picked={capitalPick}
                  onPick={pickCapital}
                />
              )}
            </div>

            {global && (
              <GlobalResult
                global={global}
                mine={won ? attempts.length - 1 : FLAG_TRIES}
                alone={!archive}
                label={(i) => String(i + 1)}
                same={(pct) => text.globalSame(pct, attempts.length)}
                text={text}
              />
            )}

            <pre className="order-5 overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-(--bg-primary) px-3 py-2 font-mono text-xs select-all lg:order-none dark:border-white/10">
              {shareText}
            </pre>

            <div className="order-6 flex flex-wrap justify-between gap-3 lg:order-none">
              <Button variant="secondary" onClick={copy}>
                {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                {copied ? text.copied : text.copy}
              </Button>
              <Button onClick={() => setArchiveOpen(true)}>{text.archive}</Button>
            </div>
            {day && (
              <div className="order-7 lg:order-none">
                <Countdown at={day.nextAt} onReady={() => void load()} text={text} />
              </div>
            )}
            {!archive && (
              <div className="order-7 lg:order-none">
                <NextDaily current={kind} />
              </div>
            )}
            <ErrorText code={error} className="order-8 mt-0 lg:order-none" />
          </div>
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <div className="order-3 lg:order-none">{rows}</div>
            <dl className="order-4 grid grid-cols-4 gap-2 text-center lg:order-none">
              {[
                [text.stats.played, stats.played],
                [
                  text.stats.won,
                  stats.played ? `${Math.round((stats.won / stats.played) * 100)} %` : "–",
                ],
                [text.stats.streak, streak],
                [text.stats.best, stats.best],
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
              {[...stats.byStage, stats.played - stats.won].map((value, i) => {
                // Im Archiv zählt die Runde nicht zur eigenen Statistik – dann nichts markieren.
                const mine = !archive && (won ? i === attempts.length - 1 : i === FLAG_TRIES);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-2 font-mono text-[11px] tabular-nums text-(--text-secondary)"
                  >
                    <span>{i < FLAG_TRIES ? i + 1 : "✕"}</span>
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

/** Umriss des Tages: dasselbe Spiel mit dem Umriss statt der Flagge. */
export function Outline() {
  return <Flag kind="outline" />;
}

export default Flag;
