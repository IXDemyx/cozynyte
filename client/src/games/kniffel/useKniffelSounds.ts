import { useEffect, useRef } from "react";
import { CATEGORIES, totals, type KniffelState } from "../../../../shared/kniffel";
import { playSound, type Sound } from "../../lib/sounds";

/** Abstand, damit zwei Effekte aus derselben Änderung nicht übereinander liegen. */
const GAP_MS = 380;

const isFinished = (sheet: KniffelState) =>
  sheet.columns.length > 0 &&
  sheet.columns.every((c) => totals(sheet.cells[c.id]).filled === CATEGORIES.length);

/**
 * Spielt Soundeffekte zu Änderungen am Block – bei allen am Tisch, egal wer würfelt oder einträgt.
 * Vergleicht dazu jeden neuen Stand mit dem vorherigen.
 */
export function useKniffelSounds(sheet: KniffelState, you: string, enabled: boolean) {
  const previous = useRef<KniffelState | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Jede Nachricht vom Server (auch Chat) liefert einen neuen Stand – geplante Effekte laufen
  // deshalb weiter und werden erst beim Verlassen des Raums abgebrochen.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const before = previous.current;
    previous.current = sheet;
    // Beim Betreten des Raums nichts abspielen, nur bei echten Änderungen.
    if (!before || !enabled) return;

    const queue: Sound[] = [];

    // Einträge: neu oder geändert, sonst gelöscht (Rückgängig bzw. Feld geleert).
    let entry: Sound | null = null;
    let removed = false;
    for (const column of sheet.columns) {
      const now = sheet.cells[column.id] ?? {};
      const old = before.cells[column.id] ?? {};
      for (const category of CATEGORIES) {
        if (now[category] === old[category]) continue;
        const value = now[category];
        if (value === undefined) removed = true;
        else if (value === 0) entry = "strike";
        else if (category === "kniffel") entry = "kniffel";
        else entry ??= "enter";
      }
    }
    const reset = sheet.columns.every((c) => !Object.keys(sheet.cells[c.id] ?? {}).length);
    if (entry) queue.push(entry);
    else if (removed && !reset) queue.push("undo");

    // Digitale Würfel: neuer Wurf bzw. Würfel gehalten oder freigegeben.
    const roll = sheet.roll;
    const oldRoll = before.roll;
    if (roll && roll.count > (oldRoll?.count ?? 0)) {
      queue.push("roll");
      if (roll.dice.every((d) => d === roll.dice[0])) queue.push("kniffel");
    } else if (roll && oldRoll && roll.count === oldRoll.count) {
      const changed = roll.held.findIndex((held, i) => held !== oldRoll.held[i]);
      if (changed >= 0) queue.push(roll.held[changed] ? "hold" : "release");
    }

    // Man selbst ist jetzt dran.
    const mine = sheet.columns.find((c) => c.id === sheet.current)?.playerId === you;
    if (mine && sheet.current !== before.current && sheet.columns.length > 1) queue.push("turn");

    if (isFinished(sheet) && !isFinished(before)) queue.push("win");

    queue.forEach((sound, i) =>
      timers.current.push(setTimeout(() => playSound(sound), i * GAP_MS)),
    );
  }, [sheet, you, enabled]);
}
