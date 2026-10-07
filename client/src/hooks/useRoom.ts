import { useEffect, useState } from "react";
import type { Ack, RoomState } from "../../../shared/types";
import { playerId, socket } from "../lib/socket";

/** Tritt dem Raum bei (auch nach Verbindungsabbruch erneut) und liefert den aktuellen Stand. */
export function useRoom(code: string, name: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!name) return;

    const join = () => {
      socket.emit("room:join", { code, name, playerId }, (res: Ack) => {
        setError(res.ok ? "" : res.error);
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
