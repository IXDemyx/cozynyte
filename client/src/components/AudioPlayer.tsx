import { useEffect, useRef } from "react";
import { onRetry, setBlocked, useVolume } from "../hooks/useVolume";

/**
 * Spielt den Ausschnitt der Runde ab – unsichtbar und über Runde und Auflösung hinweg, damit die
 * Musik beim Wechsel nicht neu startet. Den Regler zeigt VolumeControl in der jeweiligen Karte.
 */
function AudioPlayer({ src }: { src: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [volume] = useVolume();

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const play = () =>
      el.play().then(
        () => setBlocked(false),
        (err: DOMException) => {
          if (err.name === "NotAllowedError") setBlocked(true);
        },
      );
    el.currentTime = 0;
    play();
    onRetry(play);
    return () => onRetry(null);
  }, [src]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  // Ohne Audio auf der Seite gibt es nichts zu blockieren.
  useEffect(() => () => setBlocked(false), []);

  return <audio ref={audio} src={src} preload="auto" />;
}

export default AudioPlayer;
