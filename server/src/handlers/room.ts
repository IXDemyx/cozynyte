/** Räume: erstellen, beitreten, verlassen, Einstellungen, Partie starten und Host-Werkzeuge. */

import { MAX_PLAYERS, MAX_SONGS_PER_PLAYER, ROUND_SECONDS, TIMELINE_GOALS } from "../config";
import { attach, detach, removePlayer } from "../connection";
import { ensureColumn } from "../games/kniffel";
import { drawStartCard, endRound, nextRound, startPicking } from "../games/music";
import { io } from "../server";
import { cleanName, connected, createPlayer, createRoom, newCode, rooms } from "../state";
import { broadcast } from "../view";
import type { Handlers } from "./context";

export function registerRoomHandlers({ socket, ctx, reply }: Handlers) {
  socket.on("room:create", (data, cb) => {
    const name = cleanName(data?.name);
    const playerId = String(data?.playerId ?? "");
    if (!name || playerId.length < 8) return reply(cb, { ok: false, error: "name_required" });
    detach(socket, true);

    const game = ["year", "timeline", "kniffel"].includes(data?.game) ? data.game : "song";
    const room = createRoom(newCode(), game, playerId);
    const player = createPlayer(playerId, name);
    room.players.set(playerId, player);
    rooms.set(room.code, room);
    ensureColumn(room, player);
    attach(socket, room, player);
    reply(cb, { ok: true, code: room.code });
    broadcast(room);
  });

  socket.on("room:join", (data, cb) => {
    const code = String(data?.code ?? "").toUpperCase();
    const name = cleanName(data?.name);
    const playerId = String(data?.playerId ?? "");
    const room = rooms.get(code);
    if (!room) return reply(cb, { ok: false, error: "room_not_found" });
    if (!name || playerId.length < 8) return reply(cb, { ok: false, error: "name_required" });
    if (room.banned.has(playerId)) return reply(cb, { ok: false, error: "kicked" });

    let player = room.players.get(playerId);
    if (!player) {
      if (room.players.size >= MAX_PLAYERS) return reply(cb, { ok: false, error: "room_full" });
      // Später beitreten ist erlaubt: mitten im Spiel rät man ab sofort mit, nur ohne eigene Songs.
      player = createPlayer(playerId, name);
      room.players.set(playerId, player);
      if (room.game === "timeline" && (room.phase === "round" || room.phase === "reveal")) {
        drawStartCard(room, player);
        room.turnOrder.push(player.id);
      }
    } else {
      player.name = name;
    }
    ensureColumn(room, player);
    if (socket.data.code && socket.data.code !== code) detach(socket, true);
    attach(socket, room, player);
    reply(cb, { ok: true });
    broadcast(room);
  });

  socket.on("room:leave", () => detach(socket, true));
  socket.on("disconnect", () => detach(socket, false));

  socket.on("settings:update", (data) => {
    const c = ctx();
    if (!c || !c.isHost || c.room.phase !== "lobby") return;
    const { settings } = c.room;

    const songs = Number(data?.songsPerPlayer);
    if (Number.isInteger(songs) && songs >= 1 && songs <= MAX_SONGS_PER_PLAYER) {
      settings.songsPerPlayer = songs;
    }
    const seconds = Number(data?.roundSeconds);
    if (ROUND_SECONDS.includes(seconds)) settings.roundSeconds = seconds;
    if (data?.timelineMode === "together" || data?.timelineMode === "turns") {
      settings.timelineMode = data.timelineMode;
    }
    const goal = Number(data?.timelineGoal);
    if (TIMELINE_GOALS.includes(goal)) settings.timelineGoal = goal;
    if (typeof data?.showSong === "boolean") settings.showSong = data.showSong;
    if (typeof data?.theme === "string") {
      settings.theme = data.theme.replace(/\s+/g, " ").trimStart().slice(0, 40);
    }
    // Zwischen den Musikspielen umschalten; ein Kniffel-Raum bleibt ein Kniffel-Raum.
    if (["song", "year", "timeline"].includes(data?.game) && c.room.game !== "kniffel") {
      c.room.game = data.game;
    }
    broadcast(c.room);
  });

  socket.on("game:start", (cb) => {
    const c = ctx();
    if (!c || !c.isHost || (c.room.phase !== "lobby" && c.room.phase !== "finished")) return;
    if (c.room.game === "kniffel") return;
    if (connected(c.room).length < 2) return reply(cb, { ok: false, error: "need_two_players" });
    // Wer nicht mehr verbunden ist, spielt die neue Partie nicht mit.
    for (const p of [...c.room.players.values()]) if (!p.socketId) c.room.players.delete(p.id);
    startPicking(c.room);
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("game:lobby", () => {
    const c = ctx();
    if (!c || !c.isHost || c.room.phase !== "finished") return;
    c.room.phase = "lobby";
    for (const p of [...c.room.players.values()]) {
      p.score = 0;
      p.picks = [];
      p.timeline = [];
      if (!p.socketId) c.room.players.delete(p.id);
    }
    broadcast(c.room);
  });

  // Host-Werkzeug: laufenden Song abbrechen und direkt auflösen.
  socket.on("round:skip", () => {
    const c = ctx();
    if (c?.isHost) endRound(c.room);
  });

  socket.on("round:next", () => {
    const c = ctx();
    if (c?.isHost) nextRound(c.room);
  });

  // Host-Werkzeug: Spieler aus dem Raum entfernen.
  socket.on("player:kick", (data) => {
    const c = ctx();
    const targetId = String(data?.playerId ?? "");
    const target = c?.room.players.get(targetId);
    if (!c || !c.isHost || !target || targetId === c.player.id) return;
    const { room } = c;

    room.banned.add(targetId);
    const targetSocket = target.socketId ? io.sockets.sockets.get(target.socketId) : undefined;
    if (targetSocket) {
      targetSocket.data.code = undefined;
      targetSocket.emit("room:kicked", { code: room.code });
    }
    removePlayer(room, targetId);
    broadcast(room);
  });
}
