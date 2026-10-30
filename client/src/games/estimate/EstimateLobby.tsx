import { useState } from "react";
import {
  ESTIMATE_CATEGORIES,
  ESTIMATE_QUESTIONS,
  ESTIMATE_SECONDS,
  type EstimateTopic,
} from "../../../../shared/estimate";
import type { Ack, RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import InviteButton from "../../components/InviteButton";
import PublicOption from "../../components/PublicOption";
import { OptionGroup } from "../../components/Option";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

const TOPICS: EstimateTopic[] = ["all", ...ESTIMATE_CATEGORIES];

/** Lobby der Schätzfragen: Thema, Anzahl Fragen, Zeit pro Frage. */
function EstimateLobby({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const isHost = state.hostId === state.you;
  const ready = state.players.filter((p) => p.connected).length >= 2;
  const { settings } = state;

  const update = (patch: Partial<RoomState["settings"]>) =>
    socket.emit("settings:update", { ...settings, ...patch });

  const start = () => {
    socket.emit("game:start", (res: Ack) => setError(res.ok ? "" : res.error));
  };

  return (
    <RoomLayout state={state} players={<PlayerList state={state} />}>
      <section className={`${card} animate-in min-w-0 p-7 xl:flex-1`}>
        <p className={eyebrow}>
          <span className="xl:hidden">{t.games.estimate} · </span>Lobby
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 xl:hidden">
          <div>
            <p className="text-sm text-(--text-secondary)">{t.home.code}</p>
            <p className="font-mono text-5xl font-semibold tracking-[0.25em] text-(--accent)">
              {state.code}
            </p>
          </div>
          <InviteButton code={state.code} />
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2 xl:mt-6 xl:border-t-0 xl:pt-0 dark:border-(--accent-soft)">
          <PublicOption state={state} isHost={isHost} />
          <OptionGroup
            wide
            wrap
            label={t.estimate.topic}
            value={settings.estTopic}
            options={TOPICS.map((topic) => ({ value: topic, label: t.estimate.topics[topic] }))}
            onChange={(estTopic) => update({ estTopic })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.estimate.questions}
            value={settings.estQuestions}
            options={ESTIMATE_QUESTIONS.map((n) => ({ value: n, label: String(n) }))}
            onChange={(estQuestions) => update({ estQuestions })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.estimate.seconds}
            value={settings.estSeconds}
            options={ESTIMATE_SECONDS.map((n) => ({ value: n, label: `${n}s` }))}
            onChange={(estSeconds) => update({ estSeconds })}
            disabled={!isHost}
          />
        </div>

        <p className="mt-6 text-sm text-(--text-secondary)">{t.estimate.scoring}</p>

        <div className="mt-6">
          {isHost ? (
            <>
              <Button onClick={start} disabled={!ready}>
                {t.lobby.start}
              </Button>
              {!ready && (
                <p className="mt-3 text-sm text-(--text-secondary)">{t.lobby.waitingPlayers}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-(--text-secondary)">{t.lobby.waitingHost}</p>
          )}
          <ErrorText code={error} className="mt-3" />
        </div>
      </section>
    </RoomLayout>
  );
}

export default EstimateLobby;
