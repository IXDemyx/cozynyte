import { useEffect, useState } from "react";
import type { Ack, RoomState } from "../../../shared/types";
import { playerIdFor, rememberPlayerId, socket } from "../lib/socket";

/** Tritt dem Raum bei (auch nach Verbindungsabbruch erneut) und liefert den aktuellen Stand. */
export function useRoom(code: string, name: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!name) return;

    const join = () => {
      // Geheimer Schlüssel dieses Browsers für den Raum. Der Server zeigt anderen nur eine
      // öffentliche ID – mit dem Schlüssel kann sich niemand sonst als wir anmelden.
      const key = playerIdFor(code);
      socket.emit("room:join", { code, name, playerId: key }, (res: Ack<{ playerId?: string }>) => {
        setError(res.ok ? "" : res.error);
        // Beigetreten (auch wenn der Server uns am Namen wiedererkannt hat): Schlüssel merken.
        if (res.ok) rememberPlayerId(code, key);
      });
    };
    const onState = (next: RoomState) => {
      if (next.code !== code) return;
      setOffset(next.serverNow - Date.now());
      setState(next);
    };

    const onKicked = (data: { code: string }) => {
      if (data.code !== code) return;
      setState(null);
      setError("kicked");
    };

    socket.on("room:state", onState);
    socket.on("room:kicked", onKicked);
    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      socket.off("room:state", onState);
      socket.off("room:kicked", onKicked);
      socket.off("connect", join);
      socket.emit("room:leave");
    };
  }, [code, name]);

  return { state, error, offset };
}
