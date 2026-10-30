import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiCheck } from "react-icons/fi";
import { ESTIMATE_MAX, type EstimateUnit } from "../../../../shared/estimate";
import type { EstimateView, RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import VolumeControl from "../../components/VolumeControl";
import { card, eyebrow, input } from "../../components/ui";
import { useNow } from "../../hooks/useNow";
import { useLanguage } from "../../lib/i18n";
import { playEffect } from "../../lib/sounds";
import { socket } from "../../lib/socket";
import { useEstimateSounds } from "./useEstimateSounds";

type Dict = ReturnType<typeof useLanguage>["t"];
type Language = "de" | "en";

interface EstimateRoundProps {
  state: RoomState;
  game: EstimateView;
  offset: number;
}

/** Zahl mit Tausendertrennern der Sprache – Jahreszahlen ohne. */
function formatNumber(n: number, unit: EstimateUnit | undefined, language: Language): string {
  if (unit === "year") return String(n);
  return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-GB").format(n);
}

/** Zahl samt Einheit, z. B. „330 m“ oder „71%“. */
function formatValue(n: number, unit: EstimateUnit, language: Language, t: Dict): string {
  const number = formatNumber(n, unit, language);
  const short = t.estimate.units[unit].short;
  if (!short) return number;
  return unit === "percent" && language === "en" ? `${number}%` : `${number} ${short}`;
}

/** Abstand zur Lösung mit Vorzeichen, z. B. „+30 m“ oder „−5 Jahre“ (bei Jahreszahlen). */
function formatOff(off: number, unit: EstimateUnit, language: Language, t: Dict): string {
  const sign = off > 0 ? "+" : off < 0 ? "−" : "±";
  return `${sign}${formatValue(Math.abs(off), unit === "year" ? "years" : unit, language, t)}`;
}

/** Schätzfragen: Frage oben, darunter das Zahlenfeld – in der Auflösung alle Tipps neben der Lösung. */
function EstimateRound({ state, game, offset }: EstimateRoundProps) {
  const { t, language } = useLanguage();
  const now = useNow(offset);
  useEstimateSounds(state, game, offset);

  const remaining = Math.max(0, game.endsAt - now);
  const fraction = game.durationMs > 0 ? Math.min(1, remaining / game.durationMs) : 0;
  const question = game.stage === "question";
  const urgent = question && remaining < 5_000;

  return (
    <RoomLayout
      state={state}
      players={
        <PlayerList
          state={state}
          title={t.points}
          showScore
          status={(p) =>
            game.stage === "reveal" ? (
              game.gains?.[p.id] ? (
                <span className="font-mono font-semibold text-(--success)">
                  +{game.gains[p.id]}
                </span>
              ) : null
            ) : game.answered.includes(p.id) ? (
              <FiCheck aria-label={t.estimate.answered} className="text-(--accent)" />
            ) : null
          }
        />
      }
    >
      <section className={`${card} flex min-w-0 flex-col overflow-hidden xl:flex-1`}>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full transition-[width] duration-100 ease-linear ${
              urgent ? "bg-red-500" : game.stage === "reveal" ? "bg-(--success)" : "bg-(--accent)"
            }`}
            style={{ width: `${(question ? fraction : game.stage === "reveal" ? 1 : 0) * 100}%` }}
          />
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className={eyebrow}>
              {t.estimate.question(game.index, game.total)}
              {game.category && (
                <span className="text-(--text-secondary)">
                  {" "}
                  · {t.estimate.topics[game.category]}
                </span>
              )}
            </p>
            <div className="flex items-center gap-4">
              <VolumeControl />
              {question && (
                <p
                  className={`font-mono text-2xl font-semibold tabular-nums ${urgent ? "text-red-500" : ""}`}
                  aria-live="off"
                >
                  {Math.ceil(remaining / 1000)}
                  <span className="text-sm text-(--text-secondary)">s</span>
                </p>
              )}
            </div>
          </div>

          {game.stage === "countdown" || !game.text || !game.unit ? (
            <Countdown seconds={Math.max(1, Math.ceil(remaining / 1000))} t={t} />
          ) : (
            <div key={game.qid} className="animate-in mt-6 flex flex-1 flex-col">
              <h2 className="mx-auto max-w-2xl text-balance text-center text-xl font-bold tracking-tight sm:text-2xl">
                {game.text[language]}
              </h2>
              {game.stage === "reveal" && game.answer !== undefined ? (
                <Reveal
                  state={state}
                  game={game}
                  answer={game.answer}
                  unit={game.unit}
                  t={t}
                  language={language}
                />
              ) : game.yourGuess !== undefined ? (
                <div className="animate-badge mx-auto mt-8 w-full max-w-sm rounded-xl border border-(--success) p-4 text-center">
                  <p className="flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-widest text-(--success)">
                    <FiCheck aria-hidden="true" /> {t.estimate.yourGuess}
                  </p>
                  <p className="mt-1 break-words font-mono text-3xl font-semibold">
                    {formatValue(game.yourGuess, game.unit, language, t)}
                  </p>
                  <p className="mt-1 text-sm text-(--text-secondary)">{t.estimate.waiting}</p>
                </div>
              ) : (
                <GuessForm game={game} unit={game.unit} t={t} language={language} />
              )}
            </div>
          )}
        </div>
      </section>
    </RoomLayout>
  );
}

function Countdown({ seconds, t }: { seconds: number; t: Dict }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary)">
        {t.estimate.ready}
      </p>
      <p
        key={seconds}
        className="animate-badge mt-4 font-mono text-8xl font-extrabold text-(--accent)"
      >
        {seconds}
      </p>
    </div>
  );
}

/** Zahlenfeld: nur Ziffern, beim Tippen mit Tausendertrennern. Ein Tipp pro Frage. */
function GuessForm({
  game,
  unit,
  t,
  language,
}: {
  game: EstimateView;
  unit: EstimateUnit;
  t: Dict;
  language: Language;
}) {
  const [digits, setDigits] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const value = digits ? Number(digits) : NaN;
  const valid = Number.isInteger(value) && value >= 0 && value <= ESTIMATE_MAX;

  // Am großen Bildschirm direkt ins Feld – am Handy nicht (die Tastatur würde die Frage verdecken).
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      field.current?.focus({ preventScroll: true });
    }
  }, []);

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    playEffect("hold");
    socket.emit("estimate:guess", { qid: game.qid, value });
  };

  return (
    <form onSubmit={send} className="mx-auto mt-8 w-full max-w-md">
      <div className="flex items-center gap-2">
        <input
          ref={field}
          aria-label={t.estimate.placeholder}
          className={`${input} border-(--accent) text-center font-mono text-xl font-semibold`}
          value={digits ? formatNumber(value, unit, language) : ""}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="send"
          placeholder={t.estimate.placeholder}
          onChange={(e) =>
            setDigits(
              e.target.value
                .replace(/\D/g, "")
                .replace(/^0+(?=\d)/, "")
                .slice(0, 12),
            )
          }
        />
        <span className="shrink-0 text-sm font-semibold text-(--text-secondary)">
          {t.estimate.units[unit].long}
        </span>
      </div>
      <Button type="submit" className="mt-4 w-full" disabled={!valid}>
        {t.estimate.send}
      </Button>
    </form>
  );
}

/** Auflösung: Lösung groß, darunter ein Zahlenstrahl und alle Tipps nach Abstand sortiert. */
function Reveal({
  state,
  game,
  answer,
  unit,
  t,
  language,
}: {
  state: RoomState;
  game: EstimateView;
  answer: number;
  unit: EstimateUnit;
  t: Dict;
  language: Language;
}) {
  const guesses = game.guesses ?? {};
  const rows = state.players
    .filter((p) => guesses[p.id] !== undefined)
    .map((p) => ({ player: p, guess: guesses[p.id], off: guesses[p.id] - answer }))
    .sort((a, b) => Math.abs(a.off) - Math.abs(b.off));
  const missing = state.players.filter((p) => guesses[p.id] === undefined);
  // Platz wie bei der Wertung: Gleich weit weg = gleicher Platz.
  const place = (off: number) => rows.filter((r) => Math.abs(r.off) < Math.abs(off)).length + 1;
  // Zahlenstrahl: Lösung in der Mitte, der weiteste Tipp am Rand.
  const spread = Math.max(1, ...rows.map((r) => Math.abs(r.off)));

  return (
    <div className="mt-6">
      <div className="animate-badge rounded-xl border-2 border-(--accent-border) bg-(--accent-soft) px-4 py-4 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
          {t.estimate.answer}
        </p>
        <p className="mt-1 break-words text-3xl font-extrabold tracking-tight text-(--accent) sm:text-4xl">
          {formatValue(answer, unit, language, t)}
        </p>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="relative mx-3 mt-8 h-8" aria-hidden="true">
            <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full bg-(--accent)" />
            {rows.map(({ player, off }) => (
              <span
                key={player.id}
                title={player.name}
                style={{ left: `${50 + (off / spread) * 48}%` }}
                className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-(--surface) dark:ring-(--bg-secondary) ${
                  game.closest?.includes(player.id)
                    ? "bg-(--success)"
                    : player.id === state.you
                      ? "bg-(--accent)"
                      : "bg-slate-400 dark:bg-slate-500"
                }`}
              />
            ))}
          </div>

          <ol className="mt-5 space-y-1.5">
            {rows.map(({ player, guess, off }, i) => {
              const best = game.closest?.includes(player.id);
              const exact = game.exact?.includes(player.id);
              return (
                <li
                  key={player.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={`animate-badge flex items-center gap-3 rounded-xl border px-3 py-2 text-sm sm:px-4 ${
                    best
                      ? "border-(--success) bg-(--success)/10"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <span className="w-5 shrink-0 font-mono text-xs text-(--text-secondary)">
                    {place(off)}.
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {player.name}
                    {player.id === state.you && (
                      <span className="ml-1.5 text-xs font-normal text-(--text-secondary)">
                        {t.you}
                      </span>
                    )}
                    {(exact || best) && (
                      <span className="ml-2 text-xs font-semibold text-(--success)">
                        {exact ? t.estimate.exact : t.estimate.closest}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right font-mono tabular-nums">
                    <span className="font-semibold">{formatValue(guess, unit, language, t)}</span>
                    <span className="ml-2 hidden text-xs text-(--text-secondary) sm:inline">
                      {formatOff(off, unit, language, t)}
                    </span>
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono font-semibold text-(--success)">
                    +{game.gains?.[player.id] ?? 0}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <p className="mt-6 text-center text-sm text-(--text-secondary)">{t.estimate.nobody}</p>
      )}

      {rows.length > 0 && missing.length > 0 && (
        <p className="mt-3 text-center text-xs text-(--text-secondary)">
          {missing.map((p) => p.name).join(" · ")}: {t.estimate.noAnswer}
        </p>
      )}
    </div>
  );
}

export default EstimateRound;
