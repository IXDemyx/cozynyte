/** Raum-Chat: Nachrichten außerhalb der Raterunden (dort läuft der Chat über den Rundenverlauf). */

import { CHAT_HISTORY, CHAT_LIMIT, CHAT_MAX_LENGTH, CHAT_WINDOW_MS } from "../config";
import { nextFeedId, type Player } from "../state";
import { broadcast } from "../view";
import type { Handlers } from "./context";

/** Zählt eine Nachricht mit; false = zu viele in kurzer Zeit. */
function allowChat(player: Player): boolean {
  const now = Date.now();
  player.chats = player.chats.filter((at) => now - at < CHAT_WINDOW_MS);
  if (player.chats.length >= CHAT_LIMIT) return false;
  player.chats.push(now);
  return true;
}

export function registerChatHandlers({ socket, ctx, reply }: Handlers) {
  socket.on("chat:send", (data, cb) => {
    const c = ctx();
    const text = String(data?.text ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, CHAT_MAX_LENGTH);
    if (!c || !text) return;
    if (!allowChat(c.player)) return reply(cb, { ok: false, error: "chat_rate_limited" });

    const { chat } = c.room;
    chat.push({ id: nextFeedId(), playerId: c.player.id, name: c.player.name, text });
    if (chat.length > CHAT_HISTORY) chat.splice(0, chat.length - CHAT_HISTORY);
    reply(cb, { ok: true });
    broadcast(c.room);
  });
}
