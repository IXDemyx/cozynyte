import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Ack, Game } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import { confirmRoom, playerId, rememberPlayerId, saveName, socket } from "../lib/socket";

/** Raum erstellen oder einem zufälligen öffentlichen Raum beitreten (Startseite, Spielseiten). */
export function useStartRoom(name: string) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const validName = name.trim().length > 0;

  const create = (game: Game, isPublic = false) => {
    if (!validName) return setError("name_required");
    saveName(name);
    setBusy(true);
    setError("");
    socket
      .timeout(6000)
      .emit(
        "room:create",
        { name: name.trim(), playerId, game, isPublic, language },
        (failure: Error | null, res: Ack<{ code: string }>) => {
          setBusy(false);
          if (failure) return setError("server_unreachable");
          if (!res.ok) return setError(res.error);
          confirmRoom(res.code);
          rememberPlayerId(res.code, playerId);
          navigate(`/r/${res.code}`);
        },
      );
  };

  // Zufälliger Raum: offenen öffentlichen Raum suchen (optional für ein Spiel). Gibt es keinen,
  // wird ein neuer öffentlicher Raum erstellt, in den andere dann zufällig dazukommen.
  const joinRandom = (game?: Game) => {
    if (!validName) return setError("name_required");
    saveName(name);
    setBusy(true);
    setError("");
    socket
      .timeout(6000)
      .emit(
        "room:random",
        { game, language },
        (failure: Error | null, res: Ack<{ code: string | null }>) => {
          if (failure) {
            setBusy(false);
            return setError("server_unreachable");
          }
          if (res.ok && res.code) {
            setBusy(false);
            confirmRoom(res.code);
            return navigate(`/r/${res.code}`);
          }
          create(game ?? "song", true);
        },
      );
  };

  return { create, joinRandom, busy, error, setError, validName };
}
