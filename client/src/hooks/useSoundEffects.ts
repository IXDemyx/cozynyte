import { useEffect, useState } from "react";

/** Soundeffekte an/aus, im Browser gespeichert (Standard: an). */
export function useSoundEffects() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("soundEffects") !== "off");

  useEffect(() => {
    localStorage.setItem("soundEffects", enabled ? "on" : "off");
  }, [enabled]);

  return [enabled, setEnabled] as const;
}
