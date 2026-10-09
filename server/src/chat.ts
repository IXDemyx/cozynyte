/** Raum-Chat: Nachrichten speichern und Interessierte (z. B. Testbots) benachrichtigen. */

import { CHAT_HISTORY } from "./config";
import { nextFeedId, type Player, type Room } from "./state";

/** Wird nach jeder neuen Nachricht aufgerufen. */
export const chatListeners: ((room: Room, author: Player) => void)[] = [];

export function addChatMessage(room: Room, author: Player, text: string) {
  room.chat.push({ id: nextFeedId(), playerId: author.id, name: author.name, text });
  if (room.chat.length > CHAT_HISTORY) room.chat.splice(0, room.chat.length - CHAT_HISTORY);
  for (const listener of chatListeners) listener(room, author);
}
