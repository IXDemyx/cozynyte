import { FiVolume2, FiVolumeX } from "react-icons/fi";
import { LuMusic, LuSkipForward } from "react-icons/lu";
import {
  retryPlayback,
  setTrack,
  setVolume,
  toggleChill,
  toggleMuted,
  usePlayback,
} from "../hooks/useVolume";
import { useLanguage } from "../lib/i18n";
import { TRACKS, useMusicWaiting } from "../lib/music";

/**
 * Lautstärkeregler oben rechts in der Spielkarte – immer an derselben Stelle (Songauswahl,
 * Runde, Auflösung). Das Lautsprecher-Symbol schaltet stumm. Blockiert der Browser das Abspielen,
 * steht hier „Ton aktivieren".
 */
function VolumeControl({ music = false }: { music?: boolean }) {
  const { t } = useLanguage();
  const { volume, muted, blocked, chill, track } = usePlayback();
  // Songs sind nur durchnummeriert (1, 2, 3, …).
  const song = (track % TRACKS.length) + 1;
  // Regler ganz links zählt wie stumm.
  const silent = muted || volume === 0;
  const waiting = useMusicWaiting() && music && chill && !silent;

  if (blocked) {
    return (
      <button
        type="button"
        onClick={retryPlayback}
        className="flex items-center gap-1.5 rounded-full border border-(--accent-border) px-3 py-1 text-sm font-semibold text-(--accent) hover:bg-(--accent-soft)"
      >
        <FiVolumeX aria-hidden="true" /> {t.audio.enable}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-(--text-secondary)">
      <button
        type="button"
        onClick={toggleMuted}
        aria-pressed={silent}
        aria-label={silent ? t.audio.unmute : t.audio.mute}
        title={silent ? t.audio.unmute : t.audio.mute}
        className={`rounded-md p-1 transition hover:text-(--accent) ${silent ? "text-(--accent)" : ""}`}
      >
        {silent ? <FiVolumeX aria-hidden="true" /> : <FiVolume2 aria-hidden="true" />}
      </button>
      <input
        type="range"
        aria-label={t.audio.volume}
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className={`w-24 accent-(--accent) transition sm:w-32 ${silent ? "opacity-40" : ""}`}
      />
      {/* Kniffel: entspannte Hintergrundmusik an/aus (folgt dem Regler). */}
      {music && (
        <button
          type="button"
          onClick={toggleChill}
          aria-pressed={chill}
          aria-label={chill ? t.audio.musicOff : t.audio.musicOn}
          title={chill ? t.audio.musicOff : t.audio.musicOn}
          className={`rounded-md p-1 transition hover:text-(--accent) ${chill ? "text-(--accent)" : ""}`}
        >
          <LuMusic aria-hidden="true" className={chill ? "animate-pulse" : ""} />
        </button>
      )}
      {/* Nächstes Stück – die Zahl zeigt, was gerade läuft. */}
      {music && chill && (
        <button
          type="button"
          onClick={() => setTrack((track + 1) % TRACKS.length)}
          aria-label={t.audio.nextSong(song)}
          title={t.audio.nextSong(song)}
          className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium transition hover:text-(--accent)"
        >
          <span className="font-mono tabular-nums">{song}</span>
          <LuSkipForward aria-hidden="true" className="shrink-0" />
        </button>
      )}
      {/* Nach dem Neuladen wartet die Musik auf den ersten Klick (Vorgabe des Browsers) –
          dieser Knopf ist der Klick. */}
      {waiting && (
        <button
          type="button"
          className="animate-in rounded-full border border-(--accent-border) px-2 py-0.5 text-xs font-semibold text-(--accent) hover:bg-(--accent-soft)"
        >
          {t.audio.musicStart}
        </button>
      )}
    </div>
  );
}

export default VolumeControl;
