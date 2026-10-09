/**
 * Ablauf der Musikspiele (Guess the Song, Guess the Year, Song-Timeline):
 * Songauswahl → Runden → Auflösung → Endstand.
 */

import type { FeedItem } from "../../../shared/types";
import { addChatMessage } from "../chat";
import { HINT_AT, REVEAL_MS } from "../config";
import { cleanTitle, countLetters, matchGuess } from "../music/match";
import {
  connected,
  nextFeedId,
  shuffle,
  type Hint,
  type Player,
  type Room,
  type Round,
} from "../state";
import { broadcast } from "../view";

/* ---------- Partie ---------- */

export function startPicking(room: Room) {
  for (const p of room.players.values()) {
    p.picks = [];
    p.score = 0;
    p.timeline = [];
  }
  room.queue = [];
  room.timelineOver = false;
  room.roundIndex = 0;
  room.round = undefined;
  room.phase = "picking";
}

export function startRounds(room: Room) {
  const players = [...room.players.values()];
  if (room.game === "timeline") {
    // Der erste gewählte Song wird die offene Startkarte, der Rest kommt in den Stapel.
    for (const p of players) p.timeline = p.picks.slice(0, 1);
    room.queue = shuffle(
      players.flatMap((p) => p.picks.slice(1).map((track) => ({ track, pickerId: p.id }))),
    );
  } else {
    room.queue = shuffle(
      players.flatMap((p) => p.picks.map((track) => ({ track, pickerId: p.id }))),
    );
  }

  // Möglichst nicht zweimal hintereinander ein Song desselben Spielers.
  for (let i = 1; i < room.queue.length; i++) {
    if (room.queue[i].pickerId !== room.queue[i - 1].pickerId) continue;
    const swap = room.queue.findIndex((q, j) => j > i && q.pickerId !== room.queue[i].pickerId);
    if (swap > 0) [room.queue[i], room.queue[swap]] = [room.queue[swap], room.queue[i]];
  }

  room.roundIndex = 0;
  if (room.game === "timeline") {
    for (const p of players) if (!p.timeline.length) drawStartCard(room, p);
    for (const p of players) p.score = p.timeline.length;
    room.turnOrder = players.map((p) => p.id);
    room.turnPos = -1;
    room.timelineOver = false;
  }

  if (!prepareRound(room)) {
    room.phase = "finished";
    return;
  }
  startRound(room);
}

/* ---------- Runden ---------- */

/**
 * Bereitet die Runde an `roundIndex` vor. Reihum: nächster verbundener Spieler, dazu ein Song,
 * den er nicht selbst gewählt hat. false = keine spielbare Runde mehr.
 */
function prepareRound(room: Room): boolean {
  if (room.roundIndex >= room.queue.length) return false;
  room.activeId = undefined;
  if (room.game !== "timeline" || room.settings.timelineMode !== "turns") return true;

  for (let tries = 0; tries < room.turnOrder.length; tries++) {
    room.turnPos = (room.turnPos + 1) % room.turnOrder.length;
    const id = room.turnOrder[room.turnPos];
    if (!room.players.get(id)?.socketId) continue;
    const j = room.queue.findIndex((q, k) => k >= room.roundIndex && q.pickerId !== id);
    if (j < 0) continue;
    [room.queue[room.roundIndex], room.queue[j]] = [room.queue[j], room.queue[room.roundIndex]];
    room.activeId = id;
    return true;
  }
  return false;
}

function startRound(room: Room) {
  const entry = room.queue[room.roundIndex];
  const now = Date.now();
  const duration = room.settings.roundSeconds * 1000;
  const round: Round = {
    track: entry.track,
    pickerId: entry.pickerId,
    startedAt: now,
    endsAt: now + duration,
    timer: setTimeout(() => endRound(room), duration),
    feed: [],
    gains: new Map(),
    got: new Map(),
    titleHint: newHint(cleanTitle(entry.track.title)),
    artistHint: newHint(entry.track.artist),
    hintTimers: [],
    years: new Map(),
    placements: new Map(),
    results: new Map(),
    activeId: room.activeId,
  };

  // Buchstaben-Hinweise gibt es nur bei Guess the Song.
  round.hintTimers = (room.game === "song" ? HINT_AT : []).map((fraction) =>
    setTimeout(() => {
      if (room.round !== round || room.phase !== "round") return;
      const changed = [round.titleHint, round.artistHint].map(openMore);
      if (changed.some(Boolean)) broadcast(room);
    }, duration * fraction),
  );

  room.round = round;
  room.phase = "round";
}

export function endRound(room: Room) {
  const { round } = room;
  if (!round || room.phase !== "round") return;
  clearTimeout(round.timer);
  round.hintTimers.forEach(clearTimeout);

  if (room.game === "year") scoreYears(room, round);
  if (room.game === "timeline") scoreTimeline(room, round);

  room.phase = "reveal";
  room.revealNextAt = Date.now() + REVEAL_MS;
  room.revealTimer = setTimeout(() => nextRound(room), REVEAL_MS);
  broadcast(room);
}

export function nextRound(room: Room) {
  if (room.phase !== "reveal") return;
  clearTimeout(room.revealTimer);
  room.roundIndex++;
  if (room.timelineOver || !prepareRound(room)) {
    room.phase = "finished";
    room.round = undefined;
  } else {
    startRound(room);
  }
  broadcast(room);
}

/** Endet die Runde vorzeitig, weil alle fertig sind? Sonst nur den neuen Stand verschicken. */
export function endRoundIfDone(room: Room, round: Round) {
  if (everyoneDone(room, round)) endRound(room);
  else broadcast(room);
}

export function hasAnswered(room: Room, round: Round, playerId: string): boolean {
  if (room.game === "year") return round.years.has(playerId);
  if (room.game === "timeline") return round.placements.has(playerId);
  const got = round.got.get(playerId);
  return Boolean(got?.title && got?.artist);
}

export function everyoneDone(room: Room, round: Round): boolean {
  if (room.game === "timeline" && room.settings.timelineMode === "turns") {
    const active = round.activeId ? room.players.get(round.activeId) : undefined;
    return !active?.socketId || round.placements.has(active.id);
  }
  const guessers = connected(room).filter((p) => p.id !== round.pickerId);
  return guessers.length > 0 && guessers.every((p) => hasAnswered(room, round, p.id));
}

function addPoints(room: Room, round: Round, playerId: string, points: number) {
  const player = room.players.get(playerId);
  if (!player) return;
  player.score += points;
  round.gains.set(playerId, (round.gains.get(playerId) ?? 0) + points);
}

export function pushFeed(round: Round, player: Player, kind: FeedItem["kind"], text?: string) {
  round.feed.push({
    id: nextFeedId(),
    playerId: player.id,
    name: player.name,
    kind,
    ...(text !== undefined ? { text } : {}),
  });
}

/** Freier Text aus einer Runde: kommt in den Rundenverlauf und bleibt im Raum-Chat erhalten. */
function say(room: Room, round: Round, player: Player, text: string) {
  pushFeed(round, player, "wrong", text);
  addChatMessage(room, player, text);
}

/* ---------- Guess the Song ---------- */

function newHint(text: string): Hint {
  const letters = countLetters(text);
  return {
    order: shuffle(Array.from({ length: letters }, (_, i) => i)),
    revealed: 0,
    perStep: Math.max(1, Math.round(letters * 0.12)),
    max: Math.floor(letters / 2), // höchstens die Hälfte verraten
  };
}

function openMore(hint: Hint): boolean {
  const next = Math.min(hint.max, hint.revealed + hint.perStep);
  const changed = next !== hint.revealed;
  hint.revealed = next;
  return changed;
}

export function opened(hint: Hint): Set<number> {
  return new Set(hint.order.slice(0, hint.revealed));
}

/** Tipp oder Chatnachricht während einer Runde. */
export function handleGuess(room: Room, player: Player, raw: unknown) {
  const { round } = room;
  if (room.phase !== "round" || !round) return;
  const text = String(raw ?? "")
    .trim()
    .slice(0, 80);
  if (!text) return;

  const result = matchGuess(text, round.track);
  // Alles, was der Lösung entspricht oder nahekommt, wird nie als Text weitergegeben.
  const spoils = result.title !== "none" || result.artist !== "none";

  // Guess the Year und Song-Timeline: das Textfeld ist reiner Chat. Die Jahreszahl darf nicht
  // fallen, und bei verdecktem Song auch weder Titel noch Interpret.
  if (room.game === "year" || room.game === "timeline") {
    const year = String(round.track.year ?? "");
    if ((year && text.includes(year)) || (!room.settings.showSong && spoils)) return;
    say(room, round, player, text);
    return broadcast(room);
  }

  // Wer den Song gewählt hat, rät nicht mit, darf aber chatten.
  if (round.pickerId === player.id) {
    if (spoils) return;
    say(room, round, player, text);
    return broadcast(room);
  }

  const got = round.got.get(player.id) ?? { title: false, artist: false };
  round.got.set(player.id, got);
  const remaining = Math.max(0, (round.endsAt - Date.now()) / (round.endsAt - round.startedAt));

  let hit = false;
  if (result.title === "exact" && !got.title) {
    got.title = true;
    hit = true;
    addPoints(room, round, player.id, 50 + Math.round(50 * remaining));
    addPoints(room, round, round.pickerId, 15); // Bonus für den, der den Song gewählt hat
    pushFeed(round, player, "title");
  }
  if (result.artist === "exact" && !got.artist) {
    got.artist = true;
    hit = true;
    addPoints(room, round, player.id, 25 + Math.round(25 * remaining));
    pushFeed(round, player, "artist");
  }
  if (!hit) {
    const close =
      (result.title === "close" && !got.title) || (result.artist === "close" && !got.artist);
    if (close) pushFeed(round, player, "close");
    else if (!spoils) say(room, round, player, text); // normaler Tipp bzw. Chatnachricht
  }

  endRoundIfDone(room, round);
}

/* ---------- Guess the Year ---------- */

/** Tipp abgeben – einer pro Runde, danach gesperrt. Gültigkeit prüft der Aufrufer. */
export function submitYear(room: Room, round: Round, player: Player, year: number) {
  round.years.set(player.id, year);
  pushFeed(round, player, "locked");
  endRoundIfDone(room, round);
}

/** Genau = 100, ein Jahr daneben = 80, dann je Jahr 10 weniger. */
function yearPoints(off: number): number {
  return off === 0 ? 100 : Math.max(0, 90 - 10 * off);
}

function scoreYears(room: Room, round: Round) {
  const year = round.track.year;
  if (!year) return;
  for (const [playerId, guess] of round.years) {
    const off = Math.abs(guess - year);
    addPoints(room, round, playerId, yearPoints(off));
    if (off <= 2) addPoints(room, round, round.pickerId, 10); // Bonus für gut schätzbare Songs
  }
}

/* ---------- Song-Timeline ---------- */

/** Karte in die gewählte Lücke legen (0 = ganz vorn). Gültigkeit prüft der Aufrufer. */
export function placeCard(room: Room, round: Round, player: Player, position: number) {
  round.placements.set(player.id, position);
  pushFeed(round, player, "placed");
  endRoundIfDone(room, round);
}

/** Spieler ohne Startkarte bekommen eine vom Ende des Stapels. */
export function drawStartCard(room: Room, player: Player) {
  if (room.queue.length - 1 <= room.roundIndex) return;
  player.timeline = [room.queue.pop()!.track];
  player.score = player.timeline.length;
}

/** Darf dieser Spieler in dieser Runde (noch) einordnen? */
export function canPlace(room: Room, round: Round, playerId: string): boolean {
  if (round.placements.has(playerId) || round.pickerId === playerId) return false;
  if (!room.players.has(playerId)) return false;
  return room.settings.timelineMode === "turns" ? round.activeId === playerId : true;
}

function scoreTimeline(room: Room, round: Round) {
  const year = round.track.year;
  if (!year) return;
  for (const [playerId, position] of round.placements) {
    const player = room.players.get(playerId);
    if (!player) continue;
    const before = player.timeline[position - 1]?.year ?? -Infinity;
    const after = player.timeline[position]?.year ?? Infinity;
    // Gleiches Jahr wie ein Nachbar zählt als richtig.
    const correct = before <= year && year <= after;
    round.results.set(playerId, { position, correct });
    if (correct) {
      player.timeline.splice(position, 0, round.track);
      round.gains.set(playerId, 1);
    }
  }
  for (const p of room.players.values()) p.score = p.timeline.length;
  const goal = room.settings.timelineGoal;
  if (goal > 0 && [...room.players.values()].some((p) => p.timeline.length >= goal)) {
    room.timelineOver = true;
  }
}
