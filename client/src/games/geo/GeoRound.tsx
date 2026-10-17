import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiCheck, FiCornerDownLeft, FiX } from "react-icons/fi";
import { LuSplit } from "react-icons/lu";
import { COUNTRY_BY_CODE, type Country } from "../../../../shared/countries";
import type { Ack, GeoView, RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import VolumeControl from "../../components/VolumeControl";
import { card, eyebrow, input } from "../../components/ui";
import { useNow } from "../../hooks/useNow";
import { useLanguage } from "../../lib/i18n";
import { playEffect } from "../../lib/sounds";
import { socket } from "../../lib/socket";
import { useGeoSounds } from "./useGeoSounds";

interface GeoRoundProps {
  state: RoomState;
  geo: GeoView;
  offset: number;
}

type Feedback = "" | "wrong" | "close";

/** Länder-Quiz: Bild bzw. Frage oben, darunter Antwortfeld oder vier Antworten, dann Auflösung. */
function GeoRound({ state, geo, offset }: GeoRoundProps) {
  const { t, language } = useLanguage();
  const now = useNow(offset);
  useGeoSounds(state, geo, offset);

  const remaining = Math.max(0, geo.endsAt - now);
  const fraction = geo.durationMs > 0 ? Math.min(1, remaining / geo.durationMs) : 0;
  const question = geo.stage === "question";
  const urgent = question && remaining < 5_000;
  const typing = state.settings.geoAnswer === "type";

  return (
    <RoomLayout
      state={state}
      players={
        <PlayerList
          state={state}
          title={t.points}
          showScore
          status={(p) =>
            geo.stage === "reveal" ? (
              geo.gains?.[p.id] ? (
                <span className="font-mono font-semibold text-(--success)">+{geo.gains[p.id]}</span>
              ) : (
                <FiX aria-label="✗" className="text-(--text-secondary)" />
              )
            ) : geo.answered.includes(p.id) ? (
              <FiCheck
                aria-label={t.geo.answered}
                className={typing ? "text-(--success)" : "text-(--accent)"}
              />
            ) : null
          }
        />
      }
    >
      <section className={`${card} flex min-w-0 flex-col overflow-hidden xl:flex-1`}>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full transition-[width] duration-100 ease-linear ${
              urgent ? "bg-red-500" : geo.stage === "reveal" ? "bg-(--success)" : "bg-(--accent)"
            }`}
            style={{ width: `${(question ? fraction : geo.stage === "reveal" ? 1 : 0) * 100}%` }}
          />
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className={eyebrow}>{t.geo.question(geo.index, geo.total)}</p>
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

          {geo.stage === "countdown" ? (
            <Countdown seconds={Math.max(1, Math.ceil(remaining / 1000))} />
          ) : (
            <Question
              key={geo.qid}
              state={state}
              geo={geo}
              language={language}
              typing={typing}
              t={t}
            />
          )}
        </div>
      </section>
    </RoomLayout>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary)">
        {t.geo.ready}
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

type Dict = ReturnType<typeof useLanguage>["t"];

function Question({
  state,
  geo,
  language,
  typing,
  t,
}: {
  state: RoomState;
  geo: GeoView;
  language: "de" | "en";
  typing: boolean;
  t: Dict;
}) {
  const reveal = geo.stage === "reveal";
  const image = (type: "flag" | "outline") => `/quiz-img/${state.code}/${geo.qid}/${type}.svg`;
  const asked = geo.asked ? COUNTRY_BY_CODE.get(geo.asked) : undefined;
  const answer = geo.answer ? COUNTRY_BY_CODE.get(geo.answer) : undefined;
  const capitalQuestion = geo.kind === "capital";
  const label = (country: Country | undefined) =>
    country
      ? capitalQuestion
        ? (country.capital?.[language] ?? country[language])
        : country[language]
      : "";

  return (
    <div className="animate-in mt-5 flex flex-1 flex-col">
      <h2 className="text-center text-lg font-bold tracking-tight sm:text-xl">
        {t.geo.prompt[geo.kind]}
      </h2>

      {/* Das Bild bzw. bei der Hauptstadt-Frage das Land (mit seiner Flagge). */}
      <div className="mt-5 flex justify-center">
        {capitalQuestion && asked ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={image("flag")}
              alt=""
              className="h-20 rounded-md shadow-md ring-1 ring-black/10 sm:h-24"
            />
            <p className="text-center text-3xl font-extrabold tracking-tight text-(--accent) sm:text-4xl">
              {asked[language]}
            </p>
          </div>
        ) : geo.kind === "flag" ? (
          <img
            src={image("flag")}
            alt={t.geo.prompt.flag}
            className={`w-auto max-w-full rounded-lg shadow-lg ring-1 ring-black/10 transition-[max-height] duration-300 ${
              reveal
                ? "max-h-36 sm:max-h-44"
                : "max-h-48 sm:max-h-64 xl:max-h-[min(18rem,calc(100dvh-30rem))]"
            }`}
          />
        ) : (
          <img
            src={image("outline")}
            alt={t.geo.prompt.outline}
            className={`w-full max-w-md object-contain drop-shadow-md transition-[height] duration-300 ${
              reveal ? "h-36 sm:h-44" : "h-48 sm:h-64 xl:h-[min(18rem,calc(100dvh-30rem))]"
            }`}
          />
        )}
      </div>

      <Hints geo={geo} language={language} t={t} />

      {geo.options ? (
        <Choices state={state} geo={geo} label={(code) => label(COUNTRY_BY_CODE.get(code))} t={t} />
      ) : reveal ? null : (
        <TypeAnswer geo={geo} answerLabel={label(answer)} t={t} />
      )}

      {reveal && answer && (
        <Solution
          state={state}
          geo={geo}
          country={answer}
          language={language}
          flag={geo.kind === "outline" ? image("flag") : undefined}
          t={t}
        />
      )}
    </div>
  );
}

/** Hinweise beim Tippen: Kontinent und Anfangsbuchstaben (in der eigenen Sprache). */
function Hints({ geo, language, t }: { geo: GeoView; language: "de" | "en"; t: Dict }) {
  if (geo.stage !== "question") return null;
  const mask = geo.masks?.[language];
  if (!geo.continent && !mask) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
      {geo.continent && (
        <span className="animate-badge rounded-full border border-(--accent-border) bg-(--accent-soft) px-3 py-1">
          <span className="text-(--text-secondary)">{t.geo.continentHint}: </span>
          <strong className="text-(--accent)">{t.geo.continents[geo.continent]}</strong>
        </span>
      )}
      {mask && (
        <span
          key={mask}
          className="animate-badge rounded-full border border-(--accent-border) bg-(--accent-soft) px-3 py-1"
        >
          <span className="text-(--text-secondary)">{t.geo.letterHint}: </span>
          <strong className="font-mono tracking-[0.2em] text-(--accent)">{mask}</strong>
        </span>
      )}
    </div>
  );
}

/** Vier Antworten zur Auswahl. In der Auflösung grün = richtig, rot = die eigene falsche. */
function Choices({
  state,
  geo,
  label,
  t,
}: {
  state: RoomState;
  geo: GeoView;
  label: (code: string) => string;
  t: Dict;
}) {
  const reveal = geo.stage === "reveal";
  const chosen = geo.yourChoice;
  const choose = (code: string) => {
    if (chosen || reveal) return;
    playEffect("hold");
    socket.emit("geo:choose", { qid: geo.qid, code });
  };
  // 50:50-Joker: zwei falsche Antworten verschwinden – einmal pro Frage, solange welche übrig sind.
  const allowed = state.settings.geoJokers > 0;
  const used = Boolean(geo.removed);
  const left = geo.jokers ?? 0;
  const joker = () => {
    if (used || chosen || reveal || left <= 0) return;
    playEffect("release");
    socket.emit("geo:joker", { qid: geo.qid });
  };
  // Wer hat in der Auflösung was gewählt – als kleine Namensliste unter der Antwort.
  const pickedBy = (code: string) =>
    reveal ? state.players.filter((p) => geo.choices?.[p.id] === code).map((p) => p.name) : [];

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
        {geo.options!.map((code, i) => {
          const removed = geo.removed?.includes(code);
          const right = reveal && code === geo.answer;
          const wrongPick = reveal && code === chosen && code !== geo.answer;
          const names = pickedBy(code);
          return (
            <button
              key={code}
              type="button"
              disabled={Boolean(chosen) || reveal || removed}
              onClick={() => choose(code)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`animate-badge flex min-h-14 flex-col items-center justify-center rounded-xl border-2 px-2 py-2.5 text-center text-sm font-bold transition sm:px-4 sm:py-3 sm:text-lg ${
                right
                  ? "border-(--success) bg-(--success)/15 text-(--success)"
                  : wrongPick
                    ? "border-red-500 bg-red-500/10 text-red-500"
                    : code === chosen
                      ? "border-(--accent) bg-(--accent) text-(--on-accent)"
                      : removed
                        ? "border-slate-200 text-(--text-secondary) line-through opacity-40 dark:border-slate-800"
                        : "border-slate-300 enabled:hover:-translate-y-0.5 enabled:hover:border-(--accent) enabled:hover:text-(--accent) enabled:active:scale-[0.98] dark:border-slate-700"
              } disabled:cursor-default`}
            >
              <span className="break-words">{label(code)}</span>
              {names.length > 0 && (
                <span className="mt-1 text-xs font-medium opacity-80">{names.join(" · ")}</span>
              )}
            </button>
          );
        })}
      </div>
      {chosen && !reveal ? (
        <p className="mt-4 text-center text-sm font-semibold text-(--accent)">{t.geo.chosen}</p>
      ) : (
        allowed &&
        !reveal && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={joker}
              disabled={used || left <= 0}
              className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                used
                  ? "border-amber-500 bg-amber-500/15 text-amber-500"
                  : "border-amber-500/70 text-amber-500 enabled:hover:-translate-y-0.5 enabled:hover:bg-amber-500 enabled:hover:text-slate-950 enabled:active:scale-95 disabled:opacity-40"
              } disabled:cursor-default`}
            >
              <LuSplit aria-hidden="true" />
              {used ? t.geo.fiftyFifty : t.geo.joker}
              {!used && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-xs">
                  {t.geo.jokerLeft(left)}
                </span>
              )}
            </button>
          </div>
        )
      )}
    </>
  );
}

/** Tippen: Eingabe mit Rückmeldung (falsch/knapp) – nach einem Treffer die Lösung in Grün. */
function TypeAnswer({ geo, answerLabel, t }: { geo: GeoView; answerLabel: string; t: Dict }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const field = useRef<HTMLInputElement>(null);
  const capital = geo.kind === "capital";

  // Am großen Bildschirm direkt ins Feld – am Handy nicht (die Tastatur würde das Bild verdecken).
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      field.current?.focus({ preventScroll: true });
    }
  }, []);

  if (geo.youGotIt) {
    return (
      <div className="animate-badge mt-6 rounded-xl border-2 border-(--success)/50 bg-(--success)/10 px-4 py-4 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-(--success)">
          ✓ {t.geo.rightLabel}
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-(--success) sm:text-3xl">
          {answerLabel}
        </p>
        <p className="mt-1 text-sm text-(--text-secondary)">{t.geo.gotIt}</p>
      </div>
    );
  }

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    socket.emit(
      "geo:answer",
      { qid: geo.qid, text },
      (res: Ack<{ result: "correct" | "close" | "wrong" | "invalid" }>) => {
        if (!res.ok) return setError(res.error);
        setError("");
        if (res.result === "wrong" || res.result === "close") {
          setFeedback(res.result);
          setShake((n) => n + 1);
          playEffect("undo");
          field.current?.select();
        } else {
          setFeedback("");
          setText("");
        }
      },
    );
  };

  return (
    <form onSubmit={send} className="mx-auto mt-6 w-full max-w-lg">
      <div key={shake} className={`flex gap-2 ${shake ? "animate-shake" : ""}`}>
        <input
          ref={field}
          aria-label={capital ? t.geo.placeholderCapital : t.geo.placeholderCountry}
          className={`${input} text-base ${
            feedback === "wrong"
              ? "border-red-500"
              : feedback === "close"
                ? "border-amber-500"
                : "border-(--accent)"
          }`}
          value={text}
          maxLength={60}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder={capital ? t.geo.placeholderCapital : t.geo.placeholderCountry}
          onChange={(e) => {
            setText(e.target.value);
            setFeedback("");
          }}
        />
        <Button type="submit" disabled={!text.trim()} className="shrink-0">
          <span className="hidden sm:inline">{t.geo.send}</span>
          <FiCornerDownLeft aria-label={t.geo.send} className="sm:hidden" />
        </Button>
      </div>
      <p
        className={`mt-2 text-center text-sm ${
          feedback === "wrong"
            ? "font-semibold text-red-500"
            : feedback === "close"
              ? "font-semibold text-amber-500"
              : "text-(--text-secondary)"
        }`}
      >
        {feedback === "wrong" ? t.geo.wrong : feedback === "close" ? t.geo.close : t.geo.typeHint}
      </p>
      <ErrorText code={error} className="mt-2 text-center" />
    </form>
  );
}

/** Auflösung: Land (mit Flagge), Hauptstadt, Kontinent – und wie es für einen selbst lief. */
function Solution({
  state,
  geo,
  country,
  language,
  flag,
  t,
}: {
  state: RoomState;
  geo: GeoView;
  country: Country;
  language: "de" | "en";
  flag?: string;
  t: Dict;
}) {
  const right = geo.correct?.includes(state.you);
  const answered = Boolean(geo.yourChoice) || right;
  const winners = (geo.correct ?? [])
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean);
  const capitalQuestion = geo.kind === "capital";

  return (
    <div className="animate-in mt-6 rounded-xl border-2 border-(--accent-border) bg-(--accent-soft) px-4 py-4 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
        {t.geo.solution}
      </p>
      <div className="mt-1 flex items-center justify-center gap-3">
        {flag && <img src={flag} alt="" className="h-8 rounded-sm shadow ring-1 ring-black/10" />}
        <p
          key={country.code}
          className="animate-badge break-words text-2xl font-extrabold tracking-tight text-(--accent) sm:text-3xl"
        >
          {capitalQuestion ? (country.capital?.[language] ?? "") : country[language]}
        </p>
      </div>
      <p className="mt-1 text-sm text-(--text-secondary)">
        {capitalQuestion
          ? t.geo.capitalOf(country[language])
          : [
              country.capital && `${t.geo.capital}: ${country.capital[language]}`,
              t.geo.continents[country.continent],
            ]
              .filter(Boolean)
              .join(" · ")}
      </p>
      <p
        className={`mt-3 text-sm font-semibold ${
          right ? "text-(--success)" : answered ? "text-red-500" : "text-(--text-secondary)"
        }`}
      >
        {right ? t.geo.youRight : answered ? t.geo.youWrong : t.geo.noAnswer}
        {winners.length > 0 ? (
          <span className="font-normal text-(--text-secondary)"> · ✓ {winners.join(" · ")}</span>
        ) : (
          <span className="font-normal text-(--text-secondary)"> · {t.geo.nobody}</span>
        )}
      </p>
    </div>
  );
}

export default GeoRound;
