/** Räume: erstellen, beitreten, verlassen, Einstellungen, Partie starten und Host-Werkzeuge. */

import {
  MAX_CATEGORIES,
  MAX_CATEGORY_LENGTH,
  MIN_CATEGORIES,
  SLF_ROUNDS,
  SLF_SECONDS,
} from "../../../shared/slf";
import { DRAW_ROUNDS, DRAW_SECONDS, DRAW_WORDS_PER_PLAYER } from "../../../shared/draw";
import { QUIZ_JOKERS, QUIZ_QUESTIONS, QUIZ_SECONDS } from "../../../shared/countries";
import { MUSIC_GAMES } from "../../../shared/types";
import { MAX_PLAYERS, MAX_SONGS_PER_PLAYER, ROUND_SECONDS, TIMELINE_GOALS } from "../config";
import { attach, detach, removePlayer } from "../connection";
import { addSeat, startDraw, startWordCollection } from "../games/draw";
import { startGeo, stopTimers as stopGeoTimers } from "../games/geo";
import { ensureColumn } from "../games/kniffel";
import { drawStartCard, endRound, nextRound, startPicking } from "../games/music";
import { startSlf } from "../games/slf";
import { io } from "../server";
import { allowAttempt } from "../limits";
import {
  cleanName,
  connected,
  createPlayer,
  createRoom,
  newCode,
  newPlayerId,
  rooms,
} from "../state";
import { broadcast } from "../view";
import type { Handlers } from "./context";

/** Gleicher Name? (Groß-/Kleinschreibung und Leerzeichen egal) */
function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function registerRoomHandlers({ socket, ctx, reply }: Handlers) {
  socket.on("room:create", (data, cb) => {
    const name = cleanName(data?.name);
    // Der Client nennt das Feld playerId – es ist aber sein geheimer Schlüssel (siehe Player.key).
    const key = String(data?.playerId ?? "").slice(0, 100);
    if (!name || key.length < 8) return reply(cb, { ok: false, error: "name_required" });
    if (!allowAttempt("create", socket))
      return reply(cb, { ok: false, error: "too_many_attempts" });
    detach(socket, true);

    const game = ["year", "timeline", "kniffel", "slf", "draw", "geo"].includes(data?.game)
      ? data.game
      : "song";
    const playerId = newPlayerId();
    const room = createRoom(newCode(), game, playerId);
    const player = createPlayer(playerId, name);
    player.key = key;
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
    const key = String(data?.playerId ?? "").slice(0, 100);
    const room = rooms.get(code);
    // Fehlversuche zählen: sonst ließen sich offene Räume per Script durchprobieren.
    if (!room) {
      const allowed = allowAttempt("join", socket);
      return reply(cb, { ok: false, error: allowed ? "room_not_found" : "too_many_attempts" });
    }
    if (!name || key.length < 8) return reply(cb, { ok: false, error: "name_required" });
    if (room.banned.has(key)) return reply(cb, { ok: false, error: "kicked" });

    let player = [...room.players.values()].find((p) => p.key === key);
    // Unbekannte ID, aber gleicher Name wie jemand, der gerade nicht verbunden ist: Das ist sehr
    // wahrscheinlich dieselbe Person auf neuem Tab/Gerät (Handy hat den Tab verworfen, Link neu
    // geöffnet …) – sie übernimmt ihren Platz samt Punkten, statt doppelt mitzuspielen.
    if (!player) {
      player = [...room.players.values()].find(
        (p) => !p.socketId && !p.bot && sameName(p.name, name),
      );
    }
    if (!player) {
      if (room.players.size >= MAX_PLAYERS) return reply(cb, { ok: false, error: "room_full" });
      // Später beitreten ist erlaubt: mitten im Spiel rät man ab sofort mit, nur ohne eigene Songs.
      player = createPlayer(newPlayerId(), name);
      room.players.set(player.id, player);
      if (room.game === "timeline" && (room.phase === "round" || room.phase === "reveal")) {
        drawStartCard(room, player);
        room.turnOrder.push(player.id);
      }
      if (room.game === "draw" && room.phase === "round") addSeat(room, player);
      // Kniffel: Wer länger weg war, ist aus der Spielerliste raus – seine Spalte aber noch da.
      const orphan = room.kniffel?.columns.find(
        (c) => c.playerId && !room.players.has(c.playerId) && sameName(c.name, name),
      );
      if (orphan) orphan.playerId = player.id;
    } else {
      player.name = name;
    }
    // Wer per Namen einen Platz übernimmt, meldet sich ab jetzt mit seinem eigenen Schlüssel an.
    player.key = key;
    ensureColumn(room, player);
    if (socket.data.code && socket.data.code !== code) detach(socket, true);
    attach(socket, room, player);
    reply(cb, { ok: true, playerId: player.id });
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
    // Stadt Land Fluss
    if (Array.isArray(data?.slfCategories)) {
      const categories = [
        ...new Set(
          data.slfCategories
            .map((c: unknown) =>
              String(c ?? "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, MAX_CATEGORY_LENGTH),
            )
            .filter(Boolean),
        ),
      ] as string[];
      if (categories.length >= MIN_CATEGORIES && categories.length <= MAX_CATEGORIES) {
        settings.slfCategories = categories;
      }
    }
    const slfRounds = Number(data?.slfRounds);
    if (SLF_ROUNDS.includes(slfRounds)) settings.slfRounds = slfRounds;
    const slfSeconds = Number(data?.slfSeconds);
    if (SLF_SECONDS.includes(slfSeconds)) settings.slfSeconds = slfSeconds;
    if (typeof data?.slfHardLetters === "boolean") settings.slfHardLetters = data.slfHardLetters;
    if (data?.slfLetterMode === "random" || data?.slfLetterMode === "recite") {
      settings.slfLetterMode = data.slfLetterMode;
    }
    // Montagsmaler
    const drawRounds = Number(data?.drawRounds);
    if (DRAW_ROUNDS.includes(drawRounds)) settings.drawRounds = drawRounds;
    const drawSeconds = Number(data?.drawSeconds);
    if (DRAW_SECONDS.includes(drawSeconds)) settings.drawSeconds = drawSeconds;
    if (data?.drawLanguage === "de" || data?.drawLanguage === "en") {
      settings.drawLanguage = data.drawLanguage;
    }
    if (data?.drawWordMode === "standard" || data?.drawWordMode === "players") {
      settings.drawWordMode = data.drawWordMode;
    }
    const perPlayer = Number(data?.drawWordsPerPlayer);
    if (DRAW_WORDS_PER_PLAYER.includes(perPlayer)) settings.drawWordsPerPlayer = perPlayer;
    // Länder-Quiz
    if (["flag", "outline", "capital", "mix"].includes(data?.geoMode))
      settings.geoMode = data.geoMode;
    if (["world", "eu", "as", "af", "am", "oc"].includes(data?.geoRegion)) {
      settings.geoRegion = data.geoRegion;
    }
    if (typeof data?.geoKnownOnly === "boolean") settings.geoKnownOnly = data.geoKnownOnly;
    if (data?.geoAnswer === "type" || data?.geoAnswer === "choice") {
      settings.geoAnswer = data.geoAnswer;
    }
    const geoQuestions = Number(data?.geoQuestions);
    if (QUIZ_QUESTIONS.includes(geoQuestions)) settings.geoQuestions = geoQuestions;
    const geoSeconds = Number(data?.geoSeconds);
    if (QUIZ_SECONDS.includes(geoSeconds)) settings.geoSeconds = geoSeconds;
    if (typeof data?.geoHints === "boolean") settings.geoHints = data.geoHints;
    const geoJokers = Number(data?.geoJokers);
    if (QUIZ_JOKERS.includes(geoJokers)) settings.geoJokers = geoJokers;
    if (typeof data?.theme === "string") {
      settings.theme = data.theme.replace(/\s+/g, " ").trimStart().slice(0, 40);
    }
    // Zwischen den Musikspielen umschalten; Kniffel- und Stadt-Land-Fluss-Räume bleiben, was sie sind.
    if (MUSIC_GAMES.includes(data?.game) && MUSIC_GAMES.includes(c.room.game)) {
      c.room.game = data.game;
    }
    broadcast(c.room);
  });

  socket.on("game:start", (cb) => {
    const c = ctx();
    if (!c || !c.isHost || (c.room.phase !== "lobby" && c.room.phase !== "finished")) return;
    if (c.room.game === "kniffel") return;
    if (connected(c.room).length < 2) return reply(cb, { ok: false, error: "need_two_players" });
    c.room.notice = undefined;
    // Wer nicht mehr verbunden ist, spielt die neue Partie nicht mit.
    for (const p of [...c.room.players.values()]) if (!p.socketId) c.room.players.delete(p.id);
    if (c.room.game === "slf") startSlf(c.room);
    else if (c.room.game === "geo") startGeo(c.room);
    else if (c.room.game === "draw") {
      if (c.room.settings.drawWordMode === "players") startWordCollection(c.room);
      else startDraw(c.room);
    } else startPicking(c.room);
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  // Zurück zur Lobby: nach dem Endstand – oder mitten im Spiel, z. B. bei falschen Einstellungen.
  // Laufende Timer werden gestoppt, die Partie verworfen. Kniffel hat keine Lobby.
  socket.on("game:lobby", () => {
    const c = ctx();
    if (!c || !c.isHost || c.room.phase === "lobby" || c.room.game === "kniffel") return;
    const { room } = c;
    // Mittendrin abgebrochen: Die anderen bekommen in der Lobby einen Hinweis, was passiert ist.
    room.notice =
      room.phase === "finished"
        ? undefined
        : { id: Date.now(), kind: "aborted", name: c.player.name };
    clearTimeout(room.round?.timer);
    room.round?.hintTimers.forEach(clearTimeout);
    clearTimeout(room.revealTimer);
    clearTimeout(room.slf?.timer);
    clearTimeout(room.draw?.timer);
    room.draw?.hintTimers.forEach(clearTimeout);
    stopGeoTimers(room.geo);
    room.round = undefined;
    room.queue = [];
    room.roundIndex = 0;
    room.timelineOver = false;
    room.activeId = undefined;
    room.phase = "lobby";
    room.slf = undefined;
    room.draw = undefined;
    room.geo = undefined;
    for (const p of [...c.room.players.values()]) {
      p.score = 0;
      p.picks = [];
      p.timeline = [];
      p.misses = [];
      p.words = [];
      if (!p.socketId) c.room.players.delete(p.id);
    }
    broadcast(c.room);
  });

  // Host-Werkzeug: laufenden Song abbrechen und direkt auflösen.
  socket.on("round:skip", () => {
    const c = ctx();
    if (c?.isHost && MUSIC_GAMES.includes(c.room.game)) endRound(c.room);
  });

  socket.on("round:next", () => {
    const c = ctx();
    if (c?.isHost && MUSIC_GAMES.includes(c.room.game)) nextRound(c.room);
  });

  // Host-Werkzeug: die Host-Rolle an einen anderen (verbundenen) Spieler abgeben.
  socket.on("host:transfer", (data) => {
    const c = ctx();
    const target = c?.room.players.get(String(data?.playerId ?? ""));
    if (!c || !c.isHost || !target || target === c.player || !target.socketId || target.bot) return;
    c.room.hostId = target.id;
    broadcast(c.room);
  });

  // Host-Werkzeug: Spieler aus dem Raum entfernen.
  socket.on("player:kick", (data) => {
    const c = ctx();
    const targetId = String(data?.playerId ?? "");
    const target = c?.room.players.get(targetId);
    if (!c || !c.isHost || !target || targetId === c.player.id) return;
    const { room } = c;

    if (target.key) room.banned.add(target.key);
    const targetSocket = target.socketId ? io.sockets.sockets.get(target.socketId) : undefined;
    if (targetSocket) {
      targetSocket.data.code = undefined;
      targetSocket.emit("room:kicked", { code: room.code });
    }
    removePlayer(room, targetId);
    broadcast(room);
  });
}
