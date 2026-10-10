import type { KniffelState } from "./kniffel";
import type { SlfVerdict } from "./slf";

export type Game = "song" | "year" | "timeline" | "kniffel" | "slf";

/** Die Musikspiele teilen sich Lobby, Songauswahl und Runden – und lassen sich im Raum umschalten. */
export const MUSIC_GAMES: Game[] = ["song", "year", "timeline"];

export type TimelineMode = "together" | "turns";

export type SlfLetterMode = "random" | "recite";

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string;
  /** Erscheinungsjahr laut iTunes (für Guess the Year). */
  year?: number;
}

export type Phase = "lobby" | "picking" | "round" | "reveal" | "finished";

export interface Settings {
  songsPerPlayer: number;
  roundSeconds: number;
  /** Motto der Partie, vom Host frei wählbar (leer = keins). */
  theme: string;
  /** Guess the Year: Titel und Interpret während der Runde anzeigen? */
  showSong: boolean;
  /** Song-Timeline: alle gleichzeitig oder reihum. */
  timelineMode: TimelineMode;
  /** Song-Timeline: so viele Karten braucht man zum Sieg (0 = kein Limit). */
  timelineGoal: number;
  /** Stadt Land Fluss: Kategorien („@city" = vordefiniert, sonst eigener Text). */
  slfCategories: string[];
  slfRounds: number;
  /** Zeitlimit einer Runde in Sekunden. */
  slfSeconds: number;
  /** Q, X und Y mitspielen? */
  slfHardLetters: boolean;
  /** Buchstabe zufällig oder wie am Tisch: einer sagt das Alphabet auf, ein anderer sagt Stopp. */
  slfLetterMode: SlfLetterMode;
}

/** Eine Karte in der Song-Timeline – das Jahr ist sichtbar. */
export interface TimelineCard {
  id: number;
  title: string;
  artist: string;
  artwork: string;
  year: number;
  /** Nur im Endstand: falsch gelegt – steht dort, wo der Spieler sie hingelegt hat. */
  wrong?: boolean;
}

export interface PlayerView {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  /** Anzahl bereits gewählter Songs (Auswahlphase) */
  picked: number;
  /** Status in der laufenden Runde */
  gotTitle: boolean;
  gotArtist: boolean;
  /** Hat in dieser Runde alles abgegeben (beide Teile erraten bzw. Jahr getippt). */
  answered: boolean;
  /** Song-Timeline: Karten in der eigenen Zeitleiste. */
  cards: number;
  /** Testbot (nur im Testmodus). */
  bot: boolean;
}

export type FeedKind = "wrong" | "close" | "title" | "artist" | "locked" | "placed";

export interface FeedItem {
  id: number;
  playerId: string;
  name: string;
  kind: FeedKind;
  text?: string;
}

/** Nachricht im Raum-Chat (Lobby, Songauswahl, Auflösung, Endstand, Kniffel). */
export interface ChatMessage {
  id: number;
  playerId: string;
  name: string;
  text: string;
}

export interface RoundView {
  index: number;
  total: number;
  previewUrl: string;
  endsAt: number;
  durationMs: number;
  youArePicker: boolean;
  titleMask: string;
  artistMask: string;
  /** Guess the Year: sichtbar, wenn der Host es erlaubt (oder man den Song selbst gewählt hat). */
  song?: { title: string; artist: string };
  /** Guess the Year: der eigene, bereits abgegebene Tipp. */
  yourYear?: number;
  /** Guess the Year: die Lösung – nur für den, der den Song gewählt hat. */
  answerYear?: number;
  /** Song-Timeline: wer gerade einordnen darf (nur reihum) und die eigene Wahl. */
  activeId?: string;
  canPlace?: boolean;
  yourPosition?: number;
  /** Reihum: wo der Spieler am Zug eingeordnet hat – für alle sichtbar. */
  activePosition?: number;
  feed: FeedItem[];
}

export interface RevealView {
  index: number;
  total: number;
  track: Track;
  pickerId: string;
  gains: Record<string, number>;
  /** Guess the Year: abgegebene Tipps je Spieler. */
  yearGuesses?: Record<string, number>;
  /** Song-Timeline: wo jeder eingeordnet hat und ob es stimmte. */
  placements?: Record<string, { position: number; correct: boolean }>;
  nextAt: number;
  isLast: boolean;
}

/** Stadt Land Fluss: eine bewertete Antwort in der Auswertung. */
export interface SlfCell {
  text: string;
  verdict: SlfVerdict;
  points: number;
  /** Wer die Antwort abgelehnt hat. */
  votes: string[];
}

/** Stadt Land Fluss: Stand der laufenden Runde (Schreiben bzw. Auswertung). */
export interface SlfView {
  round: number;
  rounds: number;
  letter: string;
  categories: string[];
  endsAt: number;
  /** Schreibzeit (von startsAt bis endsAt). */
  durationMs: number;
  /** Bis hier läuft der Countdown, danach rattert (Zufallsmodus) der Buchstabe … */
  countdownEndsAt: number;
  /** … und ab hier wird geschrieben. Beim Aufsagen gleich countdownEndsAt. */
  startsAt: number;
  /** Jemand hat „Stopp!" gerufen: Schluss um stopAt. */
  stopAt?: number;
  stoppedBy?: string;
  /**
   * Buchstabe wird gerade aufgesagt (Modus „recite"): wer zählt, wer Stopp sagt. Den aktuellen
   * Buchstaben sieht nur, wer zählt – solange ist `letter` leer.
   */
  drawing?: { reciterId: string; stopperId: string; current?: string };
  /** Beim Schreiben: wie viele Felder jeder schon ausgefüllt hat (nicht was). */
  filled: Record<string, number>;
  /** Die eigenen Antworten (nach Neuladen wieder da). */
  mine: string[];
  /** Auswertung: alle Antworten, je Spieler eine Zelle pro Kategorie. */
  cells?: Record<string, SlfCell[]>;
  /** Auswertung: Punkte dieser Runde je Spieler. */
  gains?: Record<string, number>;
}

export interface RoomState {
  code: string;
  game: Game;
  phase: Phase;
  hostId: string;
  you: string;
  settings: Settings;
  players: PlayerView[];
  myPicks: Track[];
  /** Song-Timeline: Zeitleisten aller Spieler, nach Jahr sortiert. */
  timelines?: Record<string, TimelineCard[]>;
  /** Nur in Kniffel-Räumen: der gemeinsame Block. */
  kniffel?: KniffelState;
  /** Nur bei Stadt Land Fluss während Runde und Auswertung. */
  slf?: SlfView;
  round?: RoundView;
  reveal?: RevealView;
  /** Raum-Chat, die letzten Nachrichten. */
  chat: ChatMessage[];
  /** Testmodus des Servers: Testbots können hinzugefügt werden. */
  devTools: boolean;
  serverNow: number;
}

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; error: string };
