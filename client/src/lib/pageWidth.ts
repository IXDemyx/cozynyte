import { createContext, useContext, useEffect } from "react";

/**
 * Seitenbreite: Montagsmaler braucht während der Runde mehr Platz für die Zeichenfläche als die
 * anderen Spiele. App stellt den Schalter bereit, das Spiel legt ihn um.
 */
export const ExtraWideContext = createContext<(on: boolean) => void>(() => {});

export function useExtraWide(on: boolean) {
  const set = useContext(ExtraWideContext);
  useEffect(() => {
    set(on);
    return () => set(false);
  }, [on, set]);
}
