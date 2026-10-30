import type { FeedItem, Game } from "../../../../shared/types";
import { useLanguage } from "../../lib/i18n";

/** Ereignis einer Runde im Chat: erraten, knapp daneben, Jahr getippt, Karte gelegt. */
function FeedLine({ item, you, game }: { item: FeedItem; you: string; game?: Game }) {
  const { t } = useLanguage();
  const me = item.playerId === you;
  // Länder-Quiz: „hat es!“ bzw. „hat geantwortet“ statt Wort- und Jahr-Texten.
  if (game === "geo" && item.kind === "guessed") {
    return <span className="font-semibold text-(--success)">{t.geo.feedGot(item.name, me)}</span>;
  }
  if (item.kind === "joker") {
    return <span className="text-amber-500">{t.geo.feedJoker(item.name, me)}</span>;
  }
  if (game === "geo" && item.kind === "locked") {
    return <span className="text-(--accent)">{t.geo.feedLocked(item.name, me)}</span>;
  }
  if (game === "estimate" && item.kind === "locked") {
    return <span className="text-(--accent)">{t.estimate.feedLocked(item.name, me)}</span>;
  }
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
