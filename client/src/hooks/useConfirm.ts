import { useState } from "react";

/**
 * Zwei-Klick-Bestätigung für Aktionen, die sich nicht rückgängig machen lassen:
 * Der erste Klick „scharf schalten", der zweite innerhalb von `timeout` führt aus.
 */
export function useConfirm(timeout = 3000) {
  const [armed, setArmed] = useState<string | null>(null);

  /** true = bestätigt, Aktion ausführen; false = erst scharf geschaltet. */
  const confirm = (key: string): boolean => {
    if (armed === key) {
      setArmed(null);
      return true;
    }
    setArmed(key);
    setTimeout(() => setArmed((current) => (current === key ? null : current)), timeout);
    return false;
  };

  return { armed, confirm };
}
