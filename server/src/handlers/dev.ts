/** Testmodus: Testbots hinzufügen, entfernen und schreiben lassen (nur Host). */

import { addBot, botSays, removeBots } from "../dev/bots";
import { broadcast } from "../view";
import type { Handlers } from "./context";

export function registerDevHandlers({ socket, ctx, reply }: Handlers) {
  socket.on("dev:addBot", (cb) => {
    const c = ctx();
    if (!c || !c.isHost) return;
    if (!addBot(c.room)) return reply(cb, { ok: false, error: "room_full" });
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("dev:removeBots", () => {
    const c = ctx();
    if (!c || !c.isHost) return;
    removeBots(c.room);
    broadcast(c.room);
  });

  socket.on("dev:botSays", () => {
    const c = ctx();
    if (!c || !c.isHost) return;
    botSays(c.room);
    broadcast(c.room);
  });
}
