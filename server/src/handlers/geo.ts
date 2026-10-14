/** Länder-Quiz: Antwort wählen bzw. tippen. */

import { chooseAnswer, typeAnswer, useJoker } from "../games/geo";
import { broadcast } from "../view";
import { allowChat } from "./chat";
import type { Handlers } from "./context";

export function registerGeoHandlers({ socket, ctx, reply }: Handlers) {
  socket.on("geo:choose", (data) => {
    const c = ctx();
    if (c?.room.game === "geo" && chooseAnswer(c.room, c.player, data?.qid, data?.code)) {
      broadcast(c.room);
    }
  });

  socket.on("geo:joker", (data) => {
    const c = ctx();
    if (c?.room.game === "geo" && useJoker(c.room, c.player, data?.qid)) broadcast(c.room);
  });

  // Getippte Antwort: Das Ergebnis geht nur an den Tippenden zurück (falsch/knapp/richtig).
  socket.on("geo:answer", (data, cb) => {
    const c = ctx();
    if (!c || c.room.game !== "geo") return;
    if (!allowChat(c.player)) return reply(cb, { ok: false, error: "chat_rate_limited" });
    const result = typeAnswer(c.room, c.player, data?.qid, data?.text);
    reply(cb, { ok: true, result });
    if (result !== "wrong" && result !== "invalid") broadcast(c.room);
  });
}
