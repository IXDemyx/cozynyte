/**
 * Testbots für den Testmodus: Mitspieler ohne Browser, damit man Lobby, Chat und Spiele allein
 * ausprobieren kann. Sie wählen Songs, raten, tippen Jahre, legen Karten, spielen ihren
 * Kniffel-Zug und antworten im Chat – mit kleinen Pausen, damit es sich echt anfühlt.
 */

import { randomInt } from "node:crypto";
import { CATEGORIES, scoreDice, type Category } from "../../../shared/kniffel";
import { presetId, startsWithLetter } from "../../../shared/slf";
import { addChatMessage, chatListeners } from "../chat";
import { MAX_PLAYERS } from "../config";
import { removePlayer } from "../connection";
import { ensureColumn, rollDice, writeCell } from "../games/kniffel";
import { canPlace, drawStartCard, handleGuess, placeCard, submitYear } from "../games/music";
import { callStop, saveAnswers } from "../games/slf";
import { getCachedTrack } from "../music/itunes";
import { SUGGESTION_CATEGORIES, suggestTracks } from "../music/suggestions";
import { createPlayer, rooms, type Player, type Room } from "../state";
import { broadcast, broadcastListeners } from "../view";
import { SLF_WORDS } from "./slfWords";

const NAMES = ["Bot Bernd", "Bot Berta", "Bot Kalle", "Bot Uschi", "Bot Horst", "Bot Gabi"];

const LINES = [
  "Hallo zusammen 👋",
  "Viel Glück euch!",
  "Puh, schwierig …",
  "Haha 😄",
  "Gute Wahl!",
  "Das kenn ich doch!",
  "Nochmal, nochmal!",
  "Ich bin nur ein Testbot 🤖",
  "Gleich hab ich's …",
  "Läuft bei dir",
];

const pick = <T>(list: readonly T[]): T => list[randomInt(list.length)];
const between = (min: number, max: number) => min + randomInt(max - min + 1);

/** Was jeder Bot im aktuellen Spielabschnitt schon erledigt hat – damit nichts doppelt passiert. */
const progress = new WeakMap<Player, { stage: string; done: Set<string> }>();

/** Einmal pro Abschnitt: true = Aufgabe ist neu und wird jetzt übernommen. */
function claim(bot: Player, stage: string, task: string): boolean {
  let entry = progress.get(bot);
  if (!entry || entry.stage !== stage) {
    entry = { stage, done: new Set() };
    progress.set(bot, entry);
  }
  if (entry.done.has(task)) return false;
  entry.done.add(task);
  return true;
}

/** Verzögert ausführen – aber nur, wenn Raum und Bot dann noch da sind. */
function later(room: Room, bot: Player, ms: number, action: () => void) {
  setTimeout(() => {
    if (rooms.get(room.code) === room && room.players.get(bot.id) === bot) action();
  }, ms).unref();
}

const bots = (room: Room) => [...room.players.values()].filter((p) => p.bot);

/* ---------- Bots verwalten (Host im Testmodus) ---------- */

/** false = Raum ist voll. */
export function addBot(room: Room): boolean {
  if (room.players.size >= MAX_PLAYERS) return false;
  const taken = new Set([...room.players.values()].map((p) => p.name));
  const name = NAMES.find((n) => !taken.has(n)) ?? `Bot ${room.players.size + 1}`;
  const id = `bot-${Date.now().toString(36)}${randomInt(1e6).toString(36)}`;
  const bot = createPlayer(id, name);
  bot.bot = true;
  bot.socketId = `bot:${id}`;
  room.players.set(id, bot);

  // Wie ein Spieler, der später beitritt.
  if (room.game === "timeline" && (room.phase === "round" || room.phase === "reveal")) {
    drawStartCard(room, bot);
    room.turnOrder.push(bot.id);
  }
  ensureColumn(room, bot);
  return true;
}

export function removeBots(room: Room) {
  for (const bot of bots(room)) removePlayer(room, bot.id, true);
}

/** Ein zufälliger Bot schreibt etwas in den Chat. */
export function botSays(room: Room, bot = pick(bots(room))) {
  if (bot) addChatMessage(room, bot, pick(LINES));
}

/* ---------- Verhalten ---------- */

function act(room: Room) {
  for (const bot of bots(room)) {
    // Neue Partie im selben Raum: alles Erledigte vergessen.
    if (room.phase === "finished" || (room.phase === "lobby" && !room.kniffel)) {
      progress.delete(bot);
    }
    if (room.game === "slf") playSlf(room, bot);
    else if (room.phase === "picking") pickSongs(room, bot);
    else if (room.phase === "round") playRound(room, bot);
    if (room.kniffel) playKniffel(room, bot);
  }
}

/** Songauswahl: Vorschläge einer zufälligen Kategorie holen und die ersten passenden nehmen. */
function pickSongs(room: Room, bot: Player) {
  if (!claim(bot, `picking:${room.game}`, "pick")) return;
  later(room, bot, between(800, 2000), async () => {
    let tracks;
    try {
      tracks = await suggestTracks(pick(SUGGESTION_CATEGORIES));
    } catch {
      return addChatMessage(room, bot, "Ich finde gerade keine Songs (kein Internet?) 😕");
    }
    if (room.phase !== "picking") return;
    const taken = new Set([...room.players.values()].flatMap((p) => p.picks.map((t) => t.id)));
    const needsYear = room.game === "year" || room.game === "timeline";
    for (const track of tracks) {
      if (bot.picks.length >= room.settings.songsPerPlayer) break;
      if (taken.has(track.id) || (needsYear && !track.year) || !getCachedTrack(track.id)) continue;
      bot.picks.push(track);
    }
    broadcast(room);
  });
}

function playRound(room: Room, bot: Player) {
  const round = room.round;
  if (!round || round.pickerId === bot.id) return;
  const stage = `round:${room.roundIndex}`;
  const track = round.track;

  if (room.game === "song" && claim(bot, stage, "guess")) {
    // Zwei Versuche: mal der Titel, mal der Interpret, mal daneben.
    for (const at of [between(3000, 8000), between(9000, 16000)]) {
      later(room, bot, at, () => {
        if (room.round !== round || room.phase !== "round") return;
        const roll = randomInt(3);
        handleGuess(room, bot, roll === 0 ? track.title : roll === 1 ? track.artist : pick(LINES));
      });
    }
  }

  if (room.game === "year" && claim(bot, stage, "year")) {
    later(room, bot, between(2000, 7000), () => {
      if (room.round !== round || room.phase !== "round" || round.years.has(bot.id)) return;
      const year = (track.year ?? 2000) + between(-6, 6);
      submitYear(room, round, bot, Math.min(year, new Date().getFullYear()));
    });
  }

  // Song-Timeline: meistens richtig einordnen, manchmal daneben.
  if (room.game === "timeline" && canPlace(room, round, bot.id) && claim(bot, stage, "place")) {
    later(room, bot, between(2000, 6000), () => {
      if (room.round !== round || !canPlace(room, round, bot.id)) return;
      const year = track.year ?? 0;
      const right = bot.timeline.findIndex((card) => (card.year ?? 0) > year);
      const correct = right < 0 ? bot.timeline.length : right;
      const position = randomInt(3) ? correct : randomInt(bot.timeline.length + 1);
      placeCard(room, round, bot, position);
    });
  }
}

/** Stadt Land Fluss: nach einer Weile die Felder füllen, die die Wortliste hergibt – manchmal „Stopp!". */
function playSlf(room: Room, bot: Player) {
  const game = room.slf;
  if (!game || room.phase !== "round") return;
  if (!claim(bot, `slf:${game.round}`, "write")) return;
  const round = game.round;
  later(room, bot, between(6000, 16000), () => {
    if (room.phase !== "round" || room.slf?.round !== round) return;
    const answers = game.categories.map((category) => {
      const id = presetId(category);
      const words = (id && SLF_WORDS[id]) || [];
      const fitting = words.filter((w) => startsWithLetter(w, game.letter));
      // Nicht immer alles wissen – sonst wären Bots unschlagbar.
      return fitting.length && randomInt(5) ? pick(fitting) : "";
    });
    saveAnswers(room, bot, answers);
    if (answers.every(Boolean) && randomInt(3) === 0) callStop(room, bot, answers);
    broadcast(room);
  });
}

/** Kniffel: dreimal würfeln (die häufigste Zahl halten) und das beste freie Feld nehmen. */
function playKniffel(room: Room, bot: Player) {
  const sheet = room.kniffel!;
  const column = sheet.columns.find((c) => c.id === sheet.current);
  if (column?.playerId !== bot.id) return;
  const filled = Object.values(sheet.cells).reduce((n, cells) => n + Object.keys(cells).length, 0);
  if (!claim(bot, `kniffel:${filled}:${column.id}`, "turn")) return;

  const myTurn = () => sheet.current === column.id && room.kniffel === sheet;
  for (const step of [1, 2, 3]) {
    later(room, bot, step * 1100, () => {
      if (!myTurn()) return;
      const roll = sheet.roll;
      if (roll && roll.count > 0) {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        roll.dice.forEach((d) => counts[d]++);
        const best = counts.indexOf(Math.max(...counts));
        roll.held = roll.dice.map((d) => d === best);
      }
      if (rollDice(sheet)) broadcast(room);
    });
  }
  later(room, bot, 4600, () => {
    if (!myTurn() || !sheet.roll) return;
    const dice = sheet.roll.dice;
    const cells = sheet.cells[column.id] ?? {};
    const open = CATEGORIES.filter((c) => cells[c] === undefined);
    if (!open.length) return;
    const best = open.reduce<Category>(
      (a, b) => (scoreDice(b, dice) > scoreDice(a, dice) ? b : a),
      open[0],
    );
    if (writeCell(room, column.id, best, scoreDice(best, dice))) broadcast(room);
  });
}

/** Auf Chatnachrichten von Menschen antwortet ab und zu ein Bot. */
function replyToChat(room: Room, author: Player) {
  // In Raterunden sind Nachrichten meist Tipps – darauf antworten Bots nicht.
  if (author.bot || room.phase === "round" || !bots(room).length || randomInt(10) >= 6) return;
  const bot = pick(bots(room));
  later(room, bot, between(1200, 2600), () => {
    botSays(room, bot);
    broadcast(room);
  });
}

/** Bots einschalten – nur im Testmodus aufrufen. */
export function enableBots() {
  broadcastListeners.push(act);
  chatListeners.push(replyToChat);
}
