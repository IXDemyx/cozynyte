import { useEffect, useRef, useState } from "react";
import { FiCheck, FiPause, FiPlay, FiPlus, FiSearch, FiVolume2, FiX } from "react-icons/fi";
import type { Ack, RoomState, Track } from "../../../shared/types";
import Button from "../components/Button";
import PlayerList from "../components/PlayerList";
import { card, eyebrow, input } from "../components/ui";
import { useVolume } from "../hooks/useVolume";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";

const SUGGESTIONS = [
  "surprise", "current", "pop", "rock", "hiphop", "german", "80s", "90s", "2000s", "electronic",
];

function Picking({ state }: { state: RoomState }) {
  const { t, err } = useLanguage();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useVolume();

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  const target = state.settings.songsPerPlayer;
  const picks = state.myPicks;
  const full = picks.length >= target;
  const isHost = state.hostId === state.you;
  // Bei Jahres-Spielen muss jeder Song ein Jahr haben, und der Wählende sieht es.
  const isYear = state.game === "year" || state.game === "timeline";
  const active = state.players.filter((p) => p.connected);
  const everyoneReady = active.every((p) => p.picked >= target);

  // Suche mit kurzer Verzögerung, damit nicht jeder Tastendruck eine Anfrage auslöst.
  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      // Leeres Feld: vorhandene Vorschläge stehen lassen, nur alte Suchtreffer entfernen.
      if (query.length > 0) setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(() => {
      socket.emit("songs:search", { term: query }, (res: Ack<{ tracks: Track[] }>) => {
        if (cancelled) return;
        setSearching(false);
        if (res.ok) {
          setResults(res.tracks);
          setError("");
        } else setError(res.error);
      });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [term]);

  const togglePreview = (track: Track) => {
    const el = audio.current;
    if (!el) return;
    if (previewId === track.id) {
      el.pause();
      setPreviewId(null);
      return;
    }
    el.src = track.previewUrl;
    el.volume = volume;
    void el.play();
    setPreviewId(track.id);
  };

  const suggest = (category: string) => {
    setTerm("");
    setSearching(true);
    socket.emit("songs:suggest", { category }, (res: Ack<{ tracks: Track[] }>) => {
      setSearching(false);
      if (res.ok) {
        setResults(res.tracks);
        setError("");
      } else setError(res.error);
    });
  };

  const add = (track: Track) =>
    socket.emit("songs:add", { trackId: track.id }, (res: Ack) =>
      setError(res.ok ? "" : res.error),
    );

  const finish = () =>
    socket.emit("picking:finish", (res: Ack) => setError(res.ok ? "" : res.error));

  return (
    <div className="animate-in grid gap-6 lg:grid-cols-3">
      <audio ref={audio} onEnded={() => setPreviewId(null)} />

      <section className={`${card} p-7 min-w-0 lg:col-span-2`}>
        <div className="flex items-center justify-between gap-4">
          <p className={eyebrow}>{t.picking.eyebrow}</p>
          <label className="flex items-center gap-2 text-(--text-secondary)">
            <FiVolume2 aria-hidden="true" />
            <input
              type="range"
              aria-label={t.audio.volume}
              min={0.05}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-(--accent) sm:w-28"
            />
          </label>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{t.picking.title(target)}</h1>
        {state.settings.theme && (
          <p className="mt-3 inline-block rounded-full border border-(--accent-border) bg-(--accent-soft) px-3 py-1 text-sm">
            <span className="text-(--text-secondary)">{t.lobby.theme}:</span>{" "}
            <span className="font-semibold text-(--accent)">{state.settings.theme}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-(--text-secondary)">
          {state.game === "timeline"
            ? t.picking.hintTimeline
            : isYear
              ? t.picking.hintYear
              : t.picking.hint}
        </p>

        <ul className="mt-6 grid gap-2">
          {Array.from({ length: target }, (_, i) => {
            const track = picks[i];
            if (!track) {
              return (
                <li
                  key={`empty-${i}`}
                  className="flex h-[62px] items-center rounded-xl border border-dashed border-slate-300 px-4 font-mono text-xs text-(--text-secondary) dark:border-slate-700"
                >
                  Song {i + 1}
                </li>
              );
            }
            return (
              <li
                key={track.id}
                className="rounded-xl border border-(--accent-border) bg-(--accent-soft) p-2 pr-3"
              >
                <div className="flex items-center gap-3">
                  <img src={track.artwork} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{track.title}</p>
                    <p className="truncate text-xs text-(--text-secondary)">
                      {track.artist}
                      {isYear && track.year && (
                        <span className="font-mono font-semibold text-(--accent)"> · {track.year}</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t.picking.remove(track.title)}
                    className="rounded-lg p-2 text-(--text-secondary) hover:text-red-500"
                    onClick={() => socket.emit("songs:remove", { trackId: track.id })}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {full ? (
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-(--success)">
            <FiCheck aria-hidden="true" /> {t.picking.done}
          </p>
        ) : (
          <>
            <div className="relative mt-6">
              <FiSearch
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)"
                aria-hidden="true"
              />
              <input
                autoFocus
                aria-label={t.picking.search}
                className={`${input} pl-11`}
                value={term}
                placeholder={t.picking.searchPlaceholder}
                onChange={(e) => {
                  setTerm(e.target.value);
                  if (!e.target.value.trim()) setResults([]);
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-(--text-secondary)">{t.picking.suggestions}</span>
              {SUGGESTIONS.map((category) => (
                <button
                  key={category}
                  type="button"
                  disabled={searching}
                  onClick={() => suggest(category)}
                  className={`rounded-full border px-3 py-1 font-mono text-xs transition disabled:opacity-50 ${
                    category === "surprise"
                      ? "border-(--accent) bg-(--accent) font-semibold text-slate-950 enabled:hover:bg-(--accent-hover)"
                      : "border-slate-300 text-(--text-secondary) enabled:hover:border-(--accent) enabled:hover:text-(--accent) dark:border-slate-700"
                  }`}
                >
                  {t.picking.categories[category]}
                </button>
              ))}
            </div>

            <ul className="mt-3 max-h-[420px] space-y-1 overflow-y-auto">
              {results.map((track) => {
                const mine = picks.some((p) => p.id === track.id);
                return (
                  <li
                    key={track.id}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-(--accent-soft)"
                  >
                    <button
                      type="button"
                      aria-label={
                        previewId === track.id ? t.audio.pause : t.picking.listen(track.title)
                      }
                      onClick={() => togglePreview(track)}
                      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                    >
                      <img src={track.artwork} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                        {previewId === track.id ? <FiPause /> : <FiPlay />}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{track.title}</p>
                      <p className="truncate text-xs text-(--text-secondary)">
                        {isYear && (
                          <span className="font-mono font-semibold text-(--accent)">
                            {track.year ?? "?"} ·{" "}
                          </span>
                        )}
                        {track.artist}
                        {track.album && ` · ${track.album}`}
                      </p>
                    </div>
                    <Button size="small" variant="secondary" disabled={mine || (isYear && !track.year)} onClick={() => add(track)}>
                      <FiPlus aria-label={t.picking.pick} />{" "}
                      <span className="hidden sm:inline">{t.picking.pick}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
            {term.trim().length >= 2 && !searching && results.length === 0 && !error && (
              <p className="mt-3 text-sm text-(--text-secondary)">{t.picking.nothing}</p>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-500">
            {err(error)}
          </p>
        )}
      </section>

      <div className="space-y-4">
        <PlayerList
          state={state}
          status={(p) =>
            p.picked >= target ? (
              <span className="font-semibold text-(--success)">{t.picking.ready}</span>
            ) : (
              <span className="font-mono">
                {p.picked}/{target}
              </span>
            )
          }
        />
        {isHost && (
          <div>
            <Button className="w-full" onClick={finish} variant={everyoneReady ? "primary" : "secondary"}>
              {everyoneReady ? t.picking.go : t.picking.force}
            </Button>
            {!everyoneReady && (
              <p className="mt-2 text-center text-xs text-(--text-secondary)">{t.picking.forceHint}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Picking;
