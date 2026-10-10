import { effectsVolume } from "../../hooks/useVolume";
import { playSound, type Sound } from "../../lib/sounds";

/** Stadt-Land-Fluss-Sound – mit Lautstärkeregler und Stummschaltung wie bei den Musikspielen. */
export function slfSound(sound: Sound, step = 0) {
  playSound(sound, effectsVolume(), step);
}

/** Merkt sich, zu welcher Runde der Gong schon kam – sonst schlägt er bei jedem Neuaufbau erneut. */
let lastGong = "";

export function gongOnce(key: string) {
  if (lastGong === key) return;
  lastGong = key;
  slfSound("gong");
}
