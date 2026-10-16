import { useSyncExternalStore } from "react";

/**
 * Gemeinsamer Wiedergabe-Zustand: Lautstärke und Stummschaltung (beides im Browser gespeichert)
 * und ob der Browser das Abspielen blockiert hat. Regler und Audio-Element sitzen an verschiedenen Stellen der Seite
 * und lesen beide von hier.
 */
interface Playback {
  /** Reglerstellung 0–1 (nicht die Signalstärke, siehe gain). 0 = stumm. */
  volume: number;
  muted: boolean;
  blocked: boolean;
  /** Entspannte Hintergrundmusik (Kniffel) an? */
  chill: boolean;
}

/**
 * Das Gehör empfindet Lautstärke nicht linear: Die Reglerstellung wird deshalb hoch drei
 * genommen. So ist der Regelweg gleichmäßig und ganz links wirklich leise.
 */
const gain = (level: number) => level ** 3;

function savedVolume(): number {
  try {
    const level = Number(localStorage.getItem("volumeLevel"));
    if (level >= 0 && level <= 1 && localStorage.getItem("volumeLevel") !== null) return level;
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

function savedChill(): boolean {
  try {
    return localStorage.getItem("chillMusic") === "1";
  } catch {
    return false;
  }
}

let playback: Playback = {
  volume: savedVolume(),
  muted: savedMuted(),
  blocked: false,
  chill: savedChill(),
};
const listeners = new Set<() => void>();
let retry: (() => void) | null = null;

function update(patch: Partial<Playback>) {
  playback = { ...playback, ...patch };
  listeners.forEach((listener) => listener());
}

/** Auch außerhalb von React mithören (z. B. die Hintergrundmusik passt ihre Lautstärke an). */
export function subscribe(listener: () => void) {
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

/** Lautsprecher-Symbol: stumm schalten bzw. wieder an. Stand der Regler ganz links, geht er auf die Hälfte. */
export function toggleMuted() {
  if (playback.volume === 0) return setVolume(0.5);
  update({ muted: !playback.muted });
  save("muted", playback.muted ? "1" : "0");
}

export function toggleChill() {
  update({ chill: !playback.chill });
  save("chillMusic", playback.chill ? "1" : "0");
}

/** Stumm – per Symbol oder Regler ganz links. */
export function isSilent(): boolean {
  return playback.muted || playback.volume === 0;
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
  return [muted || volume === 0 ? 0 : gain(volume), setVolume] as const;
}

/**
 * Lautstärke für die Soundeffekte (außerhalb von React abrufbar). Über den ganzen Regelweg
 * gleichmäßig: ganz links stumm, Standardstellung (0.7) so laut wie früher, ganz rechts am lautesten.
 */
export function effectsVolume(): number {
  if (isSilent()) return 0;
  return 1.5 * playback.volume ** 1.2;
}

/** Lautstärke der Hintergrundmusik – folgt demselben Regler, bleibt aber dezent darunter. */
export function musicVolume(): number {
  if (isSilent() || !playback.chill) return 0;
  return 0.55 * playback.volume ** 1.2;
}
