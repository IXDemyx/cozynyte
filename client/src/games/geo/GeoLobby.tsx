import { useState } from "react";
import {
  QUIZ_JOKERS,
  QUIZ_QUESTIONS,
  QUIZ_SECONDS,
  quizPool,
  type QuizMode,
  type QuizRegion,
} from "../../../../shared/countries";
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

const MODES: QuizMode[] = ["flag", "outline", "capital", "mix"];
const REGIONS: QuizRegion[] = ["world", "eu", "as", "af", "am", "oc"];

/** Lobby des Länder-Quiz: Fragenart, Region, Schwierigkeit, Antwortart, Hinweise. */
function GeoLobby({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const isHost = state.hostId === state.you;
  const ready = state.players.filter((p) => p.connected).length >= 2;
  const { settings } = state;
  const pool = quizPool(settings).length;
  const choice = settings.geoAnswer === "choice";

  const update = (patch: Partial<RoomState["settings"]>) =>
    socket.emit("settings:update", { ...settings, ...patch });

  const start = () => {
    socket.emit("game:start", (res: Ack) => setError(res.ok ? "" : res.error));
  };

  return (
    <RoomLayout state={state} players={<PlayerList state={state} />}>
      <section className={`${card} animate-in min-w-0 p-7 xl:flex-1`}>
        <p className={eyebrow}>
          <span className="xl:hidden">{t.games.geo} · </span>Lobby
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
            label={t.geo.mode}
            value={settings.geoMode}
            options={MODES.map((mode) => ({ value: mode, label: t.geo.modes[mode] }))}
            onChange={(geoMode) => update({ geoMode })}
            disabled={!isHost}
          />
          <OptionGroup
            wide
            label={t.geo.region}
            value={settings.geoRegion}
            options={REGIONS.map((region) => ({ value: region, label: t.geo.regions[region] }))}
            onChange={(geoRegion) => update({ geoRegion })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.geo.level}
            value={settings.geoKnownOnly}
            options={[
              { value: true, label: t.geo.known },
              { value: false, label: t.geo.all },
            ]}
            onChange={(geoKnownOnly) => update({ geoKnownOnly })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.geo.answer}
            value={settings.geoAnswer}
            options={[
              { value: "choice" as const, label: t.geo.choice },
              { value: "type" as const, label: t.geo.type },
            ]}
            onChange={(geoAnswer) => update({ geoAnswer })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.geo.questions}
            value={settings.geoQuestions}
            options={QUIZ_QUESTIONS.map((n) => ({ value: n, label: String(n) }))}
            onChange={(geoQuestions) => update({ geoQuestions })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.geo.seconds}
            value={settings.geoSeconds}
            options={QUIZ_SECONDS.map((n) => ({ value: n, label: `${n}s` }))}
            onChange={(geoSeconds) => update({ geoSeconds })}
            disabled={!isHost}
          />
          {/* Auswahl: Joker, die jeder selbst einlöst. Tippen: Hinweise, die mit der Zeit kommen. */}
          <div className="sm:col-span-2">
            {choice ? (
              <OptionGroup
                label={t.geo.jokers}
                value={settings.geoJokers}
                options={QUIZ_JOKERS.map((n) => ({ value: n, label: n ? String(n) : t.geo.off }))}
                onChange={(geoJokers) => update({ geoJokers })}
                disabled={!isHost}
              />
            ) : (
              <OptionGroup
                label={t.geo.hints}
                value={settings.geoHints}
                options={[
                  { value: true, label: t.geo.on },
                  { value: false, label: t.geo.off },
                ]}
                onChange={(geoHints) => update({ geoHints })}
                disabled={!isHost}
              />
            )}
            <p className="mt-2 text-xs text-(--text-secondary)">
              {choice
                ? t.geo.jokersHint(settings.geoJokers)
                : settings.geoHints
                  ? t.geo.hintsOnType
                  : t.geo.hintsOff}
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm text-(--text-secondary)">
          {t.geo.pool(pool)} {pool < settings.geoQuestions && t.geo.fewer(pool)}
        </p>

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

export default GeoLobby;
