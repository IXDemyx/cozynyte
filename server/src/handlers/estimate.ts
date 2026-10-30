/** Schätzfragen: Tipp abgeben. */

import { submitGuess } from "../games/estimate";
import { broadcast } from "../view";
import type { Handlers } from "./context";

export function registerEstimateHandlers({ socket, ctx }: Handlers) {
  // Ein Tipp pro Frage – mehr nimmt der Server nicht an, ein eigenes Limit braucht es nicht.
  socket.on("estimate:guess", (data) => {
    const c = ctx();
    if (c?.room.game === "estimate" && submitGuess(c.room, c.player, data?.qid, data?.value)) {
      broadcast(c.room);
    }
  });
}
