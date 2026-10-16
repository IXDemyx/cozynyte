import { useEffect, useRef, useState } from "react";
import { MAX_SHAKE_MS, type DigitalRoll } from "../../../../shared/kniffel";
import { playEffect } from "../../lib/sounds";

/** So lange rollen alle Würfel, bevor der erste liegen bleibt … */
const TUMBLE_MS = 450;
/** … plus so viel pro Millisekunde, die der Becher geschüttelt wurde (wildere Würfe). */
const SHAKE_FACTOR = 0.3;
/** … und danach landet alle so viele ms der nächste (von links nach rechts). */
const LAND_GAP_MS = 170;
/** Spannung: Pause, bevor der letzte Würfel in Zeitlupe weiterdreht … */
const SUSPENSE_PAUSE_MS = 250;
/** … und so lange (wachsend) zeigt er dann noch Augen, bevor er liegen bleibt. */
const SUSPENSE_STEPS = [90, 100, 115, 135, 160, 190, 230, 280, 340];
/** Kurz vor dem Kniffel: noch länger, noch langsamer – alle am Tisch halten die Luft an. */
const KNIFFEL_STEPS = [90, 100, 110, 125, 145, 170, 200, 240, 290, 350, 430, 530, 650];
/** Herzschlag während der Kniffel-Zeitlupe: erst ruhig, dann immer schneller. */
const HEARTBEAT_GAPS = [620, 560, 500, 440, 390, 340, 300, 270, 250];

export type SuspenseKind = "kniffel" | "straight";

/**
 * Fehlt mit diesen vier Würfeln nur noch einer zum Kniffel oder zur großen Straße? Dann ist der
 * fünfte der spannende Würfel.
 */
function nearBigCombo(four: number[]): SuspenseKind | null {
  if (four.every((d) => d === four[0])) return "kniffel";
  const distinct = new Set(four);
  if (distinct.size !== 4) return null;
  const inRange = (low: number) => four.every((d) => d >= low && d <= low + 4);
  return inRange(1) || inRange(2) ? "straight" : null;
}

interface Decider {
  /** Index des entscheidenden Würfels – er landet zuletzt und in Zeitlupe. */
  die: number;
  kind: SuspenseKind;
  /** Diese Augenzahl bräuchte er (fürs Necken kurz vor Schluss). */
  target: number;
}

/**
 * Welcher der neu geworfenen Würfel entscheidet über Kniffel bzw. große Straße?
 * null = kein spannender Moment.
 */
function findDecider(dice: number[], rolling: boolean[], skipStraight: boolean): Decider | null {
  for (let i = dice.length - 1; i >= 0; i--) {
    if (!rolling[i]) continue;
    const others = dice.filter((_, j) => j !== i);
    const kind = nearBigCombo(others);
    if (!kind || (kind === "straight" && skipStraight)) continue;
    const target =
      kind === "kniffel"
        ? others[0]
        : ([1, 2, 3, 4, 5, 6].find((f) => isLargeStraight([...others, f])) ?? others[0]);
    return { die: i, kind, target };
  }
  return null;
}

/**
 * Würfeln mit Spannung: Die neu geworfenen Würfel wechseln wild die Augen und landen nacheinander
 * mit einem „Klack" – je länger geschüttelt, desto länger rollen sie. Fehlt nur noch ein Würfel
 * zu Kniffel oder großer Straße, dreht dieser in Zeitlupe als Letzter. Beim Kniffel ist es extra
 * spannend: längere Zeitlupe, Herzschlag, und kurz vor Schluss zeigt der Würfel neckisch genau die
 * fehlende Zahl – bevor er (vielleicht) doch noch umkippt. Gehaltene Würfel bleiben liegen.
 * Beim Betreten des Raums (oder nach dem Neuladen) wird nichts nachgespielt.
 */
export function useRollAnimation(
  roll: DigitalRoll | null,
  sounds: boolean,
  /** Große Straße beim Spieler am Zug schon eingetragen (oder gestrichen)? Dann keine Zeitlupe. */
  straightDone = false,
) {
  const [faces, setFaces] = useState<number[]>(roll?.dice ?? []);
  const [landed, setLanded] = useState<boolean[]>(() => (roll?.dice ?? []).map(() => true));
  /** Index des Würfels, der gerade in Zeitlupe dreht (sonst null) – und worum es geht. */
  const [suspense, setSuspense] = useState<number | null>(null);
  const [suspenseKind, setSuspenseKind] = useState<SuspenseKind | null>(null);
  const seen = useRef(roll?.count ?? 0);
  /** Wurf, der hier live gerollt ist (für Feier und Klang – nicht nach dem Neuladen). */
  const [liveCount, setLiveCount] = useState(-1);
  const soundsOn = useRef(sounds);
  soundsOn.current = sounds;
  const skipStraight = useRef(straightDone);
  skipStraight.current = straightDone;

  useEffect(() => {
    const count = roll?.count ?? 0;
    const fresh = Boolean(roll) && count > seen.current;
    seen.current = count;
    setSuspense(null);
    setSuspenseKind(null);
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
    const decider = findDecider(roll.dice, rolling, skipStraight.current);
    const order = rolling.flatMap((r, i) => (r && i !== decider?.die ? [i] : []));
    let current = roll.dice.map((d, i) => (rolling[i] ? randomFace() : d));
    let down = rolling.map((r) => !r);
    setFaces(current);
    setLanded(down);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const tumble = TUMBLE_MS + Math.min(MAX_SHAKE_MS, roll.shake ?? 0) * SHAKE_FACTOR;
    const land = (die: number) => {
      current = current.map((d, i) => (i === die ? roll.dice[i] : d));
      down = down.map((l, i) => l || i === die);
      setFaces(current);
      setLanded(down);
      if (soundsOn.current) playEffect("land");
    };
    const show = (die: number, face: number) => {
      current = current.map((d, i) => (i === die ? face : d));
      setFaces(current);
    };

    const spin = setInterval(() => {
      current = current.map((d, i) => (down[i] ? d : randomFace()));
      setFaces(current);
    }, 80);
    order.forEach((die, k) => timers.push(setTimeout(() => land(die), tumble + k * LAND_GAP_MS)));
    const othersDone = tumble + Math.max(0, order.length - 1) * LAND_GAP_MS;

    if (!decider) {
      timers.push(setTimeout(() => clearInterval(spin), othersDone));
    } else {
      // Zeitlupe: Der entscheidende Würfel dreht immer langsamer – alle halten die Luft an.
      const { die, kind, target } = decider;
      const kniffel = kind === "kniffel";
      const steps = kniffel ? KNIFFEL_STEPS : SUSPENSE_STEPS;
      const start = othersDone + SUSPENSE_PAUSE_MS;
      let at = start;
      timers.push(
        setTimeout(() => {
          clearInterval(spin);
          setSuspense(die);
          setSuspenseKind(kind);
          if (soundsOn.current) playEffect(kniffel ? "suspenseLong" : "suspense");
        }, at),
      );
      steps.forEach((step, k) => {
        at += step;
        // Vorletzter Schritt beim Kniffel: genau die fehlende Zahl zeigen … und dann umkippen.
        const tease = kniffel && k === steps.length - 2 && roll.dice[die] !== target;
        timers.push(setTimeout(() => show(die, tease ? target : randomFace(current[die])), at));
      });
      if (kniffel) {
        let beat = start + 150;
        for (const gap of HEARTBEAT_GAPS) {
          if (beat > at - 200) break;
          timers.push(
            setTimeout(() => {
              if (soundsOn.current) playEffect("heartbeat");
              navigator.vibrate?.([35, 80, 35]);
            }, beat),
          );
          beat += gap;
        }
      }
      timers.push(
        setTimeout(
          () => {
            setSuspense(null);
            setSuspenseKind(null);
            land(die);
            // Knapp daneben: ein kleines „Ohh".
            const hit = kniffel
              ? roll.dice.every((d) => d === roll.dice[0])
              : isLargeStraight(roll.dice);
            // Beim Kniffel stöhnt der ganze Tisch.
            if (!hit && soundsOn.current) playEffect(kniffel ? "crowdAww" : "aww");
          },
          at + (kniffel ? 260 : 120),
        ),
      );
    }

    return () => {
      clearInterval(spin);
      timers.forEach(clearTimeout);
    };
    // Nur bei einem neuen Wurf bzw. geänderten Haltewürfeln neu starten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll?.count, roll?.dice.join(), roll?.held.join()]);

  // Ein neuer Wurf, für den die Animation noch nicht gestartet ist, gilt schon als „rollt" –
  // sonst blitzen Ergebnis und Vorschläge im Block für einen Moment auf.
  const pending = (roll?.count ?? 0) > seen.current;
  const settled = !pending && landed.every(Boolean);
  return {
    faces,
    landed,
    settled,
    suspense,
    suspenseKind,
    live: Boolean(roll) && roll?.count === liveCount,
  };
}

function isLargeStraight(dice: number[]): boolean {
  const sorted = [...dice].sort((a, b) => a - b).join("");
  return sorted === "12345" || sorted === "23456";
}

/** Zufällige Augenzahl – auf Wunsch eine andere als `not` (sonst „steht" der Würfel kurz). */
function randomFace(not?: number): number {
  let face = 1 + Math.floor(Math.random() * 6);
  while (face === not) face = 1 + Math.floor(Math.random() * 6);
  return face;
}
