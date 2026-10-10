import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { MUSIC_GAMES } from "../../../shared/types";
import AudioPlayer from "../components/AudioPlayer";
import Button from "../components/Button";
import { card, eyebrow, input } from "../components/ui";
import DrawLobby from "../games/draw/DrawLobby";
import DrawRound from "../games/draw/DrawRound";
import Kniffel from "../games/kniffel/Kniffel";
import Final from "../games/music/Final";
import Lobby from "../games/music/Lobby";
import Picking from "../games/music/Picking";
import Reveal from "../games/music/Reveal";
import SongRound from "../games/music/SongRound";
import TimelineRound from "../games/music/TimelineRound";
import YearRound from "../games/music/YearRound";
import SlfLobby from "../games/slf/SlfLobby";
import SlfReview from "../games/slf/SlfReview";
import SlfRound from "../games/slf/SlfRound";
import { useRoom } from "../hooks/useRoom";
import { useMusicSounds } from "../games/music/useMusicSounds";
import { useLanguage } from "../lib/i18n";
import { getName, saveName } from "../lib/socket";

function Room() {
  const { t, err } = useLanguage();
  const code = (useParams().code ?? "").toUpperCase();
  const [name, setName] = useState(getName);
  const [draft, setDraft] = useState("");
  const { state, error, offset } = useRoom(code, name);
  useMusicSounds(state);

  // Musikspiele: Jede neue Runde beginnt oben – nicht dort, wo man in der Auflösung hingescrollt hat.
  const musicRound =
    state && MUSIC_GAMES.includes(state.game) && state.phase === "round"
      ? state.round?.index
      : undefined;
  useEffect(() => {
    if (musicRound !== undefined) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [musicRound]);

  const submitName = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    saveName(draft);
    setName(draft.trim());
  };

  if (!name) {
    return (
      <form onSubmit={submitName} className={`${card} animate-in mx-auto mt-10 max-w-md p-7`}>
        <p className={eyebrow}>
          {t.room.room} {code}
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{t.room.askName}</h1>
        <input
          autoFocus
          aria-label={t.home.name}
          className={`${input} mt-5`}
          value={draft}
          maxLength={16}
          placeholder={t.home.name}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" className="mt-5 w-full" disabled={!draft.trim()}>
          {t.home.join}
        </Button>
      </form>
    );
  }

  if (error) {
    return (
      <div className={`${card} animate-in mx-auto mt-10 max-w-md p-7 text-center`}>
        <p className={eyebrow}>
          {t.room.room} {code}
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{t.room.failed}</h1>
        <p className="mt-3 text-(--text-secondary)">{err(error)}</p>
        <Link
          to="/"
          className="mt-6 inline-block font-semibold text-(--accent) hover:text-(--accent-hover)"
        >
          {t.room.toHome}
        </Link>
      </div>
    );
  }

  if (!state) {
    return <p className="mt-20 text-center text-(--text-secondary)">{t.room.connecting(code)}</p>;
  }

  const audioSrc = state.round?.previewUrl ?? state.reveal?.track.previewUrl;
  const isMusic = MUSIC_GAMES.includes(state.game);

  return (
    <>
      {state.game === "kniffel" && <Kniffel state={state} />}

      {state.game === "slf" && state.phase === "lobby" && <SlfLobby state={state} />}
      {state.game === "slf" && state.phase === "round" && state.slf && (
        <SlfRound state={state} slf={state.slf} offset={offset} />
      )}
      {state.game === "slf" && state.phase === "reveal" && state.slf && (
        <SlfReview state={state} slf={state.slf} />
      )}

      {state.game === "draw" && state.phase === "lobby" && <DrawLobby state={state} />}
      {state.game === "draw" && state.phase === "round" && state.draw && (
        <DrawRound state={state} draw={state.draw} offset={offset} />
      )}

      {isMusic && state.phase === "lobby" && <Lobby state={state} />}
      {state.phase === "picking" && <Picking state={state} />}
      {state.phase === "round" &&
        state.round &&
        (state.game === "year" ? (
          <YearRound state={state} round={state.round} offset={offset} />
        ) : state.game === "timeline" ? (
          <TimelineRound state={state} round={state.round} offset={offset} />
        ) : (
          <SongRound state={state} round={state.round} offset={offset} />
        ))}
      {state.phase === "reveal" && state.reveal && (
        <Reveal state={state} reveal={state.reveal} offset={offset} />
      )}
      {state.phase === "finished" && <Final state={state} />}
      {audioSrc && <AudioPlayer src={audioSrc} />}
    </>
  );
}

export default Room;
