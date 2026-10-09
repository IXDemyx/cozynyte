/** Einstiegspunkt: Socket-Handler registrieren, verlassene Räume aufräumen, Server starten. */

import { DEV_TOOLS, PORT, ROOM_TTL_MS } from "./config";
import { enableBots } from "./dev/bots";
import { registerChatHandlers } from "./handlers/chat";
import { createHandlers } from "./handlers/context";
import { registerDevHandlers } from "./handlers/dev";
import { registerKniffelHandlers } from "./handlers/kniffel";
import { registerMusicHandlers } from "./handlers/music";
import { registerRoomHandlers } from "./handlers/room";
import { http, io } from "./server";
import { rooms } from "./state";

if (DEV_TOOLS) enableBots();

io.on("connection", (socket) => {
  const handlers = createHandlers(socket);
  registerRoomHandlers(handlers);
  registerMusicHandlers(handlers);
  registerKniffelHandlers(handlers);
  registerChatHandlers(handlers);
  if (DEV_TOOLS) registerDevHandlers(handlers);
});

// Verlassene Räume aufräumen.
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.emptySince && now - room.emptySince > ROOM_TTL_MS) {
      clearTimeout(room.round?.timer);
      room.round?.hintTimers.forEach(clearTimeout);
      clearTimeout(room.revealTimer);
      rooms.delete(room.code);
    }
  }
}, 60_000).unref();

http.listen(PORT, () => {
  console.log(`Games-Server läuft auf http://localhost:${PORT}`);
  if (DEV_TOOLS) console.log("Testmodus an: Der Host kann Testbots in den Raum holen.");
});
