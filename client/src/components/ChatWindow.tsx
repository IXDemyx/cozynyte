import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import type { Ack, RoomState } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";
import Button from "./Button";
import ErrorText from "./ErrorText";
import { card, eyebrow, input } from "./ui";

/**
 * Schwebendes Chatfenster unten rechts für alle Bildschirme außerhalb der Raterunden.
 * Geschlossen zeigt der Knopf, wie viele Nachrichten anderer noch ungelesen sind.
 */
function ChatWindow({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const latest = state.chat.at(-1)?.id ?? 0;
  // Was beim Betreten schon im Chat stand, gilt als gelesen.
  const [seen, setSeen] = useState(latest);
  const end = useRef<HTMLLIElement>(null);
  const field = useRef<HTMLInputElement>(null);

  const unread = state.chat.filter((m) => m.id > seen && m.playerId !== state.you).length;

  useEffect(() => {
    if (open) setSeen(latest);
  }, [open, latest]);

  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: "nearest" });
  }, [open, state.chat.length]);

  useEffect(() => {
    if (!open) return;
    field.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    socket.emit("chat:send", { text: message }, (res: Ack) => setError(res.ok ? "" : res.error));
    setMessage("");
  };

  if (!open) {
    return (
      <button
        type="button"
        aria-label={unread ? `${t.chat.open} – ${t.chat.unread(unread)}` : t.chat.open}
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-(--accent) text-2xl text-slate-950 shadow-lg transition hover:bg-(--accent-hover)"
      >
        <FiMessageCircle aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 font-mono text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <section
      aria-label={t.chat.title}
      className={`${card} animate-in fixed inset-x-0 bottom-0 z-30 rounded-b-none p-4 shadow-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-80 sm:rounded-b-2xl`}
    >
      <div className="flex items-center justify-between">
        <h2 className={eyebrow}>{t.chat.title}</h2>
        <button
          type="button"
          aria-label={t.chat.close}
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--text-primary)"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>

      <ul
        aria-live="polite"
        className="mt-3 h-64 space-y-1.5 overflow-y-auto rounded-xl bg-(--bg-primary) p-3 text-sm dark:bg-black/30"
      >
        {state.chat.length === 0 && <li className="text-(--text-secondary)">{t.chat.empty}</li>}
        {state.chat.map((m) => (
          <li key={m.id} className="break-words">
            <span className={`font-semibold ${m.playerId === state.you ? "text-(--accent)" : ""}`}>
              {m.name}:
            </span>{" "}
            <span className="text-(--text-secondary)">{m.text}</span>
          </li>
        ))}
        <li ref={end} />
      </ul>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          ref={field}
          aria-label={t.chat.placeholder}
          className={`${input} py-2.5`}
          value={message}
          maxLength={200}
          autoComplete="off"
          placeholder={t.chat.placeholder}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          type="submit"
          size="small"
          disabled={!message.trim()}
          aria-label={t.round.send}
          title={t.round.send}
        >
          <FiSend aria-hidden="true" />
        </Button>
      </form>
      <ErrorText code={error} className="mt-2" />
    </section>
  );
}

export default ChatWindow;
