import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { FiAlertCircle, FiCheck } from "react-icons/fi";
import {
  ALPHABET,
  MAX_ANSWER_LENGTH,
  STOP_GRACE_MS,
  startsWithLetter,
} from "../../../../shared/slf";
import type { Ack, RoomState, SlfView } from "../../../../shared/types";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { input } from "../../components/ui";
import { useNow } from "../../hooks/useNow";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";
import RoundFrame from "../music/RoundFrame";
import { categoryLabel } from "./categories";
import SlfDrawing from "./SlfDrawing";
import { slfSound } from "./sounds";

interface SlfRoundProps {
  state: RoomState;
  slf: SlfView;
  offset: number;
}

/** Unter der Navigationsleiste (64 px) plus etwas Luft gilt ein Feld als sichtbar. */
const VISIBLE_TOP = 88;
const VISIBLE_GAP = 24;

/** Abstand, in dem der Zwischenstand beim Tippen an den Server geht. */
const SYNC_MS = 300;

type Stage = "countdown" | "roll" | "reveal" | "static";

/**
 * Rundenstart: Countdown „3, 2, 1", dann rattert der Buchstabe im Zufallsmodus wie ein Glücksrad
 * durchs Alphabet (erst schnell, dann langsamer) und ploppt auf. Nach dem Aufsagen ploppt er
 * direkt nach dem Countdown auf. Die Zeitpunkte gibt der Server vor, damit alle gleichzeitig
 * starten. Wer später dazukommt oder neu lädt, sieht den Buchstaben einfach.
 */
function useRoundStart(slf: SlfView, offset: number) {
  const [stage, setStage] = useState<Stage>(() => {
    const now = Date.now() + offset;
    return !slf.letter || now >= slf.startsAt
      ? "static"
      : now < slf.countdownEndsAt
        ? "countdown"
        : "roll";
  });
  const [count, setCount] = useState(0);
  const [shown, setShown] = useState(slf.letter);

  // Vor dem Zeichnen, damit der Buchstabe nicht kurz aufblitzt.
  useLayoutEffect(() => {
    if (!slf.letter) return;
    const now = Date.now() + offset;
    const { countdownEndsAt, startsAt } = slf;
    if (now > startsAt + 1000) {
      setShown(slf.letter);
      setStage("static");
      return;
    }
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (now < countdownEndsAt) {
      setStage("countdown");
      setCount(Math.ceil((countdownEndsAt - now) / 1000));
    } else if (now < startsAt) {
      setStage("roll");
      setShown("?");
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (time: number, action: () => void) =>
      timers.push(setTimeout(action, Math.max(0, time - now)));

    // Countdown: jede volle Sekunde eine Zahl weniger.
    const seconds = Math.ceil((countdownEndsAt - now) / 1000);
    for (let n = seconds; n >= 1; n--) {
      at(countdownEndsAt - n * 1000, () => {
        setStage("countdown");
        setCount(n);
        slfSound("count");
      });
    }

    // Rattern bis zum Schreibstart – mit jedem Buchstaben etwas langsamer.
    if (startsAt > countdownEndsAt) {
      const total = startsAt - Math.max(now, countdownEndsAt);
      at(countdownEndsAt, () => {
        setStage("roll");
        if (calm) return setShown("?");
        let elapsed = 0;
        const spin = () => {
          setShown(ALPHABET[Math.floor(Math.random() * 26)]);
          slfSound("rollTick");
          const delay = 55 + 230 * Math.min(1, elapsed / total) ** 2;
          elapsed += delay;
          if (elapsed < total - 40) timers.push(setTimeout(spin, delay));
        };
        spin();
      });
    }

    at(startsAt, () => {
      setShown(slf.letter);
      setStage(calm ? "static" : "reveal");
      slfSound("reveal");
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slf.round, slf.letter]);

  return { stage, count, shown, ready: stage === "reveal" || stage === "static" };
}

/** Stadt Land Fluss: Buchstabe, ein Feld pro Kategorie und „Stopp!". */
function SlfRound({ state, slf, offset }: SlfRoundProps) {
  const { t } = useLanguage();
  const now = useNow(offset);
  const [answers, setAnswers] = useState<string[]>(() =>
    slf.categories.map((_, i) => slf.mine[i] ?? ""),
  );
  const [error, setError] = useState("");
  const latest = useRef(answers);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fields = useRef<(HTMLInputElement | null)[]>([]);

  const stopper = state.players.find((p) => p.id === slf.stoppedBy);
  const { stage, count, shown, ready } = useRoundStart(slf, offset);
  const locked = slf.stopAt !== undefined && now >= slf.stopAt;
  const complete = answers.every((a) => a.trim());

  const flush = () => {
    clearTimeout(timer.current);
    socket.emit("slf:answers", { answers: latest.current });
  };

  // Neue Runde: Felder leeren (bzw. nach Neuladen den gespeicherten Stand übernehmen).
  useEffect(() => {
    const fresh = slf.categories.map((_, i) => slf.mine[i] ?? "");
    latest.current = fresh;
    setAnswers(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slf.round, slf.letter]);

  // Los geht's: am Rechner gleich ins erste Feld.
  useEffect(() => {
    if (ready && window.matchMedia("(min-width: 1024px)").matches) {
      fields.current[0]?.focus({ preventScroll: true });
    }
  }, [ready, slf.round]);

  // Jemand hat Stopp gerufen: den letzten Stand sofort schicken, nicht erst nach der Pause.
  useEffect(() => {
    if (slf.stopAt) flush();
  }, [slf.stopAt]);

  // Stopp: Alarm, danach piept jede verbleibende Sekunde der Nachfrist (nicht nach dem Neuladen).
  useEffect(() => {
    if (!slf.stopAt) return;
    const left = slf.stopAt - (Date.now() + offset);
    if (left < STOP_GRACE_MS - 1500) return;
    slfSound("alarm");
    const beeps = Array.from({ length: Math.ceil(left / 1000) - 1 }, (_, k) =>
      setTimeout(() => slfSound("beep"), left - (k + 1) * 1000),
    );
    return () => beeps.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slf.stopAt]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (index: number, value: string) => {
    // Feld gerade ausgefüllt: kleines „Plopp" zum Häkchen.
    if (!answers[index]?.trim() && value.trim()) slfSound("fill");
    const next = answers.map((a, i) => (i === index ? value : a));
    latest.current = next;
    setAnswers(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SYNC_MS);
  };

  /**
   * Zu einem Feld springen. Gescrollt wird nur, wenn es nicht ganz zu sehen ist – unter der
   * Navigationsleiste, unten abgeschnitten oder am Handy hinter der Tastatur – und nur so weit wie nötig.
   */
  const jump = (index: number) => {
    const field = fields.current[index];
    if (!field) return;
    field.focus({ preventScroll: true });
    const box = field.getBoundingClientRect();
    const view = window.visualViewport;
    const top = (view?.offsetTop ?? 0) + VISIBLE_TOP;
    const bottom = (view?.offsetTop ?? 0) + (view?.height ?? window.innerHeight) - VISIBLE_GAP;
    const offset = box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0;
    if (offset) window.scrollBy({ top: offset, behavior: "smooth" });
  };

  /**
   * Enter: zum nächsten leeren Feld (nach dem letzten wieder oben). Ist alles ausgefüllt, geht es
   * der Reihe nach durch alle Felder – zum Korrigieren. Strg/⌘+Enter ruft „Stopp!".
   */
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      if (ready && complete && !slf.stopAt) stop();
      return;
    }
    const count = latest.current.length;
    const order = Array.from({ length: count - 1 }, (_, k) => (index + 1 + k) % count);
    const empty = order.find((i) => !latest.current[i]?.trim());
    jump(empty ?? (index + 1) % count);
  };

  const stop = () => {
    clearTimeout(timer.current);
    socket.emit("slf:stop", { answers: latest.current }, (res: Ack) =>
      setError(res.ok ? "" : res.error),
    );
  };

  const total = slf.categories.length;

  return (
    <RoomLayout
      state={state}
      players={
        <PlayerList
          state={state}
          title={t.points}
          showScore
          status={(p) => {
            if (slf.drawing?.reciterId === p.id) return t.slf.recite.counting;
            if (slf.drawing?.stopperId === p.id) return t.slf.recite.stopping;
            const filled = slf.filled[p.id] ?? 0;
            return filled >= total ? (
              <span className="font-semibold text-(--success)">✓</span>
            ) : (
              <span className="font-mono">
                {filled}/{total}
              </span>
            );
          }}
        />
      }
    >
      {slf.drawing ? (
        <SlfDrawing state={state} slf={slf} drawing={slf.drawing} />
      ) : (
        <RoundFrame
          title={t.slf.round(slf.round, slf.rounds)}
          endsAt={slf.stopAt ?? slf.endsAt}
          durationMs={slf.stopAt ? STOP_GRACE_MS : slf.durationMs}
          offset={offset}
          urgent={Boolean(slf.stopAt)}
        >
          <div className="mt-6 flex flex-col items-center">
            <p className="font-mono text-xs uppercase tracking-widest text-(--text-secondary)">
              {stage === "countdown" ? t.slf.getReady : t.slf.letter}
            </p>
            {stage === "countdown" ? (
              <p className="mt-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-(--accent) font-mono text-6xl font-bold text-(--accent)">
                <span key={count} className="animate-letter inline-block">
                  {count}
                </span>
              </p>
            ) : (
              <p
                key={`${slf.round}-${stage}`}
                className={`mt-2 flex h-24 w-24 items-center justify-center rounded-2xl bg-(--accent) font-mono text-6xl font-bold text-slate-950 shadow-lg ${
                  stage === "reveal" ? "animate-reveal" : ""
                }`}
              >
                {shown}
              </p>
            )}
          </div>

          {slf.stopAt && (
            <p
              role="status"
              className="animate-shake mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-500"
            >
              {t.slf.stopped(stopper?.name ?? "", slf.stoppedBy === state.you)}
            </p>
          )}

          {/* Übersicht: was ist schon ausgefüllt? Antippen springt zum Feld. */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {slf.categories.map((category, i) => {
              const done = Boolean(answers[i]?.trim());
              return (
                <button
                  key={`${i}-${done}`}
                  type="button"
                  onClick={() => jump(i)}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${done ? "animate-pop" : ""} ${
                    done
                      ? "border-(--accent-border) bg-(--accent-soft) text-(--accent)"
                      : "border-slate-300 text-(--text-secondary) hover:border-(--accent) dark:border-slate-700"
                  }`}
                >
                  {done && <FiCheck aria-hidden="true" />}
                  {categoryLabel(t, category)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {slf.categories.map((category, i) => {
              const value = answers[i] ?? "";
              const wrong = value.trim() !== "" && !startsWithLetter(value, slf.letter);
              const id = `slf-${i}`;
              return (
                <div key={`${slf.round}-${i}`}>
                  <label htmlFor={id} className="text-sm font-semibold">
                    {categoryLabel(t, category)}
                  </label>
                  <input
                    id={id}
                    ref={(el) => {
                      fields.current[i] = el;
                    }}
                    enterKeyHint="next"
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`${input} mt-1.5 py-2.5 ${wrong ? "border-amber-500!" : ""}`}
                    value={value}
                    maxLength={MAX_ANSWER_LENGTH}
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    disabled={locked || !ready}
                    placeholder={ready ? `${slf.letter}…` : ""}
                    onChange={(e) => change(i, e.target.value)}
                    onBlur={flush}
                  />
                  {wrong && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                      <FiAlertCircle aria-hidden="true" /> {t.slf.wrongLetter(slf.letter)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <Button
              className="w-full sm:w-auto sm:min-w-48"
              disabled={!ready || !complete || Boolean(slf.stopAt)}
              onClick={stop}
            >
              {t.slf.stop}
            </Button>
            {!slf.stopAt && !complete && (
              <p className="text-center text-xs text-(--text-secondary)">{t.slf.stopHint}</p>
            )}
            {/* Tastatur-Hinweis nur dort, wo es eine echte Tastatur gibt. */}
            {!slf.stopAt && (
              <p className="hidden text-center text-xs text-(--text-secondary) [@media(hover:hover)]:block">
                {t.slf.keys}
              </p>
            )}
            <ErrorText code={error} className="mt-1" />
          </div>
        </RoundFrame>
      )}
    </RoomLayout>
  );
}

export default SlfRound;
