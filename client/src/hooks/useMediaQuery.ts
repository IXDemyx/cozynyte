import { useSyncExternalStore } from "react";

/** Trifft die Media-Query gerade zu? Aktualisiert sich beim Ändern der Fenstergröße. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
