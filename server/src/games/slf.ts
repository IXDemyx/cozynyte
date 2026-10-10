/**
 * Stadt Land Fluss: Buchstabe auslosen (oder aufsagen lassen) → alle schreiben → „Stopp!" (mit kurzer Nachfrist) oder
 * Zeit um → Auswertung mit Abstimmung → nächste Runde bzw. Endstand.
 */

import type { SlfCell } from "../../../shared/types";
import { randomInt } from "node:crypto";
import {
  ALPHABET,
  HARD_LETTERS,
  MAX_ANSWER_LENGTH,
  COUNTDOWN_MS,
  POINTS,
  RECITE_TIMEOUT_MS,
  ROLL_MS,
  STOP_GRACE_MS,
  judgeCategory,
} from "../../../shared/slf";
import { connected, shuffle, type Player, type Room, type SlfGame } from "../state";
import { broadcast } from "../view";

/* ---------- Partie ---------- */

export function startSlf(room: Room) {
  for (const p of room.players.values()) p.score = 0;
  clearTimeout(room.slf?.timer);
  room.slf = {
    round: 0,
    letter: "",
    used: [],
    categories: [...room.settings.slfCategories],
    answers: new Map(),
    votes: new Map(),
    countdownEndsAt: 0,
    startsAt: 0,
    endsAt: 0,
  };
  startSlfRound(room);
}

/** Buchstaben, die noch in Frage kommen – in alphabetischer Reihenfolge (fürs Aufsagen). */
function letterPool(room: Room, game: SlfGame): string[] {
  return ALPHABET.filter(
    (l) => !game.used.includes(l) && (room.settings.slfHardLetters || !HARD_LETTERS.includes(l)),
  );
}

/**
 * Neue Runde. Beim Aufsagen ist reihum einer dran, der das Alphabet durchgeht; ein zufällig
 * bestimmter anderer Spieler sagt Stopp. Sonst wird der Buchstabe einfach ausgelost.
 */
function startSlfRound(room: Room) {
  const game = room.slf;
  if (!game) return;
  const pool = letterPool(room, game);
  if (!pool.length || game.round >= room.settings.slfRounds) {
    room.phase = "finished";
    return;
  }
  game.round++;
  game.letter = "";
  game.answers = new Map();
  game.votes = new Map();
  game.stopAt = undefined;
  game.stoppedBy = undefined;
  game.drawing = undefined;
  clearTimeout(game.timer);
  room.phase = "round";

  const players = connected(room);
  if (room.settings.slfLetterMode !== "recite" || players.length < 2) {
    beginWriting(room, shuffle(pool)[0], true);
    return;
  }
  const reciter = players[(game.round - 1) % players.length];
  const others = players.filter((p) => p !== reciter);
  const stopper = others[randomInt(others.length)];
  const now = Date.now();
  game.drawing = { reciterId: reciter.id, stopperId: stopper.id, pool, position: -1 };
  game.countdownEndsAt = now;
  game.startsAt = now;
  game.endsAt = now + RECITE_TIMEOUT_MS;
  // Sagt niemand Stopp (oder ist jemand weg), geht es trotzdem weiter.
  game.timer = setTimeout(() => {
    finishDrawing(room);
    broadcast(room);
  }, RECITE_TIMEOUT_MS);
}

/**
 * Buchstabe steht fest. Erst läuft ein kurzer Countdown, bei `roll` rattert danach der Buchstabe
 * durchs Alphabet – die Schreibzeit beginnt erst, wenn er für alle zu sehen ist.
 */
function beginWriting(room: Room, letter: string, roll: boolean) {
  const game = room.slf!;
  const now = Date.now();
  const duration = room.settings.slfSeconds * 1000;
  game.drawing = undefined;
  game.letter = letter;
  game.used.push(letter);
  game.countdownEndsAt = now + COUNTDOWN_MS;
  game.startsAt = game.countdownEndsAt + (roll ? ROLL_MS : 0);
  game.endsAt = game.startsAt + duration;
  clearTimeout(game.timer);
  game.timer = setTimeout(() => endWriting(room), game.endsAt - now);
}

/** Aufsagen: einen Buchstaben weiter (nach Z wieder von vorn). Nur wer dran ist. */
export function reciteNext(room: Room, player: Player): boolean {
  const drawing = room.slf?.drawing;
  if (room.phase !== "round" || !drawing || drawing.reciterId !== player.id) return false;
  drawing.position = (drawing.position + 1) % drawing.pool.length;
  return true;
}

/**
 * Aufsagen beenden: durch den Stopp-Sager (`player`) oder ohne ihn nach Ablauf der Zeit.
 * Wurde noch gar nicht gezählt, gilt beim Stopp der erste Buchstabe, beim Zeitablauf ein zufälliger.
 */
export function finishDrawing(room: Room, player?: Player): boolean {
  const drawing = room.slf?.drawing;
  if (room.phase !== "round" || !drawing) return false;
  if (player && player.id !== drawing.stopperId) return false;
  const { pool, position } = drawing;
  const letter = position >= 0 ? pool[position] : player ? pool[0] : shuffle([...pool])[0];
  beginWriting(room, letter, false);
  return true;
}

/** Schreibzeit vorbei – ab in die Auswertung. */
function endWriting(room: Room) {
  const game = room.slf;
  if (!game || room.phase !== "round") return;
  clearTimeout(game.timer);
  room.phase = "reveal";
  broadcast(room);
}

/** Auswertung abschließen: Punkte gutschreiben, nächste Runde oder Endstand. */
export function nextSlfRound(room: Room) {
  const game = room.slf;
  if (!game || room.phase !== "reveal") return;
  const { gains } = judgeRound(room);
  for (const [id, points] of Object.entries(gains)) {
    const player = room.players.get(id);
    if (player) player.score += points;
  }
  startSlfRound(room);
  broadcast(room);
}

/* ---------- Eingaben ---------- */

/** Antworten bereinigen: eine pro Kategorie, gekürzt. */
function clean(room: Room, raw: unknown): string[] {
  const count = room.slf?.categories.length ?? 0;
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: count }, (_, i) =>
    String(list[i] ?? "")
      .replace(/\s+/g, " ")
      .slice(0, MAX_ANSWER_LENGTH),
  );
}

/** Zwischenstand speichern – der Client schickt beim Tippen laufend mit. false = zu spät. */
export function saveAnswers(room: Room, player: Player, raw: unknown): boolean {
  const game = room.slf;
  if (!game || room.phase !== "round" || game.drawing || Date.now() < game.startsAt) return false;
  game.answers.set(player.id, clean(room, raw));
  return true;
}

/** „Stopp!" – nur mit vollständig ausgefüllten Antworten. Die anderen haben noch STOP_GRACE_MS. */
export function callStop(room: Room, player: Player, raw: unknown): boolean {
  const game = room.slf;
  if (!game || room.phase !== "round" || game.drawing || game.stopAt) return false;
  if (Date.now() < game.startsAt) return false;
  const answers = clean(room, raw);
  if (answers.some((a) => !a.trim())) return false;
  game.answers.set(player.id, answers);
  game.stopAt = Math.min(Date.now() + STOP_GRACE_MS, game.endsAt);
  game.stoppedBy = player.id;
  clearTimeout(game.timer);
  game.timer = setTimeout(() => endWriting(room), game.stopAt - Date.now());
  return true;
}

/** Gegenstimme für eine Antwort setzen bzw. zurücknehmen (die eigene geht nicht). */
export function toggleVote(room: Room, voter: Player, targetId: string, category: number): boolean {
  const game = room.slf;
  if (!game || room.phase !== "reveal" || targetId === voter.id) return false;
  if (!room.players.has(targetId) || !Number.isInteger(category)) return false;
  if (category < 0 || category >= game.categories.length) return false;
  const key = `${targetId}:${category}`;
  const votes = game.votes.get(key) ?? new Set<string>();
  if (votes.has(voter.id)) votes.delete(voter.id);
  else votes.add(voter.id);
  game.votes.set(key, votes);
  return true;
}

/* ---------- Auswertung ---------- */

/** Bewertet alle Antworten der Runde mit den aktuellen Gegenstimmen. */
export function judgeRound(room: Room): {
  cells: Record<string, SlfCell[]>;
  gains: Record<string, number>;
} {
  const game = room.slf!;
  const players = [...room.players.values()];
  // Jeder stimmt über die Antworten der anderen ab: so viele können maximal dagegen sein.
  const voters = Math.max(0, connected(room).length - 1);
  const cells: Record<string, SlfCell[]> = Object.fromEntries(players.map((p) => [p.id, []]));
  const gains: Record<string, number> = Object.fromEntries(players.map((p) => [p.id, 0]));

  game.categories.forEach((_, i) => {
    const entries = players.map((p) => ({
      playerId: p.id,
      text: (game.answers.get(p.id)?.[i] ?? "").trim(),
      votes: game.votes.get(`${p.id}:${i}`)?.size ?? 0,
    }));
    const verdicts = judgeCategory(entries, game.letter, voters);
    for (const entry of entries) {
      const verdict = verdicts.get(entry.playerId) ?? "empty";
      cells[entry.playerId].push({
        text: entry.text,
        verdict,
        points: POINTS[verdict],
        votes: [...(game.votes.get(`${entry.playerId}:${i}`) ?? [])],
      });
      gains[entry.playerId] += POINTS[verdict];
    }
  });
  return { cells, gains };
}
