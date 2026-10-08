import { useEffect, useRef, useState, type FormEvent } from "react";
import type { FeedItem } from "../../../../shared/types";
import Button from "../../components/Button";
import { input } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

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

interface ChatFeedProps {
  feed: FeedItem[];
  you: string;
  /** Höhe des Verlaufs, z. B. "h-40". */
  height: string;
  /** Text, solange noch nichts im Verlauf steht. */
  empty?: string;
}

/** Verlauf einer Runde; scrollt bei neuen Einträgen automatisch nach unten. */
export function ChatFeed({ feed, you, height, empty }: ChatFeedProps) {
  const end = useRef<HTMLLIElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [feed.length]);

  return (
    <ul
      className={`mt-6 ${height} space-y-1.5 overflow-y-auto rounded-xl bg-(--bg-primary) p-4 text-sm dark:bg-black/30`}
      aria-live="polite"
    >
      {feed.length === 0 && empty && <li className="text-(--text-secondary)">{empty}</li>}
      {feed.map((item) => (
        <li key={item.id}>
          <FeedLine item={item} you={you} />
        </li>
      ))}
      <li ref={end} />
    </ul>
  );
}

/** Freies Chatfeld (Guess the Year, Song-Timeline). */
export function ChatInput() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    socket.emit("round:guess", { text: message });
    setMessage("");
  };

  return (
    <form onSubmit={send} className="mt-3 flex gap-2">
      <input
        aria-label={t.round.send}
        className={input}
        value={message}
        maxLength={80}
        autoComplete="off"
        placeholder={t.year.chat}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button type="submit" variant="secondary">
        {t.round.send}
      </Button>
    </form>
  );
}
