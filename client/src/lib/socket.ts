import { io } from "socket.io-client";

/** Verbindet sich mit dem Server, der auch die Seite ausliefert (im Dev über den Vite-Proxy). */
export const socket = io({ autoConnect: true });

/** Pro Tab eine eigene ID – übersteht Neuladen, erlaubt aber Tests mit mehreren Tabs. */
function createPlayerId(): string {
  const saved = sessionStorage.getItem("playerId");
  if (saved) return saved;
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("playerId", id);
  return id;
}

export const playerId = createPlayerId();

export function getName(): string {
  return localStorage.getItem("playerName") ?? "";
}

export function saveName(name: string) {
  localStorage.setItem("playerName", name.trim());
}
