/** Datenmodell des Servers: Räume, Spieler, Runden – und die Liste aller Räume. */

import type { DrawOp, DrawStage } from "../../shared/draw";
import type { ChatMessage, FeedItem, Game, Phase, Settings, Track } from "../../shared/types";
import type { Category, DigitalRoll, KniffelState } from "../../shared/kniffel";
import { DEFAULT_CATEGORIES } from "../../shared/slf";

export interface Player {
  id: string;
  name: string;
  score: number;
  socketId?: string;
  picks: Track[];
  removeTimer?: NodeJS.Timeout;
  /** Zeitpunkte der letzten Songsuchen (für das Suchlimit). */
  searches: number[];
  /** Zeitpunkte der letzten Chatnachrichten (gegen Spam). */
  chats: number[];
  /** Song-Timeline: nach Jahr sortierte Karten. */
  timeline: Track[];
  /**
   * Song-Timeline: falsch gelegte Karten und wo sie lagen – vor der Karte `beforeId` der
   * Zeitleiste (null = ganz hinten). So lassen sie sich im Endstand an der Stelle zeigen.
   */
  misses: { track: Track; beforeId: number | null }[];
  /** Testbot (nur im Testmodus): gilt als verbunden, wird aber nie Host. */
  bot?: boolean;
  /** Montagsmaler „Eigene Runde“: eingereichte Begriffe. */
  words: string[];
}

/** Ein Begriff zum Zeichnen; bei „Eigene Runde“ mit dem Spieler, der ihn eingereicht hat. */
export interface DrawWord {
  word: string;
  authorId?: string;
}

/** Buchstaben-Hinweise: zufällige Reihenfolge der Positionen und wie viele schon offen sind. */
export interface Hint {
  order: number[];
  revealed: number;
  perStep: number;
  max: number;
}

export interface Round {
  track: Track;
  pickerId: string;
  startedAt: number;
  endsAt: number;
  timer: NodeJS.Timeout;
  feed: FeedItem[];
  /** Punkte, die in dieser Runde dazukamen. */
  gains: Map<string, number>;
  /** Guess the Song: was jeder schon erraten hat. */
  got: Map<string, { title: boolean; artist: boolean }>;
  titleHint: Hint;
  artistHint: Hint;
  hintTimers: NodeJS.Timeout[];
  /** Guess the Year: abgegebene Jahre je Spieler. */
  years: Map<string, number>;
  /** Song-Timeline: gewählte Lücke je Spieler, Ergebnis und wer reihum dran ist. */
  placements: Map<string, number>;
  results: Map<string, { position: number; correct: boolean }>;
  activeId?: string;
}

/** Ein Kniffel-Eintrag mit allem, was zum Zurücknehmen nötig ist. */
export interface KniffelStep {
  column: string;
  category: Category;
  before: number | undefined;
  current: string | null;
  roll: DigitalRoll | null;
}

/** Stadt Land Fluss: Zustand der Partie. */
export interface SlfGame {
  /** Laufende Runde (1-basiert). */
  round: number;
  letter: string;
  /** Schon gespielte Buchstaben – jeder kommt pro Partie nur einmal. */
  used: string[];
  /** Aufsagen: wer zählt, wer Stopp sagt, welche Buchstaben in Frage kommen und wo man steht. */
  drawing?: {
    reciterId: string;
    stopperId: string;
    pool: string[];
    /** -1 = noch nicht angefangen. */
    position: number;
  };
  /** Kategorien dieser Partie (beim Start festgehalten). */
  categories: string[];
  answers: Map<string, string[]>;
  /** Gegenstimmen: Schlüssel „spielerId:kategorieIndex" → wer abgelehnt hat. */
  votes: Map<string, Set<string>>;
  /** Ende des Countdowns vor dem Schreiben (beim Aufsagen: Beginn des Aufsagens). */
  countdownEndsAt: number;
  /** Ab hier darf geschrieben werden (nach Countdown und ggf. Buchstaben-Rattern). */
  startsAt: number;
  endsAt: number;
  stopAt?: number;
  stoppedBy?: string;
  timer?: NodeJS.Timeout;
}

/** Montagsmaler: Zustand der Partie und des laufenden Zugs. */
export interface DrawGame {
  /** Laufende Runde (1-basiert) – in jeder Runde zeichnet jeder einmal. */
  round: number;
  /** Reihenfolge der Zeichner; wer später dazukommt, wird hinten angehängt. */
  seats: string[];
  seatPos: number;
  /** Fortlaufende Nummer des Zugs (über alle Räume eindeutig). */
  turn: number;
  stage: DrawStage;
  drawerId: string;
  /** Drei Begriffe zur Wahl. */
  choices: DrawWord[];
  word: string;
  /** „Eigene Runde“: wer den aktuellen Begriff eingereicht hat. */
  authorId?: string;
  /** „Eigene Runde“: die noch nicht gezeichneten Begriffe der Spieler (sonst null = Standardliste). */
  pool: DrawWord[] | null;
  hint: Hint;
  startedAt: number;
  endsAt: number;
  /** Wer richtig geraten hat – in der Reihenfolge. */
  guessed: string[];
  gains: Map<string, number>;
  feed: FeedItem[];
  ops: DrawOp[];
  /** Schon gezeichnete Begriffe – kommen in dieser Partie nicht noch einmal. */
  used: Set<string>;
  timer?: NodeJS.Timeout;
  hintTimers: NodeJS.Timeout[];
}

export interface Room {
  code: string;
  game: Game;
  hostId: string;
  phase: Phase;
  settings: Settings;
  players: Map<string, Player>;
  /** Vom Host entfernte Spieler dürfen nicht wieder beitreten. */
  banned: Set<string>;
  emptySince?: number;
  chat: ChatMessage[];

  // Musikspiele
  queue: { track: Track; pickerId: string }[];
  roundIndex: number;
  round?: Round;
  revealNextAt: number;
  revealTimer?: NodeJS.Timeout;

  // Song-Timeline: Reihenfolge für den Reihum-Modus und ob jemand das Ziel erreicht hat.
  turnOrder: string[];
  turnPos: number;
  activeId?: string;
  timelineOver: boolean;

  // Kniffel: gemeinsamer Block, Zähler für Spalten-IDs und Verlauf zum Rückgängigmachen.
  kniffel?: KniffelState;
  nextColumn: number;
  kniffelHistory: KniffelStep[];

  // Stadt Land Fluss
  slf?: SlfGame;

  // Montagsmaler
  draw?: DrawGame;
}

export const rooms = new Map<string, Room>();

let feedId = 0;

/** Fortlaufende ID für Einträge im Verlauf einer Runde. */
export function nextFeedId(): number {
  return ++feedId;
}

export function createRoom(code: string, game: Game, hostId: string): Room {
  return {
    code,
    game,
    hostId,
    phase: "lobby",
    settings: {
      songsPerPlayer: 3,
      roundSeconds: 30,
      theme: "",
      showSong: true,
      timelineMode: "together",
      timelineGoal: 6,
      slfCategories: [...DEFAULT_CATEGORIES],
      slfRounds: 5,
      slfSeconds: 120,
      slfHardLetters: false,
      slfLetterMode: "random",
      drawRounds: 3,
      drawSeconds: 80,
      drawLanguage: "de",
      drawWordMode: "standard",
      drawWordsPerPlayer: 5,
    },
    players: new Map(),
    banned: new Set(),
    chat: [],
    queue: [],
    roundIndex: 0,
    revealNextAt: 0,
    turnOrder: [],
    turnPos: -1,
    timelineOver: false,
    kniffel:
      game === "kniffel"
        ? { columns: [], cells: {}, current: null, locked: false, roll: null, lastEntry: null }
        : undefined,
    nextColumn: 0,
    kniffelHistory: [],
  };
}

export function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    score: 0,
    picks: [],
    searches: [],
    chats: [],
    timeline: [],
    misses: [],
    words: [],
  };
}

/* ---------- Hilfsfunktionen ---------- */

export function newCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (;;) {
    let code = "";
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    if (!rooms.has(code)) return code;
  }
}

export function cleanName(name: unknown): string {
  return String(name ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
}

export function shuffle<T>(list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Verbundene Spieler – Testbots zählen mit. */
export function connected(room: Room): Player[] {
  return [...room.players.values()].filter((p) => p.socketId);
}

/** Verbundene echte Menschen (ohne Testbots). */
export function humans(room: Room): Player[] {
  return connected(room).filter((p) => !p.bot);
}
