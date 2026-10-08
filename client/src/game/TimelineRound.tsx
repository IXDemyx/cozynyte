import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { FiArrowDown, FiArrowUp, FiSkipForward } from "react-icons/fi";
import type { RoomState, RoundView, TimelineCard } from "../../../shared/types";
import Button from "../components/Button";
import PlayerList from "../components/PlayerList";
import { card, eyebrow, input } from "../components/ui";
import { useNow } from "../hooks/useNow";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";
import { Equalizer, FeedLine } from "./shared";

interface TimelineRoundProps {
  state: RoomState;
  round: RoundView;
  offset: number;
}

function CardRow({ item }: { item: TimelineCard }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-(--bg-primary) p-2 dark:border-slate-800">
      <span className="w-14 shrink-0 text-center font-mono text-lg font-semibold text-(--accent)">
        {item.year}
      </span>
      {item.artwork && <img src={item.artwork} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{item.title}</p>
        <p className="truncate text-xs text-(--text-secondary)">{item.artist}</p>
      </div>
    </div>
  );
}

function GuessRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-(--accent) bg-(--accent-soft) p-2">
      <span className="w-14 shrink-0 text-center font-mono text-lg font-semibold text-(--accent)">?</span>
      <span className="text-sm font-semibold text-(--accent)">{label}</span>
    </div>
  );
}

function TimelineRound({ state, round, offset }: TimelineRoundProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const feedEnd = useRef<HTMLLIElement>(null);
  const now = useNow(offset);

  const remaining = Math.max(0, round.endsAt - now);
  const fraction = Math.min(1, remaining / round.durationMs);
  const turns = state.settings.timelineMode === "turns";
  const active = state.players.find((p) => p.id === round.activeId);

  // Reihum sehen alle die Zeitleiste des Spielers am Zug, sonst jeder seine eigene.
  const ownerId = turns && round.activeId ? round.activeId : state.you;
  const owner = state.players.find((p) => p.id === ownerId);
  const cards = state.timelines?.[ownerId] ?? [];
  const placedAt = ownerId === state.you ? round.yourPosition : round.activePosition;
  const interactive = Boolean(round.canPlace);

  // Neue Runde: Auswahl zurücksetzen.
  useEffect(() => setSelected(null), [round.index]);

  useEffect(() => {
    feedEnd.current?.scrollIntoView({ block: "nearest" });
  }, [round.feed.length]);

  // Beschriftung jeder Lücke, damit klar ist, wo älter und neuer liegt.
  const gapLabel = (gap: number) => {
    const before = cards[gap - 1]?.year;
    const after = cards[gap]?.year;
    if (before === undefined && after === undefined) return t.timeline.gap;
    if (before === undefined) return t.timeline.before(after!);
    if (after === undefined) return t.timeline.after(before);
    return t.timeline.between(before, after);
  };

  const place = () => {
    if (selected === null) return;
    socket.emit("round:place", { position: selected });
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    socket.emit("round:guess", { text: message });
    setMessage("");
  };

  const status = round.youArePicker
    ? null
    : turns && !interactive && placedAt === undefined && active && active.id !== state.you
      ? t.timeline.othersTurn(active.name)
      : interactive
        ? turns
          ? t.timeline.yourTurn
          : t.timeline.question
        : round.yourPosition !== undefined
          ? t.timeline.placed
          : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className={`${card} min-w-0 overflow-hidden lg:col-span-2`}>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-(--accent) transition-[width] duration-100 ease-linear"
            style={{ width: `${fraction * 100}%` }}
          />
        </div>

        <div className="p-7">
          <div className="flex items-center justify-between gap-4">
            <p className={eyebrow}>
              Song {round.index + 1} · {t.timeline.goal(state.settings.timelineGoal)}
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {Math.ceil(remaining / 1000)}
              <span className="text-sm text-(--text-secondary)">s</span>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Equalizer />
            {round.song ? (
              <>
                <p className="mt-5 break-words text-xl font-bold tracking-tight">{round.song.title}</p>
                <p className="mt-1 text-(--accent)">{round.song.artist}</p>
              </>
            ) : (
              <p className="mt-5 font-mono text-xs uppercase tracking-widest text-(--text-secondary)">
                {t.year.hidden}
              </p>
            )}
          </div>

          {round.youArePicker && (
            <p className="mt-6 rounded-xl border border-(--accent-border) bg-(--accent-soft) p-4 text-center text-sm">
              <span className="font-semibold">{t.round.yourSong}</span>{" "}
              {t.timeline.yourSongRest(round.answerYear)}
            </p>
          )}
          {status && <p className="mt-6 text-center font-semibold">{status}</p>}

          <div className="mt-5">
            <p className={eyebrow}>
              {ownerId === state.you ? t.timeline.yours : t.timeline.timelineOf(owner?.name ?? "")}
            </p>
            {cards.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-(--text-secondary)">
                <FiArrowUp aria-hidden="true" /> {t.timeline.older}
              </p>
            )}
            <div className="mt-2 space-y-1.5">
              {Array.from({ length: cards.length + 1 }, (_, gap) => (
                <Fragment key={gap}>
                  {placedAt === gap ? (
                    <GuessRow label={t.timeline.choice} />
                  ) : interactive ? (
                    <button
                      type="button"
                      onClick={() => setSelected(gap)}
                      aria-pressed={selected === gap}
                      className={`flex w-full items-center justify-center rounded-lg border-2 border-dashed text-xs font-semibold transition ${
                        selected === gap
                          ? "h-12 border-(--accent) bg-(--accent-soft) text-(--accent)"
                          : "h-8 border-slate-300 text-(--text-secondary) hover:border-(--accent) hover:text-(--accent) dark:border-slate-700"
                      }`}
                    >
                      {selected === gap ? `? · ${gapLabel(gap)}` : gapLabel(gap)}
                    </button>
                  ) : null}
                  {gap < cards.length && <CardRow item={cards[gap]} />}
                </Fragment>
              ))}
            </div>
            {cards.length > 0 && (
              <p className="mt-2 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-(--text-secondary)">
                <FiArrowDown aria-hidden="true" /> {t.timeline.newer}
              </p>
            )}
            {interactive && (
              <Button className="mt-4 w-full" disabled={selected === null} onClick={place}>
                {t.timeline.confirm}
              </Button>
            )}
          </div>

          <ul
            className="mt-6 h-28 space-y-1.5 overflow-y-auto rounded-xl bg-(--bg-primary) p-4 text-sm dark:bg-black/30"
            aria-live="polite"
          >
            {round.feed.map((item) => (
              <li key={item.id}>
                <FeedLine item={item} you={state.you} />
              </li>
            ))}
            <li ref={feedEnd} />
          </ul>
          <form onSubmit={sendMessage} className="mt-3 flex gap-2">
            <input
              aria-label={t.round.send}
              className={input}
              value={message}
              maxLength={80}
              autoComplete="off"
              placeholder={t.year.chat}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              {t.round.send}
            </Button>
          </form>

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
        title={t.timeline.cards}
        showScore
        status={(p) =>
          turns && p.id === round.activeId ? (
            <span className="font-semibold text-(--accent)">●</span>
          ) : (
            p.answered && <span className="font-semibold text-(--success)">✓</span>
          )
        }
      />
    </div>
  );
}

export default TimelineRound;
