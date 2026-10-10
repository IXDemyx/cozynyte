/** Montagsmaler: Begriff wählen, zeichnen (Striche, Rückgängig), Zeichnung abholen, raten. */

import {
  addOps,
  chooseWord,
  drawingOf,
  handleDrawGuess,
  setWords,
  startWithWords,
  undoOp,
} from "../games/draw";
import { broadcast } from "../view";
import { allowChat } from "./chat";
import type { Handlers } from "./context";

export function registerDrawHandlers({ socket, ctx, reply }: Handlers) {
  // „Eigene Runde“: eigene Begriffe einreichen bzw. ändern.
  socket.on("draw:words", (data) => {
    const c = ctx();
    if (c && setWords(c.room, c.player, data?.words)) broadcast(c.room);
  });

  // Host startet das Spiel mit den gesammelten Begriffen.
  socket.on("draw:begin", (cb) => {
    const c = ctx();
    if (!c || !c.isHost || c.room.game !== "draw") return;
    const result = startWithWords(c.room);
    if (result !== "ok") return reply(cb, { ok: false, error: result });
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("draw:choose", (data) => {
    const c = ctx();
    if (c?.room.game === "draw" && chooseWord(c.room, c.player, Number(data?.index))) {
      broadcast(c.room);
    }
  });

  // Striche kommen in kleinen Paketen; sie gehen direkt an die anderen, ohne den ganzen Raum-Stand.
  socket.on("draw:ops", (data) => {
    const c = ctx();
    if (c?.room.game === "draw") addOps(c.room, c.player, data?.turn, data?.ops);
  });

  socket.on("draw:undo", () => {
    const c = ctx();
    if (c?.room.game === "draw") undoOp(c.room, c.player);
  });

  // Nach dem Neuladen oder Beitreten: die bisherige Zeichnung des Zugs.
  socket.on("draw:sync", (cb) => {
    const c = ctx();
    const drawing = c?.room.game === "draw" ? drawingOf(c.room) : null;
    if (drawing) reply(cb, { ok: true, ...drawing });
    else reply(cb, { ok: false, error: "no_drawing" });
  });

  socket.on("draw:guess", (data, cb) => {
    const c = ctx();
    if (!c || c.room.game !== "draw") return;
    if (!allowChat(c.player)) return reply(cb, { ok: false, error: "chat_rate_limited" });
    handleDrawGuess(c.room, c.player, data?.text);
    reply(cb, { ok: true });
  });
}
