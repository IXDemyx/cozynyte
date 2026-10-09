/** Alle Einstellungen des Servers an einem Ort. */

export const PORT = Number(process.env.PORT ?? 3001);

/** Wie lange die Auflösung stehen bleibt, bevor der nächste Song startet. */
export const REVEAL_MS = Number(process.env.REVEAL_MS ?? 9000);

export const MAX_PLAYERS = 16;

/** So lange darf man in der Lobby weg sein, bevor man aus dem Raum fliegt (z. B. beim Neuladen). */
export const LOBBY_GRACE_MS = 15_000;

/** Nach so langer Zeit ohne verbundene Spieler wird ein Raum gelöscht. */
export const ROOM_TTL_MS = 10 * 60_000;

/** Zeitpunkte (Anteil der Rundenzeit), zu denen Buchstaben aufgedeckt werden. */
export const HINT_AT = [0.4, 0.6, 0.8];

/** Songsuche: höchstens SEARCH_LIMIT Anfragen pro Spieler in SEARCH_WINDOW_MS. */
export const SEARCH_WINDOW_MS = 30_000;
export const SEARCH_LIMIT = 20;

/** Raum-Chat: so viele Nachrichten bleiben erhalten, so lang darf eine sein, höchstens
 * CHAT_LIMIT Nachrichten pro Spieler in CHAT_WINDOW_MS. */
export const CHAT_HISTORY = 50;
export const CHAT_MAX_LENGTH = 200;
export const CHAT_WINDOW_MS = 5_000;
export const CHAT_LIMIT = 5;

/** Kniffel: höchstens so viele Spalten und rückgängig machbare Einträge. */
export const MAX_COLUMNS = 16;
export const MAX_UNDO = 100;

/** Erlaubte Werte für die Lobby-Einstellungen. */
export const ROUND_SECONDS = [15, 20, 30, 45];
/** Karten zum Sieg; 0 = kein Limit, gespielt wird bis alle Songs durch sind. */
export const TIMELINE_GOALS = [0, 4, 6, 8, 10];
export const MAX_SONGS_PER_PLAYER = 10;
