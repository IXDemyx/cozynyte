import type { FeedItem } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";

/** Tanzende Balken, solange ein Song läuft. */
export function Equalizer() {
  return (
    <div className="flex h-16 items-end justify-center gap-1.5" aria-hidden="true">
      {[0, 0.3, 0.15, 0.45, 0.1, 0.35, 0.2].map((delay, i) => (
        <span
          key={i}
          className="eq-bar h-full w-2 rounded-full bg-(--accent)"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

/** Eine Zeile im Verlauf: Chatnachricht, falscher Tipp oder Erfolgsmeldung. */
export function FeedLine({ item, you }: { item: FeedItem; you: string }) {
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
