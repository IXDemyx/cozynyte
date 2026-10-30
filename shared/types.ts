import type { Continent, QuizAnswerMode, QuizKind, QuizMode, QuizRegion } from "./countries";
import type { DrawStage } from "./draw";
import type { EstimateCategory, EstimateTopic, EstimateUnit } from "./estimate";
import type { KniffelState } from "./kniffel";
import type { SlfVerdict } from "./slf";

export type Game = "song" | "year" | "timeline" | "kniffel" | "slf" | "draw" | "geo" | "estimate";

/** Die Musikspiele teilen sich Lobby, Songauswahl und Runden – und lassen sich im Raum umschalten. */
export const MUSIC_GAMES: Game[] = ["song", "year", "timeline"];

/** Spiele, für die es öffentliche Räume gibt (Kniffel dann mit gesperrten Spalten). */
export const PUBLIC_GAMES: Game[] = [
  "song",
  "year",
  "timeline",
  "slf",
  "draw",
  "geo",
  "estimate",
  "kniffel",
];

/** Offene öffentliche Räume, die gerade Mitspieler suchen (für die Startseite). */
export interface OpenRooms {
  total: number;
  byGame: Partial<Record<Game, number>>;
}

export type TimelineMode = "together" | "turns";

export type SlfLetterMode = "random" | "recite";

export type DrawLanguage = "de" | "en";

/** Montagsmaler: Begriffe aus der Liste oder nur die, die die Spieler vorher eingereicht haben. */
export type DrawWordMode = "standard" | "players";

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string;
  /** Erscheinungsjahr laut iTunes (für Guess the Year). */
  year?: number;
  /** Song-Timeline: Startkarte ohne Song – nur eine Jahreszahl als erster Anhaltspunkt. */
  anchor?: boolean;
}

export type Phase = "lobby" | "picking" | "round" | "reveal" | "finished";

export interface Settings {
  /** Öffentlicher Raum: Fremde können über „Zufälliger Raum“ beitreten. */
  isPublic: boolean;
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
  /** Montagsmaler: Runden (jeder zeichnet einmal pro Runde) und Zeit pro Zeichnung. */
  drawRounds: number;
  drawSeconds: number;
  /** Sprache der Begriffsliste. */
  drawLanguage: DrawLanguage;
  /** Woher die Begriffe kommen; bei „players“ ist `theme` das Motto. */
  drawWordMode: DrawWordMode;
  /** „Eigene Runde“: so viele Begriffe reicht jeder ein. */
  drawWordsPerPlayer: number;
  /** Länder-Quiz: Fragenart, Region, nur bekannte Länder, Tippen oder Auswahl, Hinweise. */
  geoMode: QuizMode;
  geoRegion: QuizRegion;
  geoKnownOnly: boolean;
  geoAnswer: QuizAnswerMode;
  geoQuestions: number;
  geoSeconds: number;
  geoHints: boolean;
  /** Auswahl: so viele 50:50-Joker hat jeder pro Partie (0 = keine). */
  geoJokers: number;
  /** Schätzfragen: Thema (alle gemischt oder eins), Anzahl Fragen, Zeit pro Frage. */
  estTopic: EstimateTopic;
  estQuestions: number;
  estSeconds: number;
}

/** Eine Karte in der Song-Timeline – das Jahr ist sichtbar. */
export interface TimelineCard {
  id: number;
  title: string;
  artist: string;
  artwork: string;
  year: number;
  /** Startjahr ohne Song (Titel und Interpret leer). */
  anchor?: boolean;
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

export type FeedKind =
  | "wrong"
  | "close"
  | "title"
  | "artist"
  | "locked"
  | "placed"
  | "guessed"
  | "joker";

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
  /** Von Hand als doppelt markiert. */
  marked?: boolean;
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

/** Montagsmaler: Stand des laufenden Zugs. Die Zeichnung selbst kommt über eigene Events. */
export interface DrawView {
  round: number;
  rounds: number;
  /** Fortlaufende Nummer des Zugs – Zeichenbefehle gehören immer zu einem Zug. */
  turn: number;
  stage: DrawStage;
  drawerId: string;
  /** Ende der Wahl, der Zeichenzeit bzw. der Auflösung. */
  endsAt: number;
  durationMs: number;
  /** Nur für den Zeichner während der Wahl. */
  choices?: string[];
  /** Klartext für Zeichner, wer es erraten hat, und für alle in der Auflösung. */
  word?: string;
  /** Lücken mit aufgedeckten Hinweis-Buchstaben, z. B. „K_tz_“. */
  mask: string;
  /** „Eigene Runde“: wer den Begriff eingereicht hat (rät nicht mit, bekommt Punkte für Treffer). */
  authorId?: string;
  /** Wer in diesem Zug schon richtig geraten hat (in der Reihenfolge). */
  guessed: string[];
  /** Punkte dieses Zugs je Spieler (in der Auflösung). */
  gains?: Record<string, number>;
  /** Ereignisse im Chat: erraten, knapp daneben. */
  feed: FeedItem[];
}

/** Länder-Quiz: Stand der laufenden Frage. Die Lösung kommt erst, wenn man sie kennen darf. */
export interface GeoView {
  /** Laufende Frage (1-basiert) und Anzahl insgesamt. */
  index: number;
  total: number;
  /** Countdown vor der ersten Frage, Frage, Auflösung. */
  stage: "countdown" | "question" | "reveal";
  kind: QuizKind;
  /** Kennung der Frage – Teil der Bild-Adresse (verrät nichts über das Land). */
  qid: string;
  endsAt: number;
  durationMs: number;
  /** Hauptstadt-Frage: das gefragte Land (ist ja nicht geheim). */
  asked?: string;
  /** Auswahl: vier Länder-Codes; bei Hauptstadt-Fragen stehen sie für deren Hauptstädte. */
  options?: string[];
  /** 50:50-Joker eingelöst: diese zwei falschen Antworten sind für einen selbst weg. */
  removed?: string[];
  /** Auswahl: so viele Joker hat man in dieser Partie noch. */
  jokers?: number;
  /** Hinweis beim Tippen: der Kontinent … */
  continent?: Continent;
  /** … und Lücken mit aufgedeckten Buchstaben, je Sprache (die Spieler sprechen verschiedene). */
  masks?: { de: string; en: string };
  /** Die Lösung (Länder-Code) – in der Auflösung oder für den, der schon richtig lag. */
  answer?: string;
  /** Eigene Antwort: gewählte Option bzw. ob man es schon getippt hat. */
  yourChoice?: string;
  youGotIt?: boolean;
  /** Wer schon geantwortet (Auswahl) bzw. es schon herausgefunden hat (Tippen). */
  answered: string[];
  /** Auflösung: wer richtig lag, wer was gewählt hat, Punkte dieser Frage. */
  correct?: string[];
  choices?: Record<string, string>;
  gains?: Record<string, number>;
  feed: FeedItem[];
}

/** Schätzfragen: Stand der laufenden Frage. Lösung und fremde Tipps erst in der Auflösung. */
export interface EstimateView {
  /** Laufende Frage (1-basiert) und Anzahl insgesamt. */
  index: number;
  total: number;
  /** Countdown vor der ersten Frage, Frage, Auflösung. */
  stage: "countdown" | "question" | "reveal";
  /** Kennung der Frage (für Tipps – damit ein verspäteter nicht bei der nächsten landet). */
  qid: string;
  endsAt: number;
  durationMs: number;
  /** Frage in beiden Sprachen (die Spieler sprechen verschiedene) – fehlt beim Countdown. */
  text?: { de: string; en: string };
  category?: EstimateCategory;
  unit?: EstimateUnit;
  /** Wer schon getippt hat (nicht was). */
  answered: string[];
  /** Der eigene Tipp. */
  yourGuess?: number;
  /** Auflösung: Lösung, alle Tipps, Punkte, wer am nächsten dran war bzw. genau getroffen hat. */
  answer?: number;
  guesses?: Record<string, number>;
  gains?: Record<string, number>;
  closest?: string[];
  exact?: string[];
  feed: FeedItem[];
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
  /** Montagsmaler „Eigene Runde“: die eigenen eingereichten Begriffe (nur beim Sammeln). */
  myWords?: string[];
  /** Song-Timeline: Zeitleisten aller Spieler, nach Jahr sortiert. */
  timelines?: Record<string, TimelineCard[]>;
  /** Nur in Kniffel-Räumen: der gemeinsame Block. */
  kniffel?: KniffelState;
  /** Nur bei Stadt Land Fluss während Runde und Auswertung. */
  slf?: SlfView;
  /** Nur bei Montagsmaler während der Partie. */
  draw?: DrawView;
  /** Nur beim Länder-Quiz während der Partie. */
  geo?: GeoView;
  /** Nur bei Schätzfragen während der Partie. */
  estimate?: EstimateView;
  round?: RoundView;
  reveal?: RevealView;
  /** Raum-Chat, die letzten Nachrichten. */
  chat: ChatMessage[];
  /** Lobby: Der Host hat die letzte Partie mittendrin abgebrochen (Hinweis für die anderen). */
  notice?: LobbyNotice;
  /** Testmodus des Servers: Testbots können hinzugefügt werden. */
  devTools: boolean;
  serverNow: number;
}

export interface LobbyNotice {
  /** Eindeutig je Abbruch – damit der Hinweis nach dem Wegklicken nicht wiederkommt. */
  id: number;
  kind: "aborted";
  /** Wer abgebrochen hat. */
  name: string;
}

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; error: string };
