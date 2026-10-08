import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import AudioPlayer from "../components/AudioPlayer";
import Button from "../components/Button";
import { card, eyebrow, input } from "../components/ui";
import Final from "../game/Final";
import Lobby from "../game/Lobby";
import Picking from "../game/Picking";
import Reveal from "../game/Reveal";
import Kniffel from "../game/Kniffel";
import Round from "../game/Round";
import TimelineRound from "../game/TimelineRound";
import YearRound from "../game/YearRound";
import { useRoom } from "../hooks/useRoom";
import { useLanguage } from "../lib/i18n";
import { getName, saveName } from "../lib/socket";

function Room() {
  const { t, err } = useLanguage();
  const code = (useParams().code ?? "").toUpperCase();
  const [name, setName] = useState(getName);
  const [draft, setDraft] = useState("");
  const { state, error, offset } = useRoom(code, name);

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

  return (
    <>
      {state.game === "kniffel" && <Kniffel state={state} />}
      {state.game !== "kniffel" && state.phase === "lobby" && <Lobby state={state} />}
      {state.phase === "picking" && <Picking state={state} />}
      {state.phase === "round" &&
        state.round &&
        (state.game === "year" ? (
          <YearRound state={state} round={state.round} offset={offset} />
        ) : state.game === "timeline" ? (
          <TimelineRound state={state} round={state.round} offset={offset} />
        ) : (
          <Round state={state} round={state.round} offset={offset} />
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
