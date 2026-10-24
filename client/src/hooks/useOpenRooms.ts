import { useEffect, useState } from "react";
import type { Ack, OpenRooms } from "../../../shared/types";
import { socket } from "../lib/socket";

/** Wie viele öffentliche Räume gerade Mitspieler suchen – regelmäßig nachfragen. */
export function useOpenRooms(): OpenRooms | null {
  const [open, setOpen] = useState<OpenRooms | null>(null);

  useEffect(() => {
    const load = () =>
      socket.timeout(5000).emit("rooms:open", (failure: Error | null, res: Ack<OpenRooms>) => {
        if (!failure && res.ok) setOpen({ total: res.total, byGame: res.byGame });
      });
    load();
    const timer = setInterval(load, 15_000);
    socket.on("connect", load);
    return () => {
      clearInterval(timer);
      socket.off("connect", load);
    };
  }, []);

  return open;
}
