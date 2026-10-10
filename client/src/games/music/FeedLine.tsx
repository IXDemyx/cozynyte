import type { FeedItem } from "../../../../shared/types";
import { useLanguage } from "../../lib/i18n";

/** Ereignis einer Runde im Chat: erraten, knapp daneben, Jahr getippt, Karte gelegt. */
function FeedLine({ item, you }: { item: FeedItem; you: string }) {
  const { t } = useLanguage();
  const me = item.playerId === you;
  switch (item.kind) {
    case "title":
      return (
        <span className="font-semibold text-(--success)">{t.round.gotTitle(item.name, me)}</span>
      );
    case "artist":
      return (
        <span className="font-semibold text-(--success)">{t.round.gotArtist(item.name, me)}</span>
      );
    case "guessed":
      return (
        <span className="font-semibold text-(--success)">{t.draw.guessed(item.name, me)}</span>
      );
    case "close":
      return <span className="text-(--accent)">{t.round.close(item.name, me)}</span>;
    case "placed":
      return <span className="text-(--success)">{t.timeline.placedFeed(item.name, me)}</span>;
    case "locked":
      return <span className="text-(--success)">{t.year.locked(item.name, me)}</span>;
    default:
      return (
        <>
          <span className="font-semibold">{item.name}:</span>{" "}
          <span className="text-(--text-secondary)">{item.text}</span>
        </>
      );
  }
}

export default FeedLine;
