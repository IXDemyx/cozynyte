/**
 * Schätzfragen: Alle sehen dieselbe Frage und tippen eine Zahl. Wer am nächsten dran liegt,
 * bekommt die meisten Punkte – Tempo zählt nicht. Nach jeder Frage zeigt die Auflösung alle
 * Tipps neben der Lösung, nach der letzten kommt der Endstand.
 */

import { randomBytes } from "node:crypto";
import {
  ESTIMATE_COUNTDOWN_MS,
  ESTIMATE_EXACT_BONUS,
  ESTIMATE_MAX,
  ESTIMATE_POINTS,
  ESTIMATE_REVEAL_MS,
} from "../../../shared/estimate";
import type { EstimateView } from "../../../shared/types";
import { ESTIMATE_BANK } from "../estimate/questions";
import {
  connected,
  nextFeedId,
  shuffle,
  type EstimateGame,
  type Player,
  type Room,
} from "../state";
import { broadcast } from "../view";

/* ---------- Fragen zusammenstellen ---------- */

/**
 * Fragen zum gewählten Thema – bevorzugt solche, die in diesem Raum noch nicht dran waren. Erst
 * wenn das Thema durch ist, kommen alte wieder.
 */
function pickQuestions(room: Room): EstimateGame["questions"] {
  const { estTopic, estQuestions } = room.settings;
  const pool = ESTIMATE_BANK.map((question, index) => ({ question, index })).filter(
    ({ question }) => estTopic === "all" || question.cat === estTopic,
  );
  let fresh = pool.filter(({ index }) => !room.estimateUsed.has(index));
  if (fresh.length < estQuestions) {
    for (const { index } of pool) room.estimateUsed.delete(index);
    fresh = pool;
  }
  return shuffle(fresh)
    .slice(0, estQuestions)
    .map(({ question, index }) => {
      room.estimateUsed.add(index);
      return { qid: randomBytes(8).toString("hex"), question };
    });
}

/* ---------- Ablauf ---------- */

export function startEstimate(room: Room) {
  for (const p of room.players.values()) p.score = 0;
  stopEstimateTimer(room.estimate);
  const now = Date.now();
  room.estimate = {
    questions: pickQuestions(room),
    index: 0,
    stage: "countdown",
    startedAt: now,
    endsAt: now + ESTIMATE_COUNTDOWN_MS,
    guesses: new Map(),
    gains: new Map(),
    feed: [],
  };
  room.phase = "round";
  const game = room.estimate;
  game.timer = setTimeout(() => {
    startQuestion(room, game, 0);
    broadcast(room);
  }, ESTIMATE_COUNTDOWN_MS);
}

export function stopEstimateTimer(game: EstimateGame | undefined) {
  clearTimeout(game?.timer);
}

function startQuestion(room: Room, game: EstimateGame, index: number) {
  if (room.estimate !== game) return;
  stopEstimateTimer(game);
  if (index >= game.questions.length || connected(room).length < 2) {
    room.phase = "finished";
    return;
  }
  const now = Date.now();
  const duration = room.settings.estSeconds * 1000;
  game.index = index;
  game.stage = "question";
  game.startedAt = now;
  game.endsAt = now + duration;
  game.guesses = new Map();
  game.gains = new Map();
  game.feed = [];
  game.timer = setTimeout(() => endQuestion(room), duration);
}

/**
 * Punkte nach Abstand zur Lösung: am nächsten 100, dann 60, 40 und für alle weiteren 20 (wer
 * gleich weit weg liegt, teilt sich den Platz). Genau getroffen: +50.
 */
export function scoreGuesses(guesses: Map<string, number>, answer: number): Map<string, number> {
  const distance = (id: string) => Math.abs(guesses.get(id)! - answer);
  const ids = [...guesses.keys()];
  const gains = new Map<string, number>();
  for (const id of ids) {
    const better = ids.filter((other) => distance(other) < distance(id)).length;
    const points = ESTIMATE_POINTS[Math.min(better, ESTIMATE_POINTS.length - 1)];
    gains.set(id, points + (distance(id) === 0 ? ESTIMATE_EXACT_BONUS : 0));
  }
  return gains;
}

/** Frage beenden: Punkte verteilen, Auflösung zeigen, danach die nächste. */
export function endQuestion(room: Room) {
  const game = room.estimate;
  if (!game || room.phase !== "round" || game.stage !== "question") return;
  stopEstimateTimer(game);
  game.gains = scoreGuesses(game.guesses, current(game).answer);
  for (const [id, points] of game.gains) {
    const player = room.players.get(id);
    if (player) player.score += points;
  }
  const now = Date.now();
  game.stage = "reveal";
  game.startedAt = now;
  game.endsAt = now + ESTIMATE_REVEAL_MS;
  game.timer = setTimeout(() => {
    startQuestion(room, game, game.index + 1);
    broadcast(room);
  }, ESTIMATE_REVEAL_MS);
  broadcast(room);
}

/** Alle (verbundenen) Spieler haben getippt? Dann gleich auflösen. */
export function checkEstimateDone(room: Room) {
  const game = room.estimate;
  if (!game || room.phase !== "round" || game.stage !== "question") return;
  const players = connected(room);
  if (players.length && players.every((p) => game.guesses.has(p.id))) endQuestion(room);
}

/* ---------- Tipps ---------- */

function current(game: EstimateGame) {
  return (game.questions[game.index] ?? game.questions[0]).question;
}

/** Einen Tipp abgeben – einer pro Frage, ändern geht nicht. Nur ganze Zahlen ab 0. */
export function submitGuess(room: Room, player: Player, qid: unknown, raw: unknown): boolean {
  const game = room.estimate;
  if (!game || room.phase !== "round" || game.stage !== "question") return false;
  if (qid !== game.questions[game.index]?.qid || game.guesses.has(player.id)) return false;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > ESTIMATE_MAX) return false;
  game.guesses.set(player.id, value);
  game.feed.push({ id: nextFeedId(), playerId: player.id, name: player.name, kind: "locked" });
  checkEstimateDone(room);
  return true;
}

/* ---------- Sicht ---------- */

/** Was ein Spieler von der laufenden Frage sehen darf: fremde Tipps und Lösung erst am Ende. */
export function estimateView(room: Room, playerId: string): EstimateView {
  const game = room.estimate!;
  const entry = game.questions[game.index] ?? game.questions[0];
  const view: EstimateView = {
    index: game.index + 1,
    total: game.questions.length,
    stage: game.stage,
    qid: game.stage === "countdown" || !entry ? "" : entry.qid,
    endsAt: game.endsAt,
    durationMs: game.endsAt - game.startedAt,
    answered: [...game.guesses.keys()],
    feed: game.feed.slice(-40),
  };
  if (game.stage === "countdown" || !entry) return view;
  const { question } = entry;
  view.text = { de: question.de, en: question.en };
  view.category = question.cat;
  view.unit = question.unit;
  const mine = game.guesses.get(playerId);
  if (mine !== undefined) view.yourGuess = mine;
  if (game.stage === "reveal") {
    view.answer = question.answer;
    view.guesses = Object.fromEntries(game.guesses);
    view.gains = Object.fromEntries(game.gains);
    const best = Math.min(...[...game.guesses.values()].map((g) => Math.abs(g - question.answer)));
    view.closest = [...game.guesses]
      .filter(([, g]) => Math.abs(g - question.answer) === best)
      .map(([id]) => id);
    view.exact = [...game.guesses].filter(([, g]) => g === question.answer).map(([id]) => id);
  }
  return view;
}
