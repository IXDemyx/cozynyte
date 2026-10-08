import type { KniffelState } from "./kniffel";

export type Game = "song" | "year" | "timeline" | "kniffel";

export type TimelineMode = "together" | "turns";

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
}

/** Eine Karte in der Song-Timeline – das Jahr ist sichtbar. */
export interface TimelineCard {
  id: number;
  title: string;
  artist: string;
  artwork: string;
  year: number;
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
}

export type FeedKind = "wrong" | "close" | "title" | "artist" | "locked" | "placed";

export interface FeedItem {
  id: number;
  playerId: string;
  name: string;
  kind: FeedKind;
  text?: string;
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
  round?: RoundView;
  reveal?: RevealView;
  serverNow: number;
}

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; error: string };
