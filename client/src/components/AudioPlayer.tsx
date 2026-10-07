import { useEffect, useRef, useState } from "react";
import { FiVolume2, FiVolumeX } from "react-icons/fi";
import { useVolume } from "../hooks/useVolume";
import { useLanguage } from "../lib/i18n";

/** Spielt den Ausschnitt ab; läuft über Runde und Auflösung hinweg weiter. */
function AudioPlayer({ src }: { src: string }) {
  const { t } = useLanguage();
  const audio = useRef<HTMLAudioElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [volume, setVolume] = useVolume();

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().then(
      () => setBlocked(false),
      (err: DOMException) => {
        if (err.name === "NotAllowedError") setBlocked(true);
      },
    );
  }, [src]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  return (
    <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-(--bg-primary) px-4 py-2 shadow-lg dark:border-(--accent-border)">
      <audio ref={audio} src={src} preload="auto" />
      {blocked ? (
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold text-(--accent)"
          onClick={() => audio.current?.play().then(() => setBlocked(false))}
        >
          <FiVolumeX aria-hidden="true" /> {t.audio.enable}
        </button>
      ) : (
        <>
          <FiVolume2 className="text-(--text-secondary)" aria-hidden="true" />
          <input
            type="range"
            aria-label={t.audio.volume}
            min={0.05}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-28 accent-(--accent)"
          />
        </>
      )}
    </div>
  );
}

export default AudioPlayer;
