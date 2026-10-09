/** Kniffel-Block: Spalten, Zugreihenfolge und Verlauf zum Rückgängigmachen. */

import { randomInt } from "node:crypto";
import {
  CATEGORIES,
  MAX_ROLLS,
  allowedValues,
  nextTurn,
  type Category,
  type KniffelState,
} from "../../../shared/kniffel";
import { MAX_COLUMNS, MAX_UNDO } from "../config";
import type { KniffelStep, Player, Room } from "../state";

/** Jeder Spieler im Raum bekommt automatisch eine eigene Spalte. */
export function ensureColumn(room: Room, player: Player) {
  const sheet = room.kniffel;
  if (!sheet) return;
  const column = sheet.columns.find((c) => c.playerId === player.id);
  if (column) column.name = player.name;
  else addColumn(room, player.name, player.id);
}

/** Neue Spalte; ohne `playerId` für jemanden ohne eigenes Handy. false = Block ist voll. */
export function addColumn(room: Room, name: string, playerId?: string): boolean {
  const sheet = room.kniffel;
  if (!sheet || sheet.columns.length >= MAX_COLUMNS) return false;
  const id = `c${++room.nextColumn}`;
  sheet.columns.push(playerId ? { id, name, playerId } : { id, name });
  if (sheet.current === null) setTurn(sheet, id);
  return true;
}

/** Zug wechseln – ein laufender digitaler Wurf gehört zum alten Zug und verfällt. */
export function setTurn(sheet: KniffelState, column: string | null) {
  if (sheet.current !== column) sheet.roll = null;
  sheet.current = column;
}

/** `lastEntry` passend zum Verlauf setzen (für den Rückgängig-Knopf). */
export function syncLastEntry(room: Room) {
  if (!room.kniffel) return;
  const previous = room.kniffelHistory.at(-1);
  room.kniffel.lastEntry = previous
    ? { column: previous.column, category: previous.category }
    : null;
}

/**
 * Feld eintragen (null = leeren). Ein neuer Eintrag beendet den Zug dieser Spalte, Korrekturen
 * ändern nichts an der Reihenfolge. false = ungültiger Wert. Die Berechtigung prüft der Aufrufer.
 */
export function writeCell(
  room: Room,
  column: string,
  category: Category,
  value: number | null,
): boolean {
  const sheet = room.kniffel;
  if (!sheet || !CATEGORIES.includes(category)) return false;
  if (value !== null && !allowedValues(category).includes(value)) return false;

  const cells = (sheet.cells[column] ??= {});
  const step: KniffelStep = {
    column,
    category,
    before: cells[category],
    current: sheet.current,
    roll: sheet.roll && structuredClone(sheet.roll),
  };
  if (value === null) delete cells[category];
  else {
    const isNew = cells[category] === undefined;
    cells[category] = value;
    if (isNew) setTurn(sheet, nextTurn(sheet, column));
  }
  // Nach dem Löschen eines Eintrags kann wieder jemand dran sein.
  if (sheet.current === null) setTurn(sheet, nextTurn(sheet, column));

  if (cells[category] !== step.before) {
    room.kniffelHistory.push(step);
    if (room.kniffelHistory.length > MAX_UNDO) room.kniffelHistory.shift();
    syncLastEntry(room);
  }
  return true;
}

/** Spalte samt Einträgen und Verlauf entfernen; war sie dran, ist die nächste dran. */
export function removeColumn(room: Room, column: string) {
  const sheet = room.kniffel;
  if (!sheet) return;
  if (sheet.current === column) {
    const next = nextTurn(sheet, column);
    setTurn(sheet, next === column ? null : next);
  }
  sheet.columns = sheet.columns.filter((col) => col.id !== column);
  delete sheet.cells[column];
  room.kniffelHistory = room.kniffelHistory.filter((step) => step.column !== column);
  syncLastEntry(room);
}

/** Digital würfeln (gehaltene Würfel bleiben liegen). false = kein Wurf mehr übrig. */
export function rollDice(sheet: KniffelState): boolean {
  const roll = (sheet.roll ??= {
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    count: 0,
  });
  if (roll.count >= MAX_ROLLS || (roll.count > 0 && roll.held.every(Boolean))) return false;
  roll.dice = roll.dice.map((d, i) => (roll.count > 0 && roll.held[i] ? d : randomInt(1, 7)));
  roll.count++;
  return true;
}
