import { useEffect, useState } from "react";
import {
  DRAW_ROUNDS,
  DRAW_SECONDS,
  MAX_CUSTOM_WORDS,
  MAX_WORD_LENGTH,
} from "../../../../shared/draw";
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

/** Kommagetrennte Eingabe → Liste eigener Begriffe. */
const parseWords = (text: string) =>
  text
    .split(/[,;\n]/)
    .map((w) => w.replace(/\s+/g, " ").trim().slice(0, MAX_WORD_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_CUSTOM_WORDS);

/** Lobby von Montagsmaler: Runden, Zeit, Sprache und eigene Begriffe; der Host startet. */
function DrawLobby({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const isHost = state.hostId === state.you;
  const ready = state.players.filter((p) => p.connected).length >= 2;
  const { settings } = state;
  const [custom, setCustom] = useState(settings.drawCustom.join(", "));

  // Ändert der Host die Begriffe, sehen die anderen den neuen Stand.
  useEffect(() => {
    if (!isHost) setCustom(settings.drawCustom.join(", "));
  }, [isHost, settings.drawCustom]);

  const update = (patch: Partial<RoomState["settings"]>) =>
    socket.emit("settings:update", { ...settings, ...patch });

  const saveCustom = () => {
    const words = parseWords(custom);
    if (words.join("|") !== settings.drawCustom.join("|")) update({ drawCustom: words });
  };

  const start = () => {
    saveCustom();
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
            label={t.draw.language}
            value={settings.drawLanguage}
            options={[
              { value: "de" as const, label: t.draw.langDe },
              { value: "en" as const, label: t.draw.langEn },
            ]}
            onChange={(drawLanguage) => update({ drawLanguage })}
            disabled={!isHost}
          />

          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="draw-custom" className="text-sm font-semibold">
                {t.draw.custom}
              </label>
              <p className="text-xs text-(--text-secondary)">
                {t.draw.customCount(
                  isHost ? parseWords(custom).length : settings.drawCustom.length,
                )}
              </p>
            </div>
            <textarea
              id="draw-custom"
              className={`${input} mt-3 min-h-24 resize-y py-2.5`}
              value={custom}
              disabled={!isHost}
              placeholder={t.draw.customPlaceholder}
              onChange={(e) => setCustom(e.target.value)}
              onBlur={saveCustom}
            />
            <p className="mt-2 text-xs text-(--text-secondary)">{t.draw.customHint}</p>
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

export default DrawLobby;
