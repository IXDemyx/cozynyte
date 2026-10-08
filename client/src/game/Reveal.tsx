import type { RevealView, RoomState } from "../../../shared/types";
import Button from "../components/Button";
import PlayerList from "../components/PlayerList";
import { card, eyebrow } from "../components/ui";
import { useNow } from "../hooks/useNow";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";

interface RevealProps {
  state: RoomState;
  reveal: RevealView;
  offset: number;
}

function Reveal({ state, reveal, offset }: RevealProps) {
  const { t } = useLanguage();
  const now = useNow(offset);
  const seconds = Math.max(0, Math.ceil((reveal.nextAt - now) / 1000));
  const picker = state.players.find((p) => p.id === reveal.pickerId);
  const isHost = state.hostId === state.you;
  const nextLabel = reveal.isLast ? t.reveal.toFinal : t.reveal.next;

  return (
    <div className="animate-in grid gap-6 lg:grid-cols-3">
      <section className={`${card} p-7 min-w-0 lg:col-span-2`}>
        <p className={eyebrow}>
          {state.game === "timeline"
            ? t.reveal.eyebrowShort(reveal.index + 1)
            : t.reveal.eyebrow(reveal.index + 1, reveal.total)}
        </p>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <img
            src={reveal.track.artwork}
            alt={t.reveal.cover(reveal.track.album || reveal.track.title)}
            className="h-40 w-40 shrink-0 rounded-2xl object-cover shadow-xl"
          />
          <div className="min-w-0 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight">{reveal.track.title}</h1>
            <p className="mt-1 text-lg text-(--accent)">{reveal.track.artist}</p>
            {reveal.track.album && (
              <p className="mt-1 text-sm text-(--text-secondary)">{reveal.track.album}</p>
            )}
            {(state.game === "year" || state.game === "timeline") && reveal.track.year && (
              <p className="mt-4 font-mono text-5xl font-semibold text-(--accent)">
                {reveal.track.year}
              </p>
            )}
            <p className="mt-5 text-sm text-(--text-secondary)">
              {t.reveal.pickedBy}{" "}
              <span className="font-semibold text-(--text-primary)">
                {picker ? picker.name : t.reveal.someone}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4 border-t border-slate-200 pt-6 dark:border-(--accent-soft)">
          {isHost && (
            <Button size="small" onClick={() => socket.emit("round:next")}>
              {nextLabel}
            </Button>
          )}
          <p className="font-mono text-sm text-(--text-secondary)">
            {isHost ? t.reveal.auto(seconds) : t.reveal.countdown(nextLabel, seconds)}
          </p>
        </div>
      </section>

      <PlayerList
        state={state}
        title={state.game === "timeline" ? t.timeline.cards : t.points}
        showScore
        status={(p) =>
          <span className="flex items-center gap-2 font-mono">
            {reveal.placements?.[p.id] && (
              <span className={reveal.placements[p.id].correct ? "text-(--success)" : "text-red-500"}>
                {reveal.placements[p.id].correct ? "✓" : "✗"}
              </span>
            )}
            {reveal.yearGuesses?.[p.id] !== undefined && <span>{reveal.yearGuesses[p.id]}</span>}
            {reveal.gains[p.id] ? (
              <span className="font-semibold text-(--success)">+{reveal.gains[p.id]}</span>
            ) : null}
          </span>
        }
      />
    </div>
  );
}

export default Reveal;
