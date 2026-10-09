import { useState } from "react";
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

const MUSIC_GAMES = ["song", "year", "timeline"] as const;

/** Lobby der Musikspiele: Raumcode, Spiel und Einstellungen; der Host startet. */
function Lobby({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  // Eigener Zustand fürs Tippen, damit die Antwort des Servers den Cursor nicht stört.
  const [theme, setTheme] = useState(state.settings.theme);
  const isHost = state.hostId === state.you;
  const isTimeline = state.game === "timeline";
  const ready = state.players.filter((p) => p.connected).length >= 2;
  const { settings } = state;

  const update = (patch: Partial<RoomState["settings"]>) =>
    socket.emit("settings:update", { ...settings, ...patch });

  const start = () => socket.emit("game:start", (res: Ack) => setError(res.ok ? "" : res.error));

  const numbers = (values: number[], suffix = "") =>
    values.map((n) => ({ value: n, label: `${n}${suffix}` }));

  return (
    <RoomLayout state={state} players={<PlayerList state={state} />}>
      <section className={`${card} animate-in min-w-0 xl:flex-1 p-7`}>
        <p className={eyebrow}>
          {/* Breit steht der Spielname schon links über dem Raumcode. */}
          <span className="xl:hidden">{t.games[state.game]} · </span>Lobby
        </p>
        {/* Auf breiten Bildschirmen stehen Code und Einladung in der linken Leiste. */}
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
            wide
            label={t.lobby.game}
            value={state.game}
            options={MUSIC_GAMES.map((game) => ({ value: game, label: t.games[game] }))}
            onChange={(game) => socket.emit("settings:update", { game })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.lobby.songsPerPlayer}
            value={settings.songsPerPlayer}
            options={numbers(isTimeline ? [3, 4, 5, 6, 8, 10] : [1, 2, 3, 4, 5])}
            onChange={(songsPerPlayer) => update({ songsPerPlayer })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.lobby.timePerSong}
            value={settings.roundSeconds}
            options={numbers(isTimeline ? [20, 30, 45] : [15, 20, 30], "s")}
            onChange={(roundSeconds) => update({ roundSeconds })}
            disabled={!isHost}
          />
          {isTimeline && (
            <>
              <OptionGroup
                label={t.lobby.mode}
                value={settings.timelineMode}
                options={(["together", "turns"] as const).map((mode) => ({
                  value: mode,
                  label: t.lobby[mode],
                }))}
                onChange={(timelineMode) => update({ timelineMode })}
                disabled={!isHost}
              />
              <OptionGroup
                label={t.lobby.goal}
                value={settings.timelineGoal}
                options={[
                  ...numbers([4, 6, 8, 10]),
                  {
                    value: 0,
                    // Platzsparend als ∞, ausgeschrieben für Tooltip und Screenreader.
                    label: (
                      <span title={t.lobby.noLimit}>
                        <span aria-hidden="true" className="text-lg leading-none">
                          ∞
                        </span>
                        <span className="sr-only">{t.lobby.noLimit}</span>
                      </span>
                    ),
                  },
                ]}
                onChange={(timelineGoal) => update({ timelineGoal })}
                disabled={!isHost}
              />
            </>
          )}
          {(state.game === "year" || isTimeline) && (
            <OptionGroup
              wide
              label={t.lobby.showSong}
              value={settings.showSong}
              options={[
                { value: true, label: t.lobby.showSongOn },
                { value: false, label: t.lobby.showSongOff },
              ]}
              onChange={(showSong) => update({ showSong })}
              disabled={!isHost}
            />
          )}
          <div className="sm:col-span-2">
            <label htmlFor="theme" className="text-sm font-semibold">
              {t.lobby.theme}
            </label>
            {isHost ? (
              <input
                id="theme"
                className={`${input} mt-3`}
                value={theme}
                maxLength={40}
                autoComplete="off"
                placeholder={t.lobby.themePlaceholder}
                onChange={(e) => {
                  setTheme(e.target.value);
                  update({ theme: e.target.value });
                }}
              />
            ) : (
              <p id="theme" className="mt-3 text-sm text-(--text-secondary)">
                {settings.theme ? (
                  <span className="font-semibold text-(--accent)">{settings.theme}</span>
                ) : (
                  t.lobby.noTheme
                )}
              </p>
            )}
          </div>
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

export default Lobby;
