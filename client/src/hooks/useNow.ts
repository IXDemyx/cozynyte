import { useEffect, useState } from "react";

/** Aktuelle Serverzeit, alle 100 ms aktualisiert. */
export function useNow(offset: number): number {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), 100);
    return () => clearInterval(id);
  }, [offset]);
  return now;
}
