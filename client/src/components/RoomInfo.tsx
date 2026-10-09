import type { RoomState } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import InviteButton from "./InviteButton";
import { card, eyebrow } from "./ui";

/** Raumcode und Einladungslink oben in der linken Leiste (nur auf breiten Bildschirmen). */
function RoomInfo({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  return (
    <section className={`${card} p-5`}>
      <p className={eyebrow}>{t.games[state.game]}</p>
      <p className="mt-3 text-xs text-(--text-secondary)">{t.home.code}</p>
      <p className="font-mono text-4xl font-semibold tracking-[0.25em] text-(--accent)">
        {state.code}
      </p>
      <InviteButton code={state.code} short className="mt-4 w-full" />
    </section>
  );
}

export default RoomInfo;
