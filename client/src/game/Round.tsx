import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiCheck, FiSkipForward } from "react-icons/fi";
import type { FeedItem, RoomState, RoundView } from "../../../shared/types";
import Button from "../components/Button";
import PlayerList from "../components/PlayerList";
import { card, eyebrow, input } from "../components/ui";
import { useNow } from "../hooks/useNow";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";

function Equalizer() {
  return (
    <div className="flex h-16 items-end justify-center gap-1.5" aria-hidden="true">
      {[0, 0.3, 0.15, 0.45, 0.1, 0.35, 0.2].map((delay, i) => (
        <span
          key={i}
          className="eq-bar h-full w-2 rounded-full bg-(--accent)"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

/** Eine Zeile "Titel"/"Interpret": verdeckte Buchstaben als Striche, Hinweise hervorgehoben. */
function Mask({ label, mask, done }: { label: string; mask: string; done: boolean }) {
  return (
    <div className="text-center">
      <p
        className={`flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-widest ${
          done ? "text-(--success)" : "text-(--text-secondary)"
        }`}
      >
        {done && <FiCheck aria-hidden="true" />}
        {label}
      </p>
      {done ? (
        <p className="mt-1 break-words text-lg font-semibold text-(--success)">{mask}</p>
      ) : (
        <p className="mt-1 break-words font-mono text-xl tracking-[0.3em] text-(--text-secondary)">
          {[...mask].map((char, i) => (
            <span key={i} className={/[_\s]/.test(char) ? "" : "font-semibold text-(--accent)"}>
              {char}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

type RoundTexts = ReturnType<typeof useLanguage>["t"]["round"];

function feedText(item: FeedItem, you: string, text: RoundTexts) {
  const me = item.playerId === you;
  switch (item.kind) {
    case "title":
      return (
        <span className="font-semibold text-(--success)">{text.gotTitle(item.name, me)}</span>
      );
    case "artist":
      return (
        <span className="font-semibold text-(--success)">{text.gotArtist(item.name, me)}</span>
      );
    case "close":
      return <span className="text-(--accent)">{text.close(item.name, me)}</span>;
    default:
      return (
        <>
          <span className="font-semibold">{item.name}:</span>{" "}
          <span className="text-(--text-secondary)">{item.text}</span>
        </>
      );
  }
}

interface RoundProps {
  state: RoomState;
  round: RoundView;
  offset: number;
}

function Round({ state, round, offset }: RoundProps) {
  const { t } = useLanguage();
  const [guess, setGuess] = useState("");
  const feedEnd = useRef<HTMLLIElement>(null);
  const now = useNow(offset);

  const me = state.players.find((p) => p.id === state.you);
  const done = Boolean(me?.gotTitle && me?.gotArtist);
  const chatOnly = done || round.youArePicker;
  const knowsTitle = round.youArePicker || Boolean(me?.gotTitle);
  const knowsArtist = round.youArePicker || Boolean(me?.gotArtist);
  const remaining = Math.max(0, round.endsAt - now);
  const fraction = Math.min(1, remaining / round.durationMs);

  useEffect(() => {
    feedEnd.current?.scrollIntoView({ block: "nearest" });
  }, [round.feed.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!guess.trim()) return;
    socket.emit("round:guess", { text: guess });
    setGuess("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className={`${card} overflow-hidden min-w-0 lg:col-span-2`}>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-(--accent) transition-[width] duration-100 ease-linear"
            style={{ width: `${fraction * 100}%` }}
          />
        </div>

        <div className="p-7">
          <div className="flex items-center justify-between">
            <p className={eyebrow}>
              {t.round.song(round.index + 1, round.total)}
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums" aria-live="off">
              {Math.ceil(remaining / 1000)}
              <span className="text-sm text-(--text-secondary)">s</span>
            </p>
          </div>

          <div className="mt-8">
            <Equalizer />
            <div className="mt-6 space-y-4">
              <Mask label={t.round.title} mask={round.titleMask} done={knowsTitle} />
              <Mask label={t.round.artist} mask={round.artistMask} done={knowsArtist} />
            </div>
          </div>

          {round.youArePicker ? (
            <p className="mt-8 rounded-xl border border-(--accent-border) bg-(--accent-soft) p-4 text-center text-sm">
              <span className="font-semibold">{t.round.yourSong}</span> {t.round.yourSongRest}
            </p>
          ) : (
            <div className="mt-6" />
          )}

          {/* Bleibt immer aktiv: nach dem Erraten (und beim eigenen Song) dient das Feld als Chat. */}
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              autoFocus
              aria-label={chatOnly ? t.round.send : t.round.input}
              className={input}
              value={guess}
              maxLength={80}
              autoComplete="off"
              placeholder={
                round.youArePicker
                  ? t.round.placeholderPicker
                  : done
                    ? t.round.placeholderChat
                    : me?.gotTitle
                      ? t.round.placeholderArtist
                      : t.round.placeholderGuess
              }
              onChange={(e) => setGuess(e.target.value)}
            />
            <Button type="submit" variant={chatOnly ? "secondary" : "primary"}>
              {chatOnly ? t.round.send : t.round.guess}
            </Button>
          </form>

          <ul
            className="mt-6 h-40 space-y-1.5 overflow-y-auto rounded-xl bg-(--bg-primary) p-4 text-sm dark:bg-black/30"
            aria-live="polite"
          >
            {round.feed.length === 0 && (
              <li className="text-(--text-secondary)">{t.round.empty}</li>
            )}
            {round.feed.map((item) => (
              <li key={item.id}>{feedText(item, state.you, t.round)}</li>
            ))}
            <li ref={feedEnd} />
          </ul>

          {state.hostId === state.you && (
            <div className="mt-4 flex justify-end">
              <Button size="small" variant="secondary" onClick={() => socket.emit("round:skip")}>
                <FiSkipForward aria-hidden="true" /> {t.round.skip}
              </Button>
            </div>
          )}
        </div>
      </section>

      <PlayerList
        state={state}
        title={t.points}
        showScore
        status={(p) =>
          (p.gotTitle || p.gotArtist) && (
            <span className="font-semibold text-(--success)">
              {p.gotTitle && p.gotArtist ? "✓✓" : "✓"}
            </span>
          )
        }
      />
    </div>
  );
}

export default Round;
