import { useState, type FormEvent } from "react";
import { FiCheck } from "react-icons/fi";
import type { RoomState, RoundView } from "../../../../shared/types";
import Button from "../../components/Button";
import PlayerList from "../../components/PlayerList";
import { input } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";
import { ChatFeed, ChatInput } from "./Chat";
import Equalizer from "./Equalizer";
import RoundFrame from "./RoundFrame";
import SkipButton from "./SkipButton";

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear();

interface YearRoundProps {
  state: RoomState;
  round: RoundView;
  offset: number;
}

function YearRound({ state, round, offset }: YearRoundProps) {
  const { t } = useLanguage();
  const [year, setYear] = useState(2000);

  const locked = round.yourYear !== undefined;

  const submitYear = (event: FormEvent) => {
    event.preventDefault();
    socket.emit("round:year", { year });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <RoundFrame
        title={t.round.song(round.index + 1, round.total)}
        endsAt={round.endsAt}
        durationMs={round.durationMs}
        offset={offset}
      >
        <div className="mt-8 text-center">
          <Equalizer />
          {round.song ? (
            <>
              <p className="mt-6 break-words text-xl font-bold tracking-tight">
                {round.song.title}
              </p>
              <p className="mt-1 text-(--accent)">{round.song.artist}</p>
            </>
          ) : (
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-(--text-secondary)">
              {t.year.hidden}
            </p>
          )}
        </div>

        {round.youArePicker ? (
          <p className="mt-8 rounded-xl border border-(--accent-border) bg-(--accent-soft) p-4 text-center text-sm">
            <span className="font-semibold">{t.round.yourSong}</span>{" "}
            {t.year.yourSongRest(round.answerYear)}
          </p>
        ) : locked ? (
          <div className="mt-8 rounded-xl border border-(--success) p-4 text-center">
            <p className="flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-widest text-(--success)">
              <FiCheck aria-hidden="true" /> {t.year.yourGuess}
            </p>
            <p className="mt-1 font-mono text-4xl font-semibold">{round.yourYear}</p>
            <p className="mt-1 text-sm text-(--text-secondary)">{t.year.waiting}</p>
          </div>
        ) : (
          <form onSubmit={submitYear} className="mt-8">
            <p className="text-center text-sm font-semibold">{t.year.question}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-28 shrink-0">
                <input
                  type="number"
                  aria-label={t.year.input}
                  className={`${input} text-center font-mono text-lg font-semibold`}
                  min={1900}
                  max={MAX_YEAR}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
              <input
                type="range"
                aria-label={t.year.input}
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={Math.min(MAX_YEAR, Math.max(MIN_YEAR, year))}
                onChange={(e) => setYear(Number(e.target.value))}
                className="min-w-0 flex-1 accent-(--accent)"
              />
            </div>
            <div className="mt-1 flex justify-between pl-[124px] font-mono text-xs text-(--text-secondary)">
              <span>{MIN_YEAR}</span>
              <span>{MAX_YEAR}</span>
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={year < 1900 || year > MAX_YEAR}>
              {t.year.submit}
            </Button>
          </form>
        )}

        <ChatFeed feed={round.feed} you={state.you} height="h-32" />
        <ChatInput />

        <SkipButton isHost={state.hostId === state.you} />
      </RoundFrame>

      <PlayerList
        state={state}
        title={t.points}
        showScore
        status={(p) => p.answered && <span className="font-semibold text-(--success)">✓</span>}
      />
    </div>
  );
}

export default YearRound;
