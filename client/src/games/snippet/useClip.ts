import { useCallback, useEffect, useRef, useState } from "react";
import { useVolume } from "../../hooks/useVolume";
import { audioOut } from "../../lib/sounds";

/** Ein- und Ausblenden jedes Ausschnitts – gegen Knacken, bei 0,1 s noch nicht hörbar. */
const FADE = 0.005;

/**
 * Hörproben von Apple beginnen oft mit Stille oder einem Einblenden. Der Ausschnitt startet erst
 * dort, wo der Song hörbar läuft: am ersten 10-ms-Fenster mit mindestens einem Drittel der
 * mittleren Lautstärke (gesucht wird in den ersten 5 Sekunden).
 */
function soundStart(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.round(buffer.sampleRate * 0.01));
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += data[i] * data[i];
  const average = Math.sqrt(sum / Math.ceil(data.length / 4));
  const limit = Math.min(data.length - step, buffer.sampleRate * 5);
  for (let start = 0; start < limit; start += step) {
    let window = 0;
    for (let i = start; i < start + step; i++) window += data[i] * data[i];
    if (Math.sqrt(window / step) >= average / 3) return start / buffer.sampleRate;
  }
  return 0;
}

export type ClipStatus = "loading" | "ready" | "error";

/**
 * Lädt die Hörprobe einer Runde und spielt Ausschnitte mit genauer Länge (Web Audio – ein
 * Audio-Element käme bei 0,1 s nicht hin). `playing`: Länge und Startzeit des laufenden Ausschnitts.
 */
export function useClip(url: string | null) {
  const [status, setStatus] = useState<ClipStatus>("loading");
  const [playing, setPlaying] = useState<{ length: number; at: number } | null>(null);
  const buffer = useRef<{ data: AudioBuffer; start: number } | null>(null);
  const current = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const [volume] = useVolume();
  const level = useRef(volume);

  const stop = useCallback(() => {
    const node = current.current;
    current.current = null;
    if (node) {
      node.source.onended = null;
      try {
        node.source.stop();
      } catch {
        // Schon zu Ende.
      }
    }
    setPlaying(null);
  }, []);

  useEffect(() => {
    level.current = volume;
    const node = current.current;
    if (node) node.gain.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    stop();
    buffer.current = null;
    if (!url) return;
    const audio = audioOut();
    if (!audio) return setStatus("error");
    setStatus("loading");
    const abort = new AbortController();
    fetch(url, { signal: abort.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.arrayBuffer();
      })
      .then((data) => audio.ctx.decodeAudioData(data))
      .then((data) => {
        if (abort.signal.aborted) return;
        buffer.current = { data, start: soundStart(data) };
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        // Steht in der Konsole: Laden (HTTP-Status) oder Dekodieren schlug fehl.
        console.warn("Song-Schnipsel: Hörprobe nicht abspielbar", error);
        setStatus("error");
      });
    return () => abort.abort();
  }, [url, stop]);

  // Beim Verlassen der Seite nicht weiterspielen.
  useEffect(() => stop, [stop]);

  /** Ausschnitt von `length` Sekunden spielen; ohne Länge den Rest der Hörprobe. */
  const play = useCallback(
    (length?: number) => {
      const audio = audioOut();
      const clip = buffer.current;
      if (!audio || !clip) return;
      stop();
      const { ctx } = audio;
      void ctx.resume();
      const duration = Math.min(length ?? Infinity, clip.data.duration - clip.start);
      const at = ctx.currentTime + 0.03;
      const source = ctx.createBufferSource();
      source.buffer = clip.data;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(1, at + FADE);
      envelope.gain.setValueAtTime(1, at + duration - FADE);
      envelope.gain.linearRampToValueAtTime(0, at + duration);
      const gain = ctx.createGain();
      gain.gain.value = level.current;
      source.connect(envelope).connect(gain).connect(ctx.destination);
      source.start(at, clip.start, duration);
      source.onended = () => {
        if (current.current?.source === source) {
          current.current = null;
          setPlaying(null);
        }
      };
      current.current = { source, gain };
      setPlaying({ length: duration, at: performance.now() + 30 });
    },
    [stop],
  );

  return { status, playing, play, stop };
}
