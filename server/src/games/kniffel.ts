/** Kniffel-Block: Spalten, Zugreihenfolge und Verlauf zum Rückgängigmachen. */

import type { KniffelState } from "../../../shared/kniffel";
import { MAX_COLUMNS } from "../config";
import type { Player, Room } from "../state";

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
