/** Stadt Land Fluss: Antworten mitschicken, „Stopp!", Abstimmung und weiter zur nächsten Runde. */

import { callStop, nextSlfRound, saveAnswers, toggleVote } from "../games/slf";
import { broadcast } from "../view";
import type { Handlers } from "./context";

export function registerSlfHandlers({ socket, ctx, reply }: Handlers) {
  // Zwischenstand beim Tippen – nur der eigene Füllstand ändert sich für die anderen.
  socket.on("slf:answers", (data) => {
    const c = ctx();
    if (c?.room.game === "slf" && saveAnswers(c.room, c.player, data?.answers)) broadcast(c.room);
  });

  socket.on("slf:stop", (data, cb) => {
    const c = ctx();
    if (!c || c.room.game !== "slf") return;
    if (!callStop(c.room, c.player, data?.answers))
      return reply(cb, { ok: false, error: "slf_incomplete" });
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("slf:vote", (data) => {
    const c = ctx();
    if (!c || c.room.game !== "slf") return;
    if (toggleVote(c.room, c.player, String(data?.playerId ?? ""), Number(data?.category))) {
      broadcast(c.room);
    }
  });

  socket.on("slf:next", () => {
    const c = ctx();
    if (c?.isHost && c.room.game === "slf") nextSlfRound(c.room);
  });
}
