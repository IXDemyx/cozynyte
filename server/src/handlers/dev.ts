/** Testmodus: Testbots hinzufügen, entfernen und schreiben lassen (nur Host). */

import { randomInt } from "node:crypto";
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

  // Kniffel: spannende Würfe gezielt auslösen, um Zeitlupe, Herzschlag und Feier zu testen.
  // Vier Würfel sind gehalten, der fünfte entscheidet – wie nach dem zweiten Wurf.
  socket.on("dev:kniffelRoll", (data) => {
    const c = ctx();
    const sheet = c?.room.kniffel;
    if (!c || !c.isHost || !sheet?.current) return;
    const face = 1 + randomInt(6);
    const other = 1 + ((face + randomInt(5)) % 6);
    let dice: number[];
    if (data?.scenario === "kniffelHit") dice = [face, face, face, face, face];
    else if (data?.scenario === "kniffelMiss") dice = [face, face, face, face, other];
    else {
      // Große Straße – mal klappt's, mal nicht.
      const low = 1 + randomInt(2);
      const run = [0, 1, 2, 3, 4].map((k) => low + k).sort(() => randomInt(3) - 1);
      const missing = run[4];
      const wrong = [1, 2, 3, 4, 5, 6].filter((f) => f !== missing)[randomInt(5)];
      dice = [...run.slice(0, 4), randomInt(2) ? missing : wrong];
    }
    // Erst leeren, damit die Würfelanimation den neuen Wurf als frisch erkennt.
    sheet.roll = null;
    broadcast(c.room);
    sheet.roll = { dice, held: [true, true, true, true, false], count: 2, shake: 0 };
    broadcast(c.room);
  });

  socket.on("dev:botSays", () => {
    const c = ctx();
    if (!c || !c.isHost) return;
    botSays(c.room);
    broadcast(c.room);
  });
}
