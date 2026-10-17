import { io } from "socket.io-client";

/** Verbindet sich mit dem Server, der auch die Seite ausliefert (im Dev über den Vite-Proxy). */
export const socket = io({ autoConnect: true });

/**
 * Pro Tab ein eigener geheimer Schlüssel – übersteht Neuladen, erlaubt aber Tests mit mehreren
 * Tabs. Er geht nur beim Beitreten an den Server; im Raum sehen die anderen eine öffentliche ID.
 */
function createPlayerId(): string {
  const saved = sessionStorage.getItem("playerId");
  if (saved) return saved;
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("playerId", id);
  return id;
}

export const playerId = createPlayerId();

/**
 * Wer man in welchem Raum ist – dauerhaft im Browser gespeichert, nicht nur pro Tab. Wirft das
 * Handy den Tab im Hintergrund weg oder öffnet man den Link neu (z. B. aus WhatsApp), kommt man so
 * als derselbe Spieler zurück statt als neuer. Einträge verfallen nach zwei Tagen.
 * Im Entwicklungsmodus nicht: Da sollen mehrere Tabs mehrere Spieler sein dürfen.
 */
const ROOM_IDS_KEY = "roomPlayerIds";
const ROOM_ID_TTL_MS = 2 * 24 * 60 * 60 * 1000;

function readRoomIds(): Record<string, { id: string; at: number }> {
  try {
    const map: unknown = JSON.parse(localStorage.getItem(ROOM_IDS_KEY) ?? "{}");
    return map && typeof map === "object"
      ? (map as Record<string, { id: string; at: number }>)
      : {};
  } catch {
    return {};
  }
}

/** Diese ID für den Raum merken (z. B. nachdem der Server einen bekannt hat). */
export function rememberPlayerId(code: string, id: string) {
  if (import.meta.env?.DEV) return;
  try {
    const now = Date.now();
    const map = Object.fromEntries(
      Object.entries(readRoomIds()).filter(([, entry]) => now - entry.at < ROOM_ID_TTL_MS),
    );
    map[code.toUpperCase()] = { id, at: now };
    localStorage.setItem(ROOM_IDS_KEY, JSON.stringify(map));
  } catch {
    // Ohne Speicher gilt eben nur die ID dieses Tabs.
  }
}

/** Spieler-ID für einen Raum: die dort schon bekannte, sonst die dieses Tabs. */
export function playerIdFor(code: string): string {
  if (import.meta.env?.DEV) return playerId;
  const entry = readRoomIds()[code.toUpperCase()];
  return entry && Date.now() - entry.at < ROOM_ID_TTL_MS && typeof entry.id === "string"
    ? entry.id
    : playerId;
}

// Zurück in den Tab (Handy): Verbindung sofort wieder aufbauen, nicht erst nach der Wartezeit.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !socket.connected) socket.connect();
  });
}

export function getName(): string {
  return localStorage.getItem("playerName") ?? "";
}

export function saveName(name: string) {
  localStorage.setItem("playerName", name.trim());
}

/**
 * Räume, für die in diesem Tab der Name schon bestätigt wurde – über die Startseite oder das
 * Namensfeld im Raum. Wer einen Einladungslink direkt öffnet, wird erst nach dem Namen gefragt
 * (vorausgefüllt mit dem gespeicherten), statt stumm unter dem alten Namen beizutreten.
 * Neuladen im selben Tab fragt nicht noch einmal.
 */
const CONFIRMED_KEY = "confirmedRooms";

function confirmedRooms(): string[] {
  try {
    const list: unknown = JSON.parse(sessionStorage.getItem(CONFIRMED_KEY) ?? "[]");
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}

export function confirmRoom(code: string) {
  try {
    const list = [...new Set([...confirmedRooms(), code.toUpperCase()])].slice(-20);
    sessionStorage.setItem(CONFIRMED_KEY, JSON.stringify(list));
  } catch {
    // Ohne Speicher wird beim Neuladen eben noch einmal nach dem Namen gefragt.
  }
}

export function isRoomConfirmed(code: string): boolean {
  return confirmedRooms().includes(code.toUpperCase());
}
