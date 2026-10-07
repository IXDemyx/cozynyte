export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string;
}

export type Phase = "lobby" | "picking" | "round" | "reveal" | "finished";

export interface Settings {
  songsPerPlayer: number;
  roundSeconds: number;
  /** Motto der Partie, vom Host frei wählbar (leer = keins). */
  theme: string;
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
}

export type FeedKind = "wrong" | "close" | "title" | "artist";

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
  feed: FeedItem[];
}

export interface RevealView {
  index: number;
  total: number;
  track: Track;
  pickerId: string;
  gains: Record<string, number>;
  nextAt: number;
  isLast: boolean;
}

export interface RoomState {
  code: string;
  phase: Phase;
  hostId: string;
  you: string;
  settings: Settings;
  players: PlayerView[];
  myPicks: Track[];
  round?: RoundView;
  reveal?: RevealView;
  serverNow: number;
}

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; error: string };
