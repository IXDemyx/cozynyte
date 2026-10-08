/** Spieler mit einer Socket-Verbindung verknüpfen bzw. lösen; Host-Wechsel. */

import type { Socket } from "socket.io";
import { LOBBY_GRACE_MS } from "./config";
import { io } from "./server";
import { connected, rooms, type Player, type Room } from "./state";
import { broadcast } from "./view";

/** Ist der Host weg, übernimmt der nächste verbundene Spieler. */
export function ensureHost(room: Room) {
  const host = room.players.get(room.hostId);
  if (host?.socketId) return;
  const next = connected(room)[0];
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
  if (connected(room).length === 0) room.emptySince = Date.now();
  broadcast(room);
}
