import { useEffect, useState } from "react";
import { DRAW_ROUNDS, DRAW_SECONDS, DRAW_WORDS_PER_PLAYER } from "../../../../shared/draw";
import type { Ack, RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import InviteButton from "../../components/InviteButton";
import { OptionGroup } from "../../components/Option";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow, input } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

/**
 * Lobby von Montagsmaler: Runden, Zeit und woher die Begriffe kommen – Standardliste oder
 * „Eigene Runde“ (Motto, jeder reicht Begriffe ein). Der Host startet.
 */
function DrawLobby({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const isHost = state.hostId === state.you;
  const ready = state.players.filter((p) => p.connected).length >= 2;
  const { settings } = state;
  const [theme, setTheme] = useState(settings.theme);
  const own = settings.drawWordMode === "players";

  // Das Motto tippt nur der Host; alle anderen sehen den aktuellen Stand.
  useEffect(() => {
    if (!isHost) setTheme(settings.theme);
  }, [isHost, settings.theme]);

  const update = (patch: Partial<RoomState["settings"]>) =>
    socket.emit("settings:update", { ...settings, ...patch });

  const start = () => {
    socket.emit("game:start", (res: Ack) => setError(res.ok ? "" : res.error));
  };

  return (
    <RoomLayout state={state} players={<PlayerList state={state} />}>
      <section className={`${card} animate-in min-w-0 p-7 xl:flex-1`}>
        <p className={eyebrow}>
          <span className="xl:hidden">{t.games.draw} · </span>Lobby
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
          <OptionGroup
            label={t.draw.rounds}
            value={settings.drawRounds}
            options={DRAW_ROUNDS.map((n) => ({ value: n, label: String(n) }))}
            onChange={(drawRounds) => update({ drawRounds })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.draw.time}
            value={settings.drawSeconds}
            options={DRAW_SECONDS.map((n) => ({ value: n, label: `${n}s` }))}
            onChange={(drawSeconds) => update({ drawSeconds })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.draw.mode}
            value={settings.drawWordMode}
            options={[
              { value: "standard" as const, label: t.draw.modeStandard },
              { value: "players" as const, label: t.draw.modePlayers },
            ]}
            onChange={(drawWordMode) => update({ drawWordMode })}
            disabled={!isHost}
          />
          {own ? (
            <OptionGroup
              label={t.draw.wordsPerPlayer}
              value={settings.drawWordsPerPlayer}
              options={DRAW_WORDS_PER_PLAYER.map((n) => ({ value: n, label: String(n) }))}
              onChange={(drawWordsPerPlayer) => update({ drawWordsPerPlayer })}
              disabled={!isHost}
            />
          ) : (
            <OptionGroup
              label={t.draw.language}
              value={settings.drawLanguage}
              options={[
                { value: "de" as const, label: t.draw.langDe },
                { value: "en" as const, label: t.draw.langEn },
              ]}
              onChange={(drawLanguage) => update({ drawLanguage })}
              disabled={!isHost}
            />
          )}

          {own && (
            <div className="sm:col-span-2">
              <label htmlFor="draw-theme" className="text-sm font-semibold">
                {t.draw.theme}
              </label>
              {isHost ? (
                <input
                  id="draw-theme"
                  className={`${input} mt-3`}
                  value={theme}
                  maxLength={40}
                  placeholder={t.draw.themePlaceholder}
                  onChange={(e) => {
                    setTheme(e.target.value);
                    update({ theme: e.target.value });
                  }}
                />
              ) : (
                <p className="mt-3 text-lg font-bold text-(--accent)">
                  {settings.theme || t.draw.noTheme}
                </p>
              )}
              <p className="mt-2 text-xs text-(--text-secondary)">{t.draw.modePlayersHint}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
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

export default DrawLobby;
