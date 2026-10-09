import { FiVolume2, FiVolumeX } from "react-icons/fi";
import { retryPlayback, setVolume, toggleMuted, usePlayback } from "../hooks/useVolume";
import { useLanguage } from "../lib/i18n";

/**
 * Lautstärkeregler oben rechts in der Spielkarte – immer an derselben Stelle (Songauswahl,
 * Runde, Auflösung). Das Lautsprecher-Symbol schaltet stumm. Blockiert der Browser das Abspielen,
 * steht hier „Ton aktivieren".
 */
function VolumeControl() {
  const { t } = useLanguage();
  const { volume, muted, blocked } = usePlayback();

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
        aria-pressed={muted}
        aria-label={muted ? t.audio.unmute : t.audio.mute}
        title={muted ? t.audio.unmute : t.audio.mute}
        className={`rounded-md p-1 transition hover:text-(--accent) ${muted ? "text-(--accent)" : ""}`}
      >
        {muted ? <FiVolumeX aria-hidden="true" /> : <FiVolume2 aria-hidden="true" />}
      </button>
      <input
        type="range"
        aria-label={t.audio.volume}
        min={0.01}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className={`w-20 accent-(--accent) transition sm:w-28 ${muted ? "opacity-40" : ""}`}
      />
    </div>
  );
}

export default VolumeControl;
