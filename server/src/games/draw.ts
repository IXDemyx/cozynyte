/**
 * Montagsmaler: Reihum zeichnet einer, alle anderen raten im Chat.
 * Zug = Begriff wählen (3 zur Auswahl) → zeichnen → Auflösung. Nach jeder Runde (jeder hat
 * einmal gezeichnet) die nächste, nach der letzten der Endstand.
 */

import { randomInt } from "node:crypto";
import {
  CHOOSE_MS,
  MAX_OPS,
  TURN_REVEAL_MS,
  applyOps,
  cleanOp,
  type DrawOp,
} from "../../../shared/draw";
import { addChatMessage } from "../chat";
import { HINT_AT } from "../config";
import { WORDS } from "../draw/words";
import { matchWord, normalize } from "../music/match";
import { io } from "../server";
import { connected, nextFeedId, shuffle, type DrawGame, type Player, type Room } from "../state";
import { broadcast } from "../view";
import { newHint, openMore } from "./music";

let turns = 0;

/* ---------- Partie ---------- */

export function startDraw(room: Room) {
  for (const p of room.players.values()) p.score = 0;
  stopTimers(room.draw);
  room.draw = {
    round: 1,
    seats: shuffle(connected(room).map((p) => p.id)),
    seatPos: -1,
    turn: 0,
    stage: "choosing",
    drawerId: "",
    choices: [],
    word: "",
    hint: newHint(""),
    startedAt: 0,
    endsAt: 0,
    guessed: [],
    gains: new Map(),
    feed: [],
    ops: [],
    used: new Set(),
    hintTimers: [],
  };
  room.phase = "round";
  nextTurn(room);
}

function stopTimers(game: DrawGame | undefined) {
  if (!game) return;
  clearTimeout(game.timer);
  game.hintTimers.forEach(clearTimeout);
  game.hintTimers = [];
}

/** Spieler, der später dazukommt: zeichnet in dieser Runde noch mit (hinten angehängt). */
export function addSeat(room: Room, player: Player) {
  if (room.draw && !room.draw.seats.includes(player.id)) room.draw.seats.push(player.id);
}

/** Nächster Zeichner – nach dem letzten Platz beginnt die nächste Runde. Sonst Endstand. */
function nextTurn(room: Room) {
  const game = room.draw!;
  stopTimers(game);
  if (connected(room).length < 2) return finish(room);

  for (;;) {
    game.seatPos++;
    if (game.seatPos >= game.seats.length) {
      game.round++;
      game.seatPos = 0;
      if (game.round > room.settings.drawRounds) return finish(room);
    }
    const drawer = room.players.get(game.seats[game.seatPos]);
    if (drawer?.socketId) {
      startChoosing(room, drawer);
      return;
    }
  }
}

function finish(room: Room) {
  stopTimers(room.draw);
  room.phase = "finished";
}

function startChoosing(room: Room, drawer: Player) {
  const game = room.draw!;
  const now = Date.now();
  game.turn = ++turns;
  game.stage = "choosing";
  game.drawerId = drawer.id;
  game.choices = pickWords(room, 3);
  game.word = "";
  game.guessed = [];
  game.gains = new Map();
  game.feed = [];
  game.ops = [];
  game.startedAt = now;
  game.endsAt = now + CHOOSE_MS;
  // Wer sich nicht entscheidet, bekommt einen der drei.
  game.timer = setTimeout(() => {
    chooseWord(room, drawer, randomInt(game.choices.length));
    broadcast(room);
  }, CHOOSE_MS);
}

/** Drei verschiedene, in dieser Partie noch nicht gezeichnete Begriffe – eigene bevorzugt gemischt. */
function pickWords(room: Room, count: number): string[] {
  const game = room.draw!;
  const fresh = (list: string[]) => list.filter((w) => !game.used.has(normalize(w)));
  const own = shuffle(fresh(room.settings.drawCustom));
  let pool = shuffle(fresh(WORDS[room.settings.drawLanguage]));
  if (pool.length < count) pool = shuffle([...WORDS[room.settings.drawLanguage]]);

  const picked: string[] = [];
  while (picked.length < count && (own.length || pool.length)) {
    // Eigene Begriffe kommen etwa jedes zweite Mal dran, solange es welche gibt.
    const word = own.length && (randomInt(2) === 0 || !pool.length) ? own.pop()! : pool.pop()!;
    if (!picked.some((w) => normalize(w) === normalize(word))) picked.push(word);
  }
  return picked;
}

/** Zeichner wählt einen der drei Begriffe – jetzt wird gezeichnet. */
export function chooseWord(room: Room, player: Player, index: number): boolean {
  const game = room.draw;
  if (room.phase !== "round" || game?.stage !== "choosing" || game.drawerId !== player.id) {
    return false;
  }
  const word = game.choices[index];
  if (!word) return false;
  stopTimers(game);
  const now = Date.now();
  const duration = room.settings.drawSeconds * 1000;
  game.stage = "drawing";
  game.word = word;
  game.used.add(normalize(word));
  game.hint = newHint(word);
  game.startedAt = now;
  game.endsAt = now + duration;
  game.timer = setTimeout(() => endTurn(room), duration);
  // Mit der Zeit werden einzelne Buchstaben aufgedeckt (höchstens die Hälfte).
  game.hintTimers = HINT_AT.map((fraction) =>
    setTimeout(() => {
      if (room.draw === game && game.stage === "drawing" && openMore(game.hint)) broadcast(room);
    }, duration * fraction),
  );
  return true;
}

/** Zug beenden: Auflösung zeigen, danach ist der Nächste dran. */
export function endTurn(room: Room) {
  const game = room.draw;
  if (!game || room.phase !== "round" || game.stage === "reveal") return;
  stopTimers(game);
  // Ist der Zeichner gegangen, bevor er gewählt hat, gibt es nichts aufzulösen.
  if (game.stage === "choosing") {
    nextTurn(room);
    return broadcast(room);
  }
  const now = Date.now();
  game.stage = "reveal";
  game.startedAt = now;
  game.endsAt = now + TURN_REVEAL_MS;
  game.timer = setTimeout(() => {
    nextTurn(room);
    broadcast(room);
  }, TURN_REVEAL_MS);
  broadcast(room);
}

/** Alle (verbundenen) Rater sind fertig oder der Zeichner ist weg? Dann Zug beenden. */
export function checkTurnDone(room: Room) {
  const game = room.draw;
  if (!game || room.phase !== "round" || game.stage === "reveal") return;
  const drawer = room.players.get(game.drawerId);
  const guessers = connected(room).filter((p) => p.id !== game.drawerId);
  const allGuessed =
    game.stage === "drawing" &&
    guessers.length > 0 &&
    guessers.every((p) => game.guessed.includes(p.id));
  if (!drawer?.socketId || allGuessed) endTurn(room);
}

/* ---------- Raten ---------- */

function addPoints(game: DrawGame, player: Player, points: number) {
  player.score += points;
  game.gains.set(player.id, (game.gains.get(player.id) ?? 0) + points);
}

function pushFeed(game: DrawGame, player: Player, kind: "guessed" | "close") {
  game.feed.push({ id: nextFeedId(), playerId: player.id, name: player.name, kind });
}

/** Kommt der Begriff als eigenes Wort (oder aus mehreren Wörtern zusammengesetzt) im Text vor? */
function mentions(text: string, word: string): boolean {
  const target = normalize(word);
  const tokens = text
    .split(/[\s,.;:!?"'()]+/)
    .map(normalize)
    .filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    let joined = "";
    for (let j = i; j < tokens.length && joined.length < target.length; j++) {
      joined += tokens[j];
      if (joined === target) return true;
    }
  }
  return false;
}

/**
 * Nachricht während der Partie: beim Zeichnen ist sie ein Tipp. Treffer und Beinahe-Treffer
 * erscheinen nur als Ereignis – den Begriff selbst sieht im Chat nie jemand.
 */
export function handleDrawGuess(room: Room, player: Player, raw: unknown) {
  const game = room.draw;
  const text = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  if (!text) return;
  if (!game || game.stage !== "drawing") {
    addChatMessage(room, player, text);
    return broadcast(room);
  }

  // „Ist es ein Ei?" zählt auch – kurze Begriffe stecken oft in einem Satz.
  const result = mentions(text, game.word) ? "exact" : matchWord(text, game.word);
  const knows = player.id === game.drawerId || game.guessed.includes(player.id);
  if (knows) {
    // Wer den Begriff kennt, darf chatten – aber nichts verraten, auch nicht versteckt im Wort.
    const spoils = result !== "none" || normalize(text).includes(normalize(game.word));
    if (!spoils) addChatMessage(room, player, text);
    return broadcast(room);
  }

  if (result === "exact") {
    const total = game.endsAt - game.startedAt;
    const remaining = Math.max(0, Math.min(1, (game.endsAt - Date.now()) / total));
    game.guessed.push(player.id);
    // Schnell sein lohnt sich; wer früh rät, bekommt zusätzlich einen kleinen Platzbonus.
    const placeBonus = Math.max(0, 30 - 10 * (game.guessed.length - 1));
    addPoints(game, player, 50 + Math.round(100 * remaining) + placeBonus);
    const drawer = room.players.get(game.drawerId);
    if (drawer) addPoints(game, drawer, 25);
    pushFeed(game, player, "guessed");
    checkTurnDone(room);
    if (room.draw?.stage === "drawing") broadcast(room);
    return;
  }
  if (result === "close") pushFeed(game, player, "close");
  else addChatMessage(room, player, text);
  broadcast(room);
}

/* ---------- Zeichnung ---------- */

/** An alle außer den Zeichner: neue Befehle bzw. die ganze Zeichnung. */
function relay(room: Room, event: string, payload: unknown, except?: string) {
  for (const p of room.players.values()) {
    if (p.socketId && !p.bot && p.id !== except) io.to(p.socketId).emit(event, payload);
  }
}

/** Neue Zeichenbefehle vom Zeichner übernehmen und weitergeben. */
export function addOps(room: Room, player: Player, turn: unknown, raw: unknown): boolean {
  const game = room.draw;
  if (!game || game.stage !== "drawing" || game.drawerId !== player.id || turn !== game.turn) {
    return false;
  }
  const ops = (Array.isArray(raw) ? raw : [])
    .slice(0, 50)
    .map(cleanOp)
    .filter((op): op is DrawOp => op !== null);
  if (!ops.length || game.ops.length >= MAX_OPS) return false;
  applyOps(game.ops, ops);
  relay(room, "draw:ops", { turn: game.turn, ops }, player.id);
  return true;
}

/** Letzten Strich (bzw. Füllung oder Löschen) zurücknehmen. */
export function undoOp(room: Room, player: Player): boolean {
  const game = room.draw;
  if (!game || game.stage !== "drawing" || game.drawerId !== player.id || !game.ops.length) {
    return false;
  }
  game.ops.pop();
  relay(room, "draw:sync", { turn: game.turn, ops: game.ops });
  return true;
}

/** Die ganze Zeichnung des laufenden Zugs (nach dem Neuladen oder Beitreten). */
export function drawingOf(room: Room): { turn: number; ops: DrawOp[] } | null {
  const game = room.draw;
  return game ? { turn: game.turn, ops: game.ops } : null;
}
