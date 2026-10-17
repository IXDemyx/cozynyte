/** Öffentliche Räume: Zufallssuche und Übersicht für die Startseite. */

import { hasEntries } from "../../shared/kniffel";
import { PUBLIC_GAMES, type Game, type OpenRooms } from "../../shared/types";
import { MAX_PLAYERS } from "./config";
import { humans, rooms, type Room } from "./state";

/** Kann man diesem Raum gerade als Fremder beitreten? Nur öffentlich, in der Lobby, mit Platz. */
function joinable(room: Room): boolean {
  return (
    room.settings.isPublic &&
    PUBLIC_GAMES.includes(room.game) &&
    room.phase === "lobby" &&
    room.players.size < MAX_PLAYERS &&
    humans(room).some((p) => p.socketId) &&
    // Kniffel hat keine Lobby: offen nur, solange noch nichts im Block steht.
    !(room.kniffel && hasEntries(room.kniffel))
  );
}

/**
 * Raum öffentlich machen oder wieder privat. Kniffel öffentlich: Spalten fest gesperrt, Spalten
 * ohne Handy nur für den Host. Wieder privat: Sperre bleibt, der Host kann sie aufheben.
 */
export function setPublic(room: Room, isPublic: boolean) {
  if (!PUBLIC_GAMES.includes(room.game)) return;
  room.settings.isPublic = isPublic;
  if (room.kniffel) {
    room.kniffel.strict = isPublic;
    if (isPublic) room.kniffel.locked = true;
  }
}

/**
 * Passenden öffentlichen Raum suchen: optional nur ein bestimmtes Spiel. Bevorzugt Räume in der
 * eigenen Sprache und dann die volleren – so füllen sich Räume, statt dass alle allein warten.
 */
export function findPublicRoom(game: Game | undefined, language: string): Room | undefined {
  const candidates = [...rooms.values()].filter(
    (room) => joinable(room) && (!game || room.game === game),
  );
  candidates.sort(
    (a, b) =>
      Number(b.language === language) - Number(a.language === language) ||
      humans(b).length - humans(a).length,
  );
  return candidates[0];
}

export function openRooms(): OpenRooms {
  const byGame: OpenRooms["byGame"] = {};
  let total = 0;
  for (const room of rooms.values()) {
    if (!joinable(room)) continue;
    total++;
    byGame[room.game] = (byGame[room.game] ?? 0) + 1;
  }
  return { total, byGame };
}
