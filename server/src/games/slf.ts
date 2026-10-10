/**
 * Stadt Land Fluss: Buchstabe auslosen → alle schreiben → „Stopp!" (mit kurzer Nachfrist) oder
 * Zeit um → Auswertung mit Abstimmung → nächste Runde bzw. Endstand.
 */

import type { SlfCell } from "../../../shared/types";
import {
  ALPHABET,
  HARD_LETTERS,
  MAX_ANSWER_LENGTH,
  POINTS,
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
    startedAt: 0,
    endsAt: 0,
  };
  startSlfRound(room);
}

/** Nächster Buchstabe, der in dieser Partie noch nicht dran war. */
function drawLetter(room: Room, game: SlfGame): string | undefined {
  const pool = ALPHABET.filter(
    (l) => !game.used.includes(l) && (room.settings.slfHardLetters || !HARD_LETTERS.includes(l)),
  );
  return shuffle(pool)[0];
}

function startSlfRound(room: Room) {
  const game = room.slf;
  if (!game) return;
  const letter = drawLetter(room, game);
  if (!letter || game.round >= room.settings.slfRounds) {
    room.phase = "finished";
    return;
  }
  const now = Date.now();
  const duration = room.settings.slfSeconds * 1000;
  game.round++;
  game.letter = letter;
  game.used.push(letter);
  game.answers = new Map();
  game.votes = new Map();
  game.startedAt = now;
  game.endsAt = now + duration;
  game.stopAt = undefined;
  game.stoppedBy = undefined;
  clearTimeout(game.timer);
  game.timer = setTimeout(() => endWriting(room), duration);
  room.phase = "round";
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
  if (!game || room.phase !== "round") return false;
  game.answers.set(player.id, clean(room, raw));
  return true;
}

/** „Stopp!" – nur mit vollständig ausgefüllten Antworten. Die anderen haben noch STOP_GRACE_MS. */
export function callStop(room: Room, player: Player, raw: unknown): boolean {
  const game = room.slf;
  if (!game || room.phase !== "round" || game.stopAt) return false;
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
