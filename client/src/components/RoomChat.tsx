import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Ack, ChatMessage, FeedItem, RoomState } from "../../../shared/types";
import FeedLine from "../games/music/FeedLine";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";
import ErrorText from "./ErrorText";
import { card, eyebrow, input } from "./ui";

type Entry = { id: number } & ({ message: ChatMessage } | { event: FeedItem });

/**
 * Chat rechts neben dem Spiel – auf jedem Raum-Bildschirm. Während einer Musikrunde wird hier
 * auch geraten: Ereignisse der Runde (erraten, knapp daneben, …) erscheinen zwischen den
 * Nachrichten, Tipps und Nachrichten laufen über den Server-Filter gegen Spoiler.
 */
function RoomChat({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const round = state.phase === "round" ? state.round : undefined;
  const list = useRef<HTMLUListElement>(null);

  // Chatnachrichten und Rundenereignisse zeitlich gemischt (beide IDs zählen gemeinsam hoch).
  // Freie Texte aus der Runde stehen schon im Chat, deshalb nur die Ereignisse.
  const entries: Entry[] = [
    ...state.chat.map((message) => ({ id: message.id, message })),
    ...(round?.feed ?? [])
      .filter((e) => e.kind !== "wrong")
      .map((event) => ({ id: event.id, event })),
  ].sort((a, b) => a.id - b.id);

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <section
      aria-label={t.chat.title}
      className={`${card} flex flex-col p-5 xl:sticky xl:top-24 xl:h-[calc(100dvh-8rem)] xl:min-h-[28rem]`}
    >
      <h2 className={eyebrow}>{t.chat.title}</h2>
      <ul
        ref={list}
        aria-live="polite"
        className="mt-3 h-64 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm xl:h-auto xl:min-h-0 xl:flex-1 dark:bg-black/30"
      >
        {entries.length === 0 && <li className="text-(--text-secondary)">{t.chat.empty}</li>}
        {entries.map((entry) => (
          <li key={entry.id} className="break-words">
            {"event" in entry ? (
              <FeedLine item={entry.event} you={state.you} />
            ) : (
              <>
                <span
                  className={`font-semibold ${entry.message.playerId === state.you ? "text-(--accent)" : ""}`}
                >
                  {entry.message.name}:
                </span>{" "}
                <span className="text-(--text-secondary)">{entry.message.text}</span>
              </>
            )}
          </li>
        ))}
      </ul>
      <ChatForm state={state} />
    </section>
  );
}

/** Eingabe: in Guess the Song das Ratefeld, sonst Chat. */
function ChatForm({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const round = state.phase === "round" ? state.round : undefined;

  // Guess the Song: solange noch etwas zu erraten ist, ist das Feld zum Raten da.
  const me = state.players.find((p) => p.id === state.you);
  const guessing =
    state.game === "song" && round && !round.youArePicker && !(me?.gotTitle && me?.gotArtist);
  const placeholder = !round
    ? t.chat.placeholder
    : state.game !== "song"
      ? t.chat.placeholder
      : round.youArePicker
        ? t.round.placeholderPicker
        : guessing
          ? t.round.placeholderGuess
          : t.round.placeholderChat;

  // Neue Runde: am großen Bildschirm direkt ins Ratefeld. Am Handy nicht – das Feld steht dort
  // unter dem Spiel, die Seite würde springen und die Tastatur alles verdecken.
  useEffect(() => {
    if (guessing && window.matchMedia("(min-width: 1024px)").matches) {
      field.current?.focus({ preventScroll: true });
    }
  }, [guessing, round?.index]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    // In Runden filtert der Server Lösungen heraus; außerhalb gilt das Chat-Limit.
    if (round) socket.emit("round:guess", { text: message });
    else
      socket.emit("chat:send", { text: message }, (res: Ack) => setError(res.ok ? "" : res.error));
    setMessage("");
  };

  return (
    <>
      {/* Abschicken mit Enter (am Handy mit der Senden-Taste der Tastatur) – ohne extra Knopf. */}
      <form onSubmit={send} className="mt-3">
        <input
          ref={field}
          aria-label={guessing ? t.round.input : t.chat.placeholder}
          className={`${input} py-2.5 ${guessing ? "border-(--accent)" : ""}`}
          value={message}
          maxLength={round ? 80 : 200}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={placeholder}
          onChange={(e) => setMessage(e.target.value)}
        />
      </form>
      <ErrorText code={error} className="mt-2" />
    </>
  );
}

export default RoomChat;
