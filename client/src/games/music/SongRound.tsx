import { FiCheck } from "react-icons/fi";
import type { RoomState, RoundView } from "../../../../shared/types";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { useLanguage } from "../../lib/i18n";
import Equalizer from "./Equalizer";
import RoundFrame from "./RoundFrame";
import SkipButton from "./SkipButton";

/** Eine Zeile „Titel"/„Interpret": verdeckte Buchstaben als Striche, Hinweise hervorgehoben. */
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

interface SongRoundProps {
  state: RoomState;
  round: RoundView;
  offset: number;
}

/** Guess the Song: Titel und Interpret erraten. */
function SongRound({ state, round, offset }: SongRoundProps) {
  const { t } = useLanguage();

  const me = state.players.find((p) => p.id === state.you);
  const knowsTitle = round.youArePicker || Boolean(me?.gotTitle);
  const knowsArtist = round.youArePicker || Boolean(me?.gotArtist);

  return (
    <RoomLayout
      state={state}
      players={
        <PlayerList
          state={state}
          title={t.points}
          showScore
          status={(p) =>
            (p.gotTitle || p.gotArtist) && (
              <span className="font-semibold text-(--success)">{p.answered ? "✓✓" : "✓"}</span>
            )
          }
        />
      }
    >
      <RoundFrame
        title={t.round.song(round.index + 1, round.total)}
        endsAt={round.endsAt}
        durationMs={round.durationMs}
        offset={offset}
      >
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
          <p className="mt-8 text-center text-sm text-(--text-secondary)">{t.round.chatHint}</p>
        )}
        <SkipButton isHost={state.hostId === state.you} />
      </RoundFrame>
    </RoomLayout>
  );
}

export default SongRound;
