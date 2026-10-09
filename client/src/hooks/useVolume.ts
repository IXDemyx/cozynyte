import { useSyncExternalStore } from "react";

/**
 * Gemeinsamer Wiedergabe-Zustand: Lautstärke und Stummschaltung (beides im Browser gespeichert)
 * und ob der Browser das Abspielen blockiert hat. Regler und Audio-Element sitzen an verschiedenen Stellen der Seite
 * und lesen beide von hier.
 */
interface Playback {
  /** Reglerstellung 0–1 (nicht die Signalstärke, siehe gain). */
  volume: number;
  muted: boolean;
  blocked: boolean;
}

/**
 * Das Gehör empfindet Lautstärke nicht linear: Die Reglerstellung wird deshalb hoch drei
 * genommen. So ist der Regelweg gleichmäßig und ganz links wirklich leise.
 */
const gain = (level: number) => level ** 3;

function savedVolume(): number {
  try {
    const level = Number(localStorage.getItem("volumeLevel"));
    if (level > 0 && level <= 1) return level;
    // Früher wurde die Signalstärke direkt gespeichert – umrechnen, damit es gleich laut bleibt.
    const old = Number(localStorage.getItem("volume"));
    return old > 0 && old <= 1 ? Math.cbrt(old) : 0.7;
  } catch {
    return 0.7;
  }
}

function savedMuted(): boolean {
  try {
    return localStorage.getItem("muted") === "1";
  } catch {
    return false;
  }
}

let playback: Playback = { volume: savedVolume(), muted: savedMuted(), blocked: false };
const listeners = new Set<() => void>();
let retry: (() => void) | null = null;

function update(patch: Partial<Playback>) {
  playback = { ...playback, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePlayback(): Playback {
  return useSyncExternalStore(subscribe, () => playback);
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ohne Speicher gilt die Einstellung nur bis zum Neuladen.
  }
}

/** Lautstärke ändern – wer am Regler dreht, will auch etwas hören: hebt die Stummschaltung auf. */
export function setVolume(volume: number) {
  update({ volume, muted: false });
  save("volumeLevel", String(volume));
  save("muted", "0");
}

export function toggleMuted() {
  update({ muted: !playback.muted });
  save("muted", playback.muted ? "1" : "0");
}

export function setBlocked(blocked: boolean) {
  if (playback.blocked !== blocked) update({ blocked });
}

/** Das Audio-Element meldet hier, wie ein erneuter Abspielversuch geht („Ton aktivieren"). */
export function onRetry(action: (() => void) | null) {
  retry = action;
}

export function retryPlayback() {
  retry?.();
}

/** Signalstärke fürs Audio-Element (0–1, stumm = 0) – gemeinsam für Vorhören und Spielrunde. */
export function useVolume() {
  const { volume, muted } = usePlayback();
  return [muted ? 0 : gain(volume), setVolume] as const;
}
