import { useEffect, useRef, useState } from "react";
import type { DigitalRoll } from "../../../../shared/kniffel";
import { playSound } from "../../lib/sounds";

/** So lange rollen alle Würfel, bevor der erste liegen bleibt … */
const TUMBLE_MS = 450;
/** … und danach landet alle so viele ms der nächste (von links nach rechts). */
const LAND_GAP_MS = 170;

/**
 * Würfeln mit Spannung: Die neu geworfenen Würfel wechseln wild die Augen und landen nacheinander
 * mit einem „Klack". Gehaltene Würfel bleiben liegen. Beim Betreten des Raums (oder nach dem
 * Neuladen) wird nichts nachgespielt.
 */
export function useRollAnimation(roll: DigitalRoll | null, sounds: boolean) {
  const [faces, setFaces] = useState<number[]>(roll?.dice ?? []);
  const [landed, setLanded] = useState<boolean[]>(() => (roll?.dice ?? []).map(() => true));
  const seen = useRef(roll?.count ?? 0);
  /** Wurf, der hier live gerollt ist (für Feier und Klang – nicht nach dem Neuladen). */
  const [liveCount, setLiveCount] = useState(-1);
  const soundsOn = useRef(sounds);
  soundsOn.current = sounds;

  useEffect(() => {
    const count = roll?.count ?? 0;
    const fresh = Boolean(roll) && count > seen.current;
    seen.current = count;
    if (!roll) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Kein neuer Wurf (z. B. nur gehalten) oder keine Animation erwünscht: einfach anzeigen.
    if (!fresh || calm || count === 0) {
      setFaces(roll.dice);
      setLanded(roll.dice.map(() => true));
      return;
    }

    setLiveCount(count);
    const rolling = roll.dice.map((_, i) => count === 1 || !roll.held[i]);
    const order = rolling.flatMap((r, i) => (r ? [i] : []));
    let current = roll.dice.map((d, i) => (rolling[i] ? randomFace() : d));
    let down = rolling.map((r) => !r);
    setFaces(current);
    setLanded(down);

    const spin = setInterval(() => {
      current = current.map((d, i) => (down[i] ? d : randomFace()));
      setFaces(current);
    }, 80);
    const timers = order.map((die, k) =>
      setTimeout(
        () => {
          current = current.map((d, i) => (i === die ? roll.dice[i] : d));
          down = down.map((l, i) => l || i === die);
          setFaces(current);
          setLanded(down);
          if (soundsOn.current) playSound("land");
          if (k === order.length - 1) clearInterval(spin);
        },
        TUMBLE_MS + k * LAND_GAP_MS,
      ),
    );
    return () => {
      clearInterval(spin);
      timers.forEach(clearTimeout);
    };
    // Nur bei einem neuen Wurf bzw. geänderten Haltewürfeln neu starten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll?.count, roll?.dice.join(), roll?.held.join()]);

  const settled = landed.every(Boolean);
  return { faces, landed, settled, live: Boolean(roll) && roll?.count === liveCount };
}

const randomFace = () => 1 + Math.floor(Math.random() * 6);
