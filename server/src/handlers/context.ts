/** Gemeinsame Helfer für alle Socket-Handler. */

import type { Socket } from "socket.io";
import type { Ack } from "../../../shared/types";
import { rooms, type Player, type Room } from "../state";

export interface Context {
  room: Room;
  player: Player;
  isHost: boolean;
}

export interface Handlers {
  socket: Socket;
  /** Raum und Spieler dieser Verbindung – undefined, solange sie in keinem Raum ist. */
  ctx: () => Context | undefined;
  /** Antwort an den Absender, falls er eine Rückmeldung erwartet. */
  reply: <T>(cb: unknown, value: Ack<T>) => void;
}

export function createHandlers(socket: Socket): Handlers {
  return {
    socket,
    ctx: () => {
      const room = rooms.get(socket.data.code);
      const player = room?.players.get(socket.data.playerId);
      return room && player ? { room, player, isHost: room.hostId === player.id } : undefined;
    },
    reply: (cb, value) => {
      if (typeof cb === "function") cb(value);
    },
  };
}
