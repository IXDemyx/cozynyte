import { useEffect, useState } from "react";

/** Lautstärke (0–1), gemeinsam für Vorhören und Spielrunde, im Browser gespeichert. */
export function useVolume() {
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem("volume"));
    return saved > 0 && saved <= 1 ? saved : 0.6;
  });

  useEffect(() => {
    localStorage.setItem("volume", String(volume));
  }, [volume]);

  return [volume, setVolume] as const;
}
