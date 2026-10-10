import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FiCheck } from "react-icons/fi";
import { MAX_WORD_LENGTH } from "../../../../shared/draw";
import type { Ack, RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow, input } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

/** So lange nach dem letzten Tastendruck, bis die Begriffe gespeichert werden. */
const SAVE_MS = 400;

/**
 * Montagsmaler „Eigene Runde“: Jeder reicht Begriffe zum Motto ein. Die anderen sehen nur,
 * wie weit jeder ist. Der Host startet, wenn alle fertig sind (oder trotzdem).
 */
function DrawCollect({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const count = state.settings.drawWordsPerPlayer;
  const [words, setWords] = useState<string[]>(() =>
    Array.from({ length: count }, (_, i) => state.myWords?.[i] ?? ""),
  );
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fields = useRef<(HTMLInputElement | null)[]>([]);
  const isHost = state.hostId === state.you;

  const players = state.players.filter((p) => p.connected);
  const allDone = players.every((p) => p.picked >= count);
  const total = players.reduce((sum, p) => sum + p.picked, 0);
  const mine = words.filter((w) => w.trim()).length;

  useEffect(() => () => clearTimeout(timer.current), []);

  // Am großen Bildschirm gleich ins erste Feld.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      fields.current[0]?.focus({ preventScroll: true });
    }
  }, []);

  const change = (index: number, value: string) => {
    const next = words.map((w, i) => (i === index ? value : w));
    setWords(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => socket.emit("draw:words", { words: next.filter((w) => w.trim()) }),
      SAVE_MS,
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    fields.current[(index + 1) % count]?.focus();
  };

  const begin = () => socket.emit("draw:begin", (res: Ack) => setError(res.ok ? "" : res.error));

  return (
    <RoomLayout
      state={state}
      players={
        <PlayerList
          state={state}
          status={(p) =>
            p.picked >= count ? (
              <span className="flex items-center gap-1 font-semibold text-(--success)">
                <FiCheck aria-hidden="true" />
                <span className="sr-only">{t.draw.done}</span>
              </span>
            ) : (
              <span className="font-mono">
                {p.picked}/{count}
              </span>
            )
          }
        />
      }
    >
      <section className={`${card} animate-in min-w-0 p-7 xl:flex-1`}>
        <p className={eyebrow}>
          {t.games.draw} · {t.draw.collect}
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
          {t.draw.theme}
        </p>
        <h1
          className={`mt-1 text-3xl font-extrabold tracking-tight ${
            state.settings.theme ? "text-(--accent)" : "text-(--text-secondary)"
          }`}
        >
          {state.settings.theme || t.draw.noTheme}
        </h1>
        <p className="mt-3 text-sm text-(--text-secondary)">{t.draw.collectHint(count)}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {words.map((word, i) => (
            <div key={i} className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-(--text-secondary)">
                {i + 1}
              </span>
              <input
                ref={(el) => {
                  fields.current[i] = el;
                }}
                aria-label={t.draw.wordPlaceholder(i + 1)}
                className={`${input} py-2.5 pl-8 ${word.trim() ? "border-(--accent-border)" : ""}`}
                value={word}
                maxLength={MAX_WORD_LENGTH}
                autoComplete="off"
                enterKeyHint="next"
                placeholder={t.draw.wordPlaceholder(i + 1)}
                onChange={(e) => change(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(e, i)}
              />
            </div>
          ))}
        </div>
        <p
          className={`mt-3 text-sm font-semibold ${
            mine >= count ? "text-(--success)" : "text-(--text-secondary)"
          }`}
        >
          {mine >= count ? `✓ ${t.draw.done}` : `${mine}/${count}`}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-(--accent-soft)">
          {isHost ? (
            allDone ? (
              <Button onClick={begin}>{t.lobby.start}</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={begin} disabled={total < 3}>
                  {t.draw.startAnyway}
                </Button>
                <p className="text-sm text-(--text-secondary)">{t.draw.waitingOthers}</p>
              </>
            )
          ) : (
            <p className="text-sm text-(--text-secondary)">
              {allDone ? t.lobby.waitingHost : t.draw.waitingHostCollect}
            </p>
          )}
        </div>
        <ErrorText code={error} className="mt-3" />
      </section>
    </RoomLayout>
  );
}

export default DrawCollect;
