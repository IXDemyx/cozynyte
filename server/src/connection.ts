/** Spieler mit einer Socket-Verbindung verknüpfen bzw. lösen; Host-Wechsel. */

import type { Socket } from "socket.io";
import { LOBBY_GRACE_MS } from "./config";
import { checkTurnDone } from "./games/draw";
import { removeColumn } from "./games/kniffel";
import { endRound, everyoneDone } from "./games/music";
import { io } from "./server";
import { humans, rooms, type Player, type Room } from "./state";
import { broadcast } from "./view";

/** Ist der Host weg, übernimmt der nächste verbundene Mensch. */
export function ensureHost(room: Room) {
  const host = room.players.get(room.hostId);
  if (host?.socketId && !host.bot) return;
  const next = humans(room)[0];
  if (next) room.hostId = next.id;
}

export function attach(socket: Socket, room: Room, player: Player) {
  // Derselbe Spieler in einem zweiten Fenster: die alte Verbindung wird getrennt.
  if (player.socketId && player.socketId !== socket.id) {
    io.sockets.sockets.get(player.socketId)?.disconnect(true);
  }
  clearTimeout(player.removeTimer);
  player.socketId = socket.id;
  socket.data.code = room.code;
  socket.data.playerId = player.id;
  room.emptySince = undefined;
  ensureHost(room);
}

/** `leave` = bewusst verlassen; sonst nur Verbindung verloren (Spieler darf zurückkommen). */
export function detach(socket: Socket, leave: boolean) {
  const room = rooms.get(socket.data.code);
  const player = room?.players.get(socket.data.playerId);
  socket.data.code = undefined;
  if (!room || !player || player.socketId !== socket.id) return;
  player.socketId = undefined;

  const remove = () => {
    if (player.socketId) return;
    room.players.delete(player.id);
    ensureHost(room);
    broadcast(room);
  };
  if (room.phase === "lobby") {
    if (leave) room.players.delete(player.id);
    else player.removeTimer = setTimeout(remove, LOBBY_GRACE_MS);
  }
  ensureHost(room);
  // Montagsmaler: Ist der Zeichner weg (oder haben jetzt alle Übrigen geraten), geht es weiter.
  checkTurnDone(room);
  // Nur noch Testbots da: der Raum gilt als leer und wird irgendwann aufgeräumt.
  if (humans(room).length === 0) room.emptySince = Date.now();
  broadcast(room);
}

/**
 * Spieler aus dem Raum nehmen (Host-Werkzeug bzw. Testbots). Seine noch nicht gespielten Songs
 * fliegen aus der Warteschlange; `withColumn` entfernt auch seine Kniffel-Spalte.
 */
export function removePlayer(room: Room, playerId: string, withColumn = false) {
  const player = room.players.get(playerId);
  if (!player) return;
  clearTimeout(player.removeTimer);
  room.players.delete(playerId);
  if (withColumn) {
    const column = room.kniffel?.columns.find((c) => c.playerId === playerId);
    if (column) removeColumn(room, column.id);
  }

  const played = room.phase === "picking" ? -1 : room.roundIndex;
  room.queue = room.queue.filter((q, i) => i <= played || q.pickerId !== playerId);
  checkTurnDone(room);
  const { round } = room;
  if (room.phase === "round" && round) {
    if (round.pickerId === playerId || everyoneDone(room, round)) endRound(room);
  }
}
