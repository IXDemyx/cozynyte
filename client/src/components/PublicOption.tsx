import { PUBLIC_GAMES, type RoomState } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";
import { OptionGroup } from "./Option";

/**
 * Lobby-Einstellung: privat (nur mit Code/Link) oder öffentlich (auch über „Zufälliger Raum“).
 * Nur der Host kann umschalten; die anderen sehen, was eingestellt ist.
 */
function PublicOption({ state, isHost }: { state: RoomState; isHost: boolean }) {
  const { t } = useLanguage();
  if (!PUBLIC_GAMES.includes(state.game)) return null;
  const isPublic = state.settings.isPublic;

  return (
    <div className="sm:col-span-2">
      <OptionGroup
        label={t.lobby.visibility}
        value={isPublic}
        options={[
          { value: false, label: t.lobby.private },
          { value: true, label: t.lobby.public },
        ]}
        onChange={(value) => socket.emit("settings:update", { isPublic: value })}
        disabled={!isHost}
      />
      <p className="mt-1.5 text-xs text-(--text-secondary)">
        {isPublic ? t.lobby.publicHint : t.lobby.privateHint}
      </p>
    </div>
  );
}

export default PublicOption;
