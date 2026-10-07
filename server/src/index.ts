import express from "express";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server, type Socket } from "socket.io";
import type {
  Ack,
  FeedItem,
  Phase,
  RoomState,
  Settings,
  Track,
} from "../../shared/types";
import { getCachedTrack, searchTracks } from "./itunes";
import { maskTitle, matchGuess } from "./match";

const PORT = Number(process.env.PORT ?? 3001);
const REVEAL_MS = Number(process.env.REVEAL_MS ?? 9000);
const MAX_PLAYERS = 12;
const LOBBY_GRACE_MS = 15_000;
const ROOM_TTL_MS = 10 * 60_000;

interface Player {
  id: string;
  name: string;
  score: number;
  socketId?: string;
  picks: Track[];
  removeTimer?: NodeJS.Timeout;
}

interface Round {
  track: Track;
  pickerId: string;
  startedAt: number;
  endsAt: number;
  got: Map<string, { title: boolean; artist: boolean }>;
  gains: Map<string, number>;
  feed: FeedItem[];
  timer: NodeJS.Timeout;
}

interface Room {
  code: string;
  hostId: string;
  phase: Phase;
  settings: Settings;
  players: Map<string, Player>;
  queue: { track: Track; pickerId: string }[];
  roundIndex: number;
  round?: Round;
  revealNextAt: number;
  revealTimer?: NodeJS.Timeout;
  emptySince?: number;
}

const rooms = new Map<string, Room>();
let feedId = 0;

const app = express();
const http = createServer(app);
const io = new Server(http, { cors: { origin: true } });

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

// Im Produktivbetrieb liefert der Server auch das gebaute Frontend aus.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

/* ---------- Hilfsfunktionen ---------- */

function newCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (;;) {
    let code = "";
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    if (!rooms.has(code)) return code;
  }
}

function cleanName(name: unknown): string {
  return String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 16);
}

function shuffle<T>(list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function connected(room: Room): Player[] {
  return [...room.players.values()].filter((p) => p.socketId);
}

function view(room: Room, playerId: string): RoomState {
  const round = room.round;
  const me = room.players.get(playerId);
  const state: RoomState = {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    you: playerId,
    settings: room.settings,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: Boolean(p.socketId),
      picked: p.picks.length,
      gotTitle: round?.got.get(p.id)?.title ?? false,
      gotArtist: round?.got.get(p.id)?.artist ?? false,
    })),
    myPicks: room.phase === "picking" ? (me?.picks ?? []) : [],
    serverNow: Date.now(),
  };

  if (room.phase === "round" && round) {
    state.round = {
      index: room.roundIndex,
      total: room.queue.length,
      previewUrl: round.track.previewUrl,
      endsAt: round.endsAt,
      durationMs: round.endsAt - round.startedAt,
      youArePicker: round.pickerId === playerId,
      titleMask: maskTitle(round.track.title),
      feed: round.feed.slice(-40),
    };
  }
  if (room.phase === "reveal" && round) {
    state.reveal = {
      index: room.roundIndex,
      total: room.queue.length,
      track: round.track,
      pickerId: round.pickerId,
      gains: Object.fromEntries(round.gains),
      nextAt: room.revealNextAt,
      isLast: room.roundIndex >= room.queue.length - 1,
    };
  }
  return state;
}

function broadcast(room: Room) {
  for (const p of room.players.values()) {
    if (p.socketId) io.to(p.socketId).emit("room:state", view(room, p.id));
  }
}

function ensureHost(room: Room) {
  const host = room.players.get(room.hostId);
  if (host?.socketId) return;
  const next = connected(room)[0];
  if (next) room.hostId = next.id;
}

/* ---------- Spielablauf ---------- */

function startPicking(room: Room) {
  for (const p of room.players.values()) {
    p.picks = [];
    p.score = 0;
  }
  room.queue = [];
  room.roundIndex = 0;
  room.round = undefined;
  room.phase = "picking";
}

function allPicked(room: Room): boolean {
  const active = connected(room);
  return active.length >= 2 && active.every((p) => p.picks.length >= room.settings.songsPerPlayer);
}

function startRounds(room: Room) {
  room.queue = shuffle(
    [...room.players.values()].flatMap((p) => p.picks.map((track) => ({ track, pickerId: p.id }))),
  );
  // Möglichst nicht zweimal hintereinander ein Song desselben Spielers.
  for (let i = 1; i < room.queue.length; i++) {
    if (room.queue[i].pickerId !== room.queue[i - 1].pickerId) continue;
    const swap = room.queue.findIndex((q, j) => j > i && q.pickerId !== room.queue[i].pickerId);
    if (swap > 0) [room.queue[i], room.queue[swap]] = [room.queue[swap], room.queue[i]];
  }
  room.roundIndex = 0;
  startRound(room);
}

function startRound(room: Room) {
  const entry = room.queue[room.roundIndex];
  const now = Date.now();
  const duration = room.settings.roundSeconds * 1000;
  room.round = {
    track: entry.track,
    pickerId: entry.pickerId,
    startedAt: now,
    endsAt: now + duration,
    got: new Map(),
    gains: new Map(),
    feed: [],
    timer: setTimeout(() => endRound(room), duration),
  };
  room.phase = "round";
}

function endRound(room: Room) {
  const round = room.round;
  if (!round || room.phase !== "round") return;
  clearTimeout(round.timer);
  room.phase = "reveal";
  room.revealNextAt = Date.now() + REVEAL_MS;
  room.revealTimer = setTimeout(() => nextRound(room), REVEAL_MS);
  broadcast(room);
}

function nextRound(room: Room) {
  if (room.phase !== "reveal") return;
  clearTimeout(room.revealTimer);
  if (room.roundIndex >= room.queue.length - 1) {
    room.phase = "finished";
    room.round = undefined;
  } else {
    room.roundIndex++;
    startRound(room);
  }
  broadcast(room);
}

function addPoints(room: Room, round: Round, playerId: string, points: number) {
  const player = room.players.get(playerId);
  if (!player) return;
  player.score += points;
  round.gains.set(playerId, (round.gains.get(playerId) ?? 0) + points);
}

function handleGuess(room: Room, player: Player, raw: unknown) {
  const round = room.round;
  if (room.phase !== "round" || !round) return;
  const text = String(raw ?? "").trim().slice(0, 80);
  if (!text) return;

  const result = matchGuess(text, round.track);
  // Alles, was der Lösung entspricht oder nahekommt, wird nie als Text weitergegeben.
  const spoils = result.title !== "none" || result.artist !== "none";

  // Wer den Song gewählt hat, rät nicht mit, darf aber chatten.
  if (round.pickerId === player.id) {
    if (spoils) return;
    round.feed.push({ id: ++feedId, playerId: player.id, name: player.name, kind: "wrong", text });
    return broadcast(room);
  }

  const got = round.got.get(player.id) ?? { title: false, artist: false };
  round.got.set(player.id, got);

  const remaining = Math.max(0, (round.endsAt - Date.now()) / (round.endsAt - round.startedAt));
  const push = (kind: FeedItem["kind"], withText = false) =>
    round.feed.push({
      id: ++feedId,
      playerId: player.id,
      name: player.name,
      kind,
      ...(withText ? { text } : {}),
    });

  let hit = false;
  if (result.title === "exact" && !got.title) {
    got.title = true;
    hit = true;
    addPoints(room, round, player.id, 50 + Math.round(50 * remaining));
    addPoints(room, round, round.pickerId, 15); // Bonus für den, der den Song gewählt hat
    push("title");
  }
  if (result.artist === "exact" && !got.artist) {
    got.artist = true;
    hit = true;
    addPoints(room, round, player.id, 25 + Math.round(25 * remaining));
    push("artist");
  }
  if (!hit) {
    const close =
      (result.title === "close" && !got.title) || (result.artist === "close" && !got.artist);
    if (close) push("close");
    else if (!spoils) push("wrong", true); // normaler Tipp bzw. Chatnachricht
  }

  const guessers = connected(room).filter((p) => p.id !== round.pickerId);
  const done = guessers.length > 0 && guessers.every((p) => {
    const g = round.got.get(p.id);
    return g?.title && g?.artist;
  });
  if (done) endRound(room);
  else broadcast(room);
}

/* ---------- Verbindungen ---------- */

function attach(socket: Socket, room: Room, player: Player) {
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

function detach(socket: Socket, leave: boolean) {
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
  if (room.phase === "picking" && allPicked(room)) startRounds(room);
  broadcast(room);
}

io.on("connection", (socket) => {
  const ctx = () => {
    const room = rooms.get(socket.data.code);
    const player = room?.players.get(socket.data.playerId);
    return room && player ? { room, player, isHost: room.hostId === player.id } : undefined;
  };
  const reply = <T>(cb: unknown, value: Ack<T>) => {
    if (typeof cb === "function") cb(value);
  };

  socket.on("room:create", (data, cb) => {
    const name = cleanName(data?.name);
    const playerId = String(data?.playerId ?? "");
    if (!name || playerId.length < 8) return reply(cb, { ok: false, error: "name_required" });
    detach(socket, true);
    const room: Room = {
      code: newCode(),
      hostId: playerId,
      phase: "lobby",
      settings: { songsPerPlayer: 3, roundSeconds: 30 },
      players: new Map(),
      queue: [],
      roundIndex: 0,
      revealNextAt: 0,
    };
    const player: Player = { id: playerId, name, score: 0, picks: [] };
    room.players.set(playerId, player);
    rooms.set(room.code, room);
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

    let player = room.players.get(playerId);
    if (!player) {
      if (room.players.size >= MAX_PLAYERS) return reply(cb, { ok: false, error: "room_full" });
      if (room.phase !== "lobby" && room.phase !== "finished") {
        return reply(cb, { ok: false, error: "game_running" });
      }
      player = { id: playerId, name, score: 0, picks: [] };
      room.players.set(playerId, player);
    } else {
      player.name = name;
    }
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
    const songs = Number(data?.songsPerPlayer);
    const seconds = Number(data?.roundSeconds);
    if (Number.isInteger(songs) && songs >= 1 && songs <= 5) c.room.settings.songsPerPlayer = songs;
    if ([15, 20, 30].includes(seconds)) c.room.settings.roundSeconds = seconds;
    broadcast(c.room);
  });

  socket.on("game:start", (cb) => {
    const c = ctx();
    if (!c || !c.isHost || (c.room.phase !== "lobby" && c.room.phase !== "finished")) return;
    if (connected(c.room).length < 2) {
      return reply(cb, { ok: false, error: "need_two_players" });
    }
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
      if (!p.socketId) c.room.players.delete(p.id);
    }
    broadcast(c.room);
  });

  socket.on("songs:search", async (data, cb) => {
    const c = ctx();
    const term = String(data?.term ?? "").trim().slice(0, 80);
    if (!c || term.length < 2) return reply(cb, { ok: true, tracks: [] });
    try {
      reply(cb, { ok: true, tracks: await searchTracks(term) });
    } catch {
      reply(cb, { ok: false, error: "search_unavailable" });
    }
  });

  socket.on("songs:add", (data, cb) => {
    const c = ctx();
    if (!c || c.room.phase !== "picking") return;
    const track = getCachedTrack(Number(data?.trackId));
    if (!track) return reply(cb, { ok: false, error: "track_not_found" });
    if (c.player.picks.length >= c.room.settings.songsPerPlayer) {
      return reply(cb, { ok: false, error: "picks_full" });
    }
    const taken = [...c.room.players.values()].some((p) => p.picks.some((t) => t.id === track.id));
    if (taken) return reply(cb, { ok: false, error: "track_taken" });
    c.player.picks.push(track);
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("songs:remove", (data) => {
    const c = ctx();
    if (!c || c.room.phase !== "picking") return;
    c.player.picks = c.player.picks.filter((t) => t.id !== Number(data?.trackId));
    broadcast(c.room);
  });

  // Start, sobald alle fertig sind – der Host bestätigt (oder erzwingt) den Start.
  socket.on("picking:finish", (cb) => {
    const c = ctx();
    if (!c || !c.isHost || c.room.phase !== "picking") return;
    const withSongs = [...c.room.players.values()].filter((p) => p.picks.length > 0);
    if (withSongs.length < 2) {
      return reply(cb, { ok: false, error: "need_two_pickers" });
    }
    startRounds(c.room);
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("round:guess", (data) => {
    const c = ctx();
    if (c) handleGuess(c.room, c.player, data?.text);
  });

  socket.on("round:next", () => {
    const c = ctx();
    if (c?.isHost) nextRound(c.room);
  });
});

// Verlassene Räume aufräumen.
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.emptySince && now - room.emptySince > ROOM_TTL_MS) {
      clearTimeout(room.round?.timer);
      clearTimeout(room.revealTimer);
      rooms.delete(room.code);
    }
  }
}, 60_000).unref();

http.listen(PORT, () => {
  console.log(`Games-Server läuft auf http://localhost:${PORT}`);
});
