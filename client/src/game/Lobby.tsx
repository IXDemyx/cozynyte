import { useState, type ReactNode } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import type { Ack, RoomState } from "../../../shared/types";
import Button from "../components/Button";
import PlayerList from "../components/PlayerList";
import { card, eyebrow, input } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";

function Option({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`h-10 min-w-10 rounded-lg border px-3 font-mono text-sm font-semibold transition ${
        active
          ? "border-(--accent) bg-(--accent) text-slate-950"
          : "border-slate-300 text-(--text-secondary) enabled:hover:border-(--accent) dark:border-slate-700"
      } disabled:cursor-default`}
    >
      {children}
    </button>
  );
}

const GAME_NAMES = { song: "Guess the Song", year: "Guess the Year" };

function Lobby({ state }: { state: RoomState }) {
  const { t, err } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  // Eigener Zustand fürs Tippen, damit die Antwort des Servers den Cursor nicht stört.
  const [theme, setTheme] = useState(state.settings.theme);
  const isHost = state.hostId === state.you;
  const ready = state.players.filter((p) => p.connected).length >= 2;

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${location.origin}/r/${state.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const update = (patch: Partial<RoomState["settings"]>) =>
    socket.emit("settings:update", { ...state.settings, ...patch });

  const start = () =>
    socket.emit("game:start", (res: Ack) => setError(res.ok ? "" : res.error));

  return (
    <div className="animate-in grid gap-6 lg:grid-cols-3">
      <section className={`${card} p-7 min-w-0 lg:col-span-2`}>
        <p className={eyebrow}>{GAME_NAMES[state.game]} · Lobby</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-(--text-secondary)">{t.home.code}</p>
            <p className="font-mono text-5xl font-semibold tracking-[0.25em] text-(--accent)">
              {state.code}
            </p>
          </div>
          <Button variant="secondary" size="small" onClick={copyLink}>
            {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
            {copied ? t.lobby.copied : t.lobby.copy}
          </Button>
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-(--accent-soft)">
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">{t.lobby.game}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["song", "year"] as const).map((game) => (
                <Option
                  key={game}
                  active={state.game === game}
                  disabled={!isHost}
                  onClick={() => socket.emit("settings:update", { game })}
                >
                  {GAME_NAMES[game]}
                </Option>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">{t.lobby.songsPerPlayer}</p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Option
                  key={n}
                  active={state.settings.songsPerPlayer === n}
                  disabled={!isHost}
                  onClick={() => update({ songsPerPlayer: n })}
                >
                  {n}
                </Option>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">{t.lobby.timePerSong}</p>
            <div className="mt-3 flex gap-2">
              {[15, 20, 30].map((n) => (
                <Option
                  key={n}
                  active={state.settings.roundSeconds === n}
                  disabled={!isHost}
                  onClick={() => update({ roundSeconds: n })}
                >
                  {n}s
                </Option>
              ))}
            </div>
          </div>
          {state.game === "year" && (
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold">{t.lobby.showSong}</p>
              <div className="mt-3 flex gap-2">
                <Option
                  active={state.settings.showSong}
                  disabled={!isHost}
                  onClick={() => update({ showSong: true })}
                >
                  {t.lobby.showSongOn}
                </Option>
                <Option
                  active={!state.settings.showSong}
                  disabled={!isHost}
                  onClick={() => update({ showSong: false })}
                >
                  {t.lobby.showSongOff}
                </Option>
              </div>
            </div>
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
                {state.settings.theme ? (
                  <span className="font-semibold text-(--accent)">{state.settings.theme}</span>
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
                <p className="mt-3 text-sm text-(--text-secondary)">
                  {t.lobby.waitingPlayers}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-(--text-secondary)">{t.lobby.waitingHost}</p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-500">
              {err(error)}
            </p>
          )}
        </div>
      </section>

      <PlayerList state={state} />
    </div>
  );
}

export default Lobby;
