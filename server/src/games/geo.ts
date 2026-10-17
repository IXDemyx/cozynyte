/**
 * Länder-Quiz: Alle sehen dieselbe Frage (Flagge, Landesumriss oder Hauptstadt) und antworten
 * gleichzeitig – getippt oder aus vier Antworten gewählt. Wer schneller richtig liegt, bekommt
 * mehr Punkte. Nach jeder Frage kurz die Auflösung, nach der letzten der Endstand.
 */

import { randomBytes, randomInt } from "node:crypto";
import {
  COUNTRIES,
  COUNTRY_BY_CODE,
  NO_OUTLINE,
  QUIZ_COUNTDOWN_MS,
  QUIZ_REVEAL_MS,
  SIMILAR_FLAGS,
  quizPool,
  supportsKind,
  type Country,
  type QuizKind,
} from "../../../shared/countries";
import type { GeoView } from "../../../shared/types";
import { levenshtein, maskText, normalize } from "../music/match";
import {
  connected,
  nextFeedId,
  shuffle,
  type GeoGame,
  type GeoQuestion,
  type Player,
  type Room,
} from "../state";
import { broadcast } from "../view";

/* ---------- Fragen zusammenstellen ---------- */

/** Länder, die nach Region und Schwierigkeit in Frage kommen. */
export function geoPool(room: Room): Country[] {
  return quizPool(room.settings);
}

function questionsFor(room: Room): GeoQuestion[] {
  const { geoMode, geoQuestions, geoAnswer } = room.settings;
  return shuffle(geoPool(room))
    .slice(0, geoQuestions)
    .map((country) => {
      const kinds = (["flag", "outline", "capital"] as const).filter((k) =>
        supportsKind(country, k),
      );
      const kind = geoMode === "mix" ? kinds[randomInt(kinds.length)] : geoMode;
      return {
        qid: randomBytes(8).toString("hex"),
        kind,
        code: country.code,
        options: geoAnswer === "choice" ? options(room, country, kind) : undefined,
      };
    });
}

/**
 * Vier Antworten zur Auswahl: die richtige und drei falsche. Bei Flaggen bevorzugt solche, die
 * zum Verwechseln ähnlich sind, sonst aus derselben Region – erst dann aus der ganzen Welt.
 */
function options(room: Room, country: Country, kind: QuizKind): string[] {
  const fits = (c: Country) => c.code !== country.code && supportsKind(c, kind);
  const picked = new Set<string>();
  const take = (list: Country[], max: number) => {
    for (const c of shuffle([...list])) {
      if (picked.size >= max) return;
      if (fits(c)) picked.add(c.code);
    }
  };
  if (kind === "flag") {
    const similar = SIMILAR_FLAGS.filter((group) => group.includes(country.code))
      .flat()
      .map((code) => COUNTRY_BY_CODE.get(code)!);
    take(similar, 2);
  }
  const level = (c: Country) => !room.settings.geoKnownOnly || c.known;
  take(
    COUNTRIES.filter((c) => c.continent === country.continent && level(c)),
    3,
  );
  take(
    COUNTRIES.filter((c) => c.continent === country.continent),
    3,
  );
  take(COUNTRIES, 3);
  return shuffle([country.code, ...picked]);
}

/* ---------- Ablauf ---------- */

export function startGeo(room: Room) {
  for (const p of room.players.values()) p.score = 0;
  stopTimers(room.geo);
  const now = Date.now();
  room.geo = {
    questions: questionsFor(room),
    index: 0,
    stage: "countdown",
    startedAt: now,
    endsAt: now + QUIZ_COUNTDOWN_MS,
    answers: new Map(),
    order: [],
    gains: new Map(),
    feed: [],
    hint: 0,
    hintTimers: [],
    jokers: new Map(),
    fifty: new Set(),
  };
  room.phase = "round";
  const game = room.geo;
  game.timer = setTimeout(() => {
    startQuestion(room, game, 0);
    broadcast(room);
  }, QUIZ_COUNTDOWN_MS);
}

export function stopTimers(game: GeoGame | undefined) {
  if (!game) return;
  clearTimeout(game.timer);
  game.hintTimers.forEach(clearTimeout);
  game.hintTimers = [];
}

function startQuestion(room: Room, game: GeoGame, index: number) {
  if (room.geo !== game) return;
  stopTimers(game);
  if (index >= game.questions.length || connected(room).length < 2) return finish(room);
  const now = Date.now();
  const duration = room.settings.geoSeconds * 1000;
  game.index = index;
  game.stage = "question";
  game.startedAt = now;
  game.endsAt = now + duration;
  game.answers = new Map();
  game.order = [];
  game.gains = new Map();
  game.feed = [];
  game.hint = 0;
  game.fifty = new Set();
  game.timer = setTimeout(() => endQuestion(room), duration);
  // Tippen: Kontinent bzw. erster Buchstabe, später noch ein Buchstabe. Bei der Auswahl gibt es
  // stattdessen Joker, die jeder selbst einlöst.
  if (!room.settings.geoHints || room.settings.geoAnswer === "choice") return;
  game.hintTimers = [0.4, 0.7].map((fraction) =>
    setTimeout(() => {
      if (room.geo === game && game.stage === "question") {
        game.hint++;
        broadcast(room);
      }
    }, duration * fraction),
  );
}

/** Frage beenden: Auflösung zeigen, danach die nächste. */
export function endQuestion(room: Room) {
  const game = room.geo;
  if (!game || room.phase !== "round" || game.stage !== "question") return;
  stopTimers(game);
  for (const [id, points] of game.gains) {
    const player = room.players.get(id);
    if (player) player.score += points;
  }
  const now = Date.now();
  game.stage = "reveal";
  game.startedAt = now;
  game.endsAt = now + QUIZ_REVEAL_MS;
  game.timer = setTimeout(() => {
    startQuestion(room, game, game.index + 1);
    broadcast(room);
  }, QUIZ_REVEAL_MS);
  broadcast(room);
}

function finish(room: Room) {
  stopTimers(room.geo);
  room.phase = "finished";
}

/** Alle (verbundenen) Spieler haben geantwortet bzw. es herausgefunden? Dann gleich auflösen. */
export function checkQuestionDone(room: Room) {
  const game = room.geo;
  if (!game || room.phase !== "round" || game.stage !== "question") return;
  const players = connected(room);
  const done = (p: Player) => {
    const answer = game.answers.get(p.id);
    return room.settings.geoAnswer === "choice" ? Boolean(answer) : Boolean(answer?.correct);
  };
  if (players.length && players.every(done)) endQuestion(room);
}

/* ---------- Antworten ---------- */

function current(game: GeoGame): GeoQuestion {
  return game.questions[game.index];
}

/**
 * Punkte: je schneller, desto mehr – plus ein kleiner Bonus für die ersten drei. Gutgeschrieben
 * wird erst in der Auflösung (endQuestion): Sonst sähe man am Punktestand in der Spielerliste
 * schon während der Frage, wer richtig lag.
 */
function award(room: Room, game: GeoGame, player: Player) {
  const total = game.endsAt - game.startedAt;
  const remaining = Math.max(0, Math.min(1, (game.endsAt - Date.now()) / total));
  game.order.push(player.id);
  const placeBonus = Math.max(0, 30 - 10 * (game.order.length - 1));
  const points = 50 + Math.round(100 * remaining) + placeBonus;
  game.gains.set(player.id, points);
}

/** Auswahl: einmal antworten, ändern geht nicht. Ob es stimmt, sehen alle erst in der Auflösung. */
export function chooseAnswer(room: Room, player: Player, qid: unknown, code: unknown): boolean {
  const game = room.geo;
  if (!game || room.phase !== "round" || game.stage !== "question") return false;
  if (room.settings.geoAnswer !== "choice" || game.answers.has(player.id)) return false;
  const question = current(game);
  if (qid !== question.qid || typeof code !== "string" || !question.options?.includes(code)) {
    return false;
  }
  // Nach dem 50:50 sind die zwei weggestrichenen Antworten nicht mehr wählbar.
  const gone = question.options.filter((c) => c !== question.code).slice(0, 2);
  if (game.fifty.has(player.id) && gone.includes(code)) return false;
  const correct = code === question.code;
  game.answers.set(player.id, { correct, choice: code });
  if (correct) award(room, game, player);
  game.feed.push({ id: nextFeedId(), playerId: player.id, name: player.name, kind: "locked" });
  checkQuestionDone(room);
  return true;
}

/** Verbleibende Joker eines Spielers (wer noch keinen gezogen hat, hat alle). */
export function jokersLeft(room: Room, game: GeoGame, playerId: string): number {
  return game.jokers.get(playerId) ?? room.settings.geoJokers;
}

/**
 * 50:50-Joker: zwei falsche Antworten verschwinden – nur für den, der ihn zieht. Einmal pro
 * Frage, solange man noch nicht geantwortet hat und Joker übrig sind.
 */
export function useJoker(room: Room, player: Player, qid: unknown): boolean {
  const game = room.geo;
  if (!game || room.phase !== "round" || game.stage !== "question") return false;
  if (room.settings.geoAnswer !== "choice") return false;
  const question = current(game);
  if (qid !== question.qid || game.answers.has(player.id) || game.fifty.has(player.id)) {
    return false;
  }
  const left = jokersLeft(room, game, player.id);
  if (left <= 0) return false;
  game.jokers.set(player.id, left - 1);
  game.fifty.add(player.id);
  game.feed.push({ id: nextFeedId(), playerId: player.id, name: player.name, kind: "joker" });
  return true;
}

export type TypeResult = "correct" | "close" | "wrong" | "invalid";

/** Tippen: beliebig oft versuchen, bis es stimmt. Treffer und „knapp“ sehen alle im Chat. */
export function typeAnswer(room: Room, player: Player, qid: unknown, raw: unknown): TypeResult {
  const game = room.geo;
  if (!game || room.phase !== "round" || game.stage !== "question") return "invalid";
  if (room.settings.geoAnswer !== "type") return "invalid";
  const question = current(game);
  if (qid !== question.qid || game.answers.get(player.id)?.correct) return "invalid";
  const text = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  if (!text) return "invalid";

  const result = judge(text, question);
  if (result === "correct") {
    game.answers.set(player.id, { correct: true });
    award(room, game, player);
    game.feed.push({ id: nextFeedId(), playerId: player.id, name: player.name, kind: "guessed" });
    checkQuestionDone(room);
  } else if (result === "close") {
    game.feed.push({ id: nextFeedId(), playerId: player.id, name: player.name, kind: "close" });
  }
  return result;
}

/** Alle Namen, unter denen ein Land (bzw. seine Hauptstadt) zählt. */
function namesOf(country: Country, capital: boolean): string[] {
  if (capital) {
    const cap = country.capital;
    return cap ? [cap.de, cap.en, ...(cap.alt ?? [])] : [];
  }
  return [country.de, country.en, ...(country.alt ?? [])];
}

/**
 * Tipp prüfen. Wichtig: Was genau ein anderes Land ist, zählt nie – „Niger“ ist nicht „Nigeria“,
 * „Iran“ nicht „Irak“. Bei Tippfehlern gewinnt, was am nächsten liegt.
 */
export function judge(text: string, question: GeoQuestion): "correct" | "close" | "wrong" {
  const guess = normalize(text);
  if (!guess) return "wrong";
  const capital = question.kind === "capital";
  const country = COUNTRY_BY_CODE.get(question.code)!;
  const own = namesOf(country, capital).map(normalize).filter(Boolean);
  if (own.includes(guess)) return "correct";
  const others = COUNTRIES.filter((c) => c.code !== country.code)
    .flatMap((c) => namesOf(c, capital))
    .map(normalize)
    .filter(Boolean);
  if (others.includes(guess)) return "wrong";

  const ownDistance = Math.min(...own.map((name) => levenshtein(guess, name)));
  const otherDistance = Math.min(...others.map((name) => levenshtein(guess, name)));
  if (ownDistance >= otherDistance) return "wrong";
  const target = own.find((name) => levenshtein(guess, name) === ownDistance)!;
  // Kurze Namen müssen stimmen, längere vertragen ein bis zwei Tippfehler (auch Buchstabendreher).
  const tolerance = target.length <= 4 ? 0 : target.length <= 7 ? 1 : 2;
  if (ownDistance <= tolerance) return "correct";
  if (target.length >= 4 && ownDistance <= Math.max(2, Math.floor(target.length / 3))) {
    return "close";
  }
  return "wrong";
}

/* ---------- Sicht und Bilder ---------- */

/** Lücken mit den ersten `count` Buchstaben (für den Buchstaben-Hinweis). */
function firstLetters(text: string, count: number): string {
  return maskText(text, new Set(Array.from({ length: count }, (_, i) => i)));
}

/** Was ein Spieler von der laufenden Frage sehen darf. */
export function geoView(room: Room, playerId: string): GeoView {
  const game = room.geo!;
  const question = current(game) ?? game.questions[0];
  const country = COUNTRY_BY_CODE.get(question.code)!;
  const mine = game.answers.get(playerId);
  const reveal = game.stage === "reveal";
  const typing = room.settings.geoAnswer === "type";
  const knows = reveal || (typing && mine?.correct);
  const capital = question.kind === "capital";
  const view: GeoView = {
    index: game.index + 1,
    total: game.questions.length,
    stage: game.stage,
    kind: question.kind,
    qid: game.stage === "countdown" ? "" : question.qid,
    endsAt: game.endsAt,
    durationMs: game.endsAt - game.startedAt,
    answered: [...game.answers.keys()].filter((id) => !typing || game.answers.get(id)?.correct),
    feed: game.feed.slice(-40),
  };
  if (game.stage === "countdown") return view;
  if (capital) view.asked = country.code;
  if (question.options) view.options = question.options;
  if (knows) view.answer = country.code;
  if (mine?.choice) view.yourChoice = mine.choice;
  if (typing && mine?.correct) view.youGotIt = true;

  if (!typing) {
    view.jokers = jokersLeft(room, game, playerId);
    // 50:50 eingelöst – die zwei falschen bleiben auch in der Auflösung durchgestrichen.
    if (game.fifty.has(playerId) && question.options) {
      view.removed = question.options.filter((c) => c !== question.code).slice(0, 2);
    }
  }

  // Hinweise beim Tippen (nur während der Frage – in der Auflösung steht ja die Lösung da).
  if (typing && !reveal && game.hint > 0) {
    if (capital && country.capital) {
      view.masks = {
        de: firstLetters(country.capital.de, game.hint),
        en: firstLetters(country.capital.en, game.hint),
      };
    } else {
      view.continent = country.continent;
      if (game.hint > 1) {
        view.masks = { de: firstLetters(country.de, 1), en: firstLetters(country.en, 1) };
      }
    }
  }

  if (reveal) {
    view.correct = [...game.answers].filter(([, a]) => a.correct).map(([id]) => id);
    view.gains = Object.fromEntries(game.gains);
    if (!typing) {
      view.choices = Object.fromEntries(
        [...game.answers].flatMap(([id, a]) => (a.choice ? [[id, a.choice]] : [])),
      );
    }
  }
  return view;
}

/**
 * Bild zur laufenden Frage: Flagge oder Umriss. Die Adresse enthält nur die zufällige Kennung der
 * Frage – im Netzwerk-Tab steht also nicht „de.svg“. Während der Frage gibt es nur das gefragte
 * Bild (bei einer Umriss-Frage nicht schon die Flagge), in der Auflösung beide.
 */
export function geoImage(
  room: Room | undefined,
  qid: string,
  type: string,
): { code: string; type: "flag" | "outline" } | null {
  const game = room?.geo;
  if (!game || room.phase !== "round" || game.stage === "countdown") return null;
  const question = current(game);
  if (!question || question.qid !== qid) return null;
  if (type !== "flag" && type !== "outline") return null;
  if (game.stage === "question" && question.kind !== type) {
    // Hauptstadt-Frage: Die Flagge des gefragten Landes darf man sehen.
    if (!(question.kind === "capital" && type === "flag")) return null;
  }
  if (type === "outline" && NO_OUTLINE.has(question.code)) return null;
  return { code: question.code, type };
}
