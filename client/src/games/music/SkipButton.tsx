import { FiSkipForward } from "react-icons/fi";
import Button from "../../components/Button";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

/** Host-Werkzeug: laufenden Song überspringen. Für alle anderen unsichtbar. */
function SkipButton({ isHost }: { isHost: boolean }) {
  const { t } = useLanguage();
  if (!isHost) return null;
  return (
    <div className="mt-4 flex justify-end">
      <Button size="small" variant="secondary" onClick={() => socket.emit("round:skip")}>
        <FiSkipForward aria-hidden="true" /> {t.round.skip}
      </Button>
    </div>
  );
}

export default SkipButton;
