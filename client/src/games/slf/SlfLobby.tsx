import { useState, type FormEvent } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import {
  MAX_CATEGORIES,
  MAX_CATEGORY_LENGTH,
  MIN_CATEGORIES,
  SLF_PRESETS,
  SLF_ROUNDS,
  SLF_SECONDS,
  normalizeAnswer,
  presetId,
} from "../../../../shared/slf";
import type { Ack, RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import InviteButton from "../../components/InviteButton";
import { Option, OptionGroup } from "../../components/Option";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow, input } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

/** Lobby von Stadt Land Fluss: Kategorien, Runden, Zeit und schwere Buchstaben; der Host startet. */
function SlfLobby({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const [custom, setCustom] = useState("");
  const isHost = state.hostId === state.you;
  const ready = state.players.filter((p) => p.connected).length >= 2;
  const { settings } = state;
  const categories = settings.slfCategories;
  const own = categories.filter((c) => !presetId(c));
  const full = categories.length >= MAX_CATEGORIES;

  const update = (patch: Partial<RoomState["settings"]>) =>
    socket.emit("settings:update", { ...settings, ...patch });

  const setCategories = (next: string[]) => {
    if (next.length < MIN_CATEGORIES || next.length > MAX_CATEGORIES) return;
    update({ slfCategories: next });
  };

  const togglePreset = (id: string) => {
    const key = `@${id}`;
    setCategories(
      categories.includes(key) ? categories.filter((c) => c !== key) : [...categories, key],
    );
  };

  const addCustom = (event: FormEvent) => {
    event.preventDefault();
    const name = custom.replace(/\s+/g, " ").trim();
    if (!name) return;
    const taken = categories.some(
      (c) =>
        normalizeAnswer(presetId(c) ? t.slf.presets[presetId(c)!] : c) === normalizeAnswer(name),
    );
    if (!taken) setCategories([...categories, name]);
    setCustom("");
  };

  const start = () => socket.emit("game:start", (res: Ack) => setError(res.ok ? "" : res.error));

  return (
    <RoomLayout state={state} players={<PlayerList state={state} />}>
      <section className={`${card} animate-in min-w-0 p-7 xl:flex-1`}>
        <p className={eyebrow}>
          <span className="xl:hidden">{t.games.slf} · </span>Lobby
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
          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{t.slf.categories}</p>
              <p className="text-xs text-(--text-secondary)">
                {t.slf.categoryCount(categories.length, MIN_CATEGORIES, MAX_CATEGORIES)}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SLF_PRESETS.map((id) => {
                const active = categories.includes(`@${id}`);
                return (
                  <Option
                    key={id}
                    active={active}
                    disabled={!isHost || (!active && full)}
                    onClick={() => togglePreset(id)}
                  >
                    {t.slf.presets[id]}
                  </Option>
                );
              })}
              {own.map((name) => (
                <span
                  key={name}
                  className="flex h-10 items-center gap-1 rounded-lg border border-(--accent) bg-(--accent) pl-3 pr-1 font-mono text-sm font-semibold text-slate-950"
                >
                  {name}
                  {isHost && (
                    <button
                      type="button"
                      aria-label={t.slf.remove(name)}
                      title={t.slf.remove(name)}
                      onClick={() => setCategories(categories.filter((c) => c !== name))}
                      className="rounded-md p-1 hover:bg-black/10"
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isHost && (
              <form onSubmit={addCustom} className="mt-3 flex gap-2">
                <input
                  aria-label={t.slf.customPlaceholder}
                  className={`${input} py-2.5`}
                  value={custom}
                  maxLength={MAX_CATEGORY_LENGTH}
                  disabled={full}
                  placeholder={t.slf.customPlaceholder}
                  onChange={(e) => setCustom(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="small"
                  disabled={full || !custom.trim()}
                  aria-label={t.slf.add}
                >
                  <FiPlus aria-hidden="true" />
                  <span className="hidden sm:inline">{t.slf.add}</span>
                </Button>
              </form>
            )}
          </div>

          <OptionGroup
            label={t.slf.rounds}
            value={settings.slfRounds}
            options={SLF_ROUNDS.map((n) => ({ value: n, label: String(n) }))}
            onChange={(slfRounds) => update({ slfRounds })}
            disabled={!isHost}
          />
          <OptionGroup
            label={t.slf.time}
            value={settings.slfSeconds}
            options={SLF_SECONDS.map((n) => ({ value: n, label: `${n}s` }))}
            onChange={(slfSeconds) => update({ slfSeconds })}
            disabled={!isHost}
          />
          <OptionGroup
            wide
            label={t.slf.hardLetters}
            value={settings.slfHardLetters}
            options={[
              { value: false, label: t.slf.hardOff },
              { value: true, label: t.slf.hardOn },
            ]}
            onChange={(slfHardLetters) => update({ slfHardLetters })}
            disabled={!isHost}
          />
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

export default SlfLobby;
