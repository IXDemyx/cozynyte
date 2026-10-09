import { Fragment, useEffect, useState } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import type { RoomState, RoundView, TimelineCard } from "../../../../shared/types";
import Button from "../../components/Button";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { eyebrow } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";
import Equalizer from "./Equalizer";
import RoundFrame from "./RoundFrame";
import SkipButton from "./SkipButton";

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
      {item.artwork && (
        <img src={item.artwork} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
      )}
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
      <span className="w-14 shrink-0 text-center font-mono text-lg font-semibold text-(--accent)">
        ?
      </span>
      <span className="text-sm font-semibold text-(--accent)">{label}</span>
    </div>
  );
}

function TimelineRound({ state, round, offset }: TimelineRoundProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);

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
    <RoomLayout
      state={state}
      players={
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
      }
    >
      <RoundFrame
        title={
          <>
            Song {round.index + 1}
            {state.settings.timelineGoal > 0 &&
              ` · ${t.timeline.goal(state.settings.timelineGoal)}`}
          </>
        }
        endsAt={round.endsAt}
        durationMs={round.durationMs}
        offset={offset}
      >
        <div className="mt-6 text-center">
          <Equalizer />
          {round.song ? (
            <>
              <p className="mt-5 break-words text-xl font-bold tracking-tight">
                {round.song.title}
              </p>
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

        <SkipButton isHost={state.hostId === state.you} />
      </RoundFrame>
    </RoomLayout>
  );
}

export default TimelineRound;
