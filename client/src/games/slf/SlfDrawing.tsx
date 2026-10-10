import { useEffect } from "react";
import type { RoomState, SlfView } from "../../../../shared/types";
import { ALPHABET } from "../../../../shared/slf";
import Button from "../../components/Button";
import { card, eyebrow } from "../../components/ui";
import VolumeControl from "../../components/VolumeControl";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";
import { slfSound } from "./sounds";

type Drawing = NonNullable<SlfView["drawing"]>;

/**
 * Buchstabe aufsagen wie am Tisch: Einer geht im Kopf das Alphabet durch (tippt pro Buchstabe),
 * ein anderer sagt Stopp. Den aktuellen Buchstaben sieht nur, wer zählt – die anderen sehen
 * nicht einmal das Tempo.
 */
function SlfDrawing({ state, slf, drawing }: { state: RoomState; slf: SlfView; drawing: Drawing }) {
  const { t } = useLanguage();
  const reciter = state.players.find((p) => p.id === drawing.reciterId);
  const stopper = state.players.find((p) => p.id === drawing.stopperId);
  const counting = drawing.reciterId === state.you;
  const stopping = drawing.stopperId === state.you;

  const tap = () => socket.emit("slf:tap");
  const stop = () => socket.emit("slf:drawStop");

  // Klick pro Buchstabe, mit jedem einen Halbton höher – hört nur, wer zählt.
  useEffect(() => {
    if (counting && drawing.current) slfSound("tick", ALPHABET.indexOf(drawing.current));
  }, [counting, drawing.current]);

  // Leertaste bzw. Enter: weiterzählen oder Stopp sagen – ohne die Maus zu suchen.
  useEffect(() => {
    if (!counting && !stopping) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== " " && event.key !== "Enter")) return;
      if (event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      if (counting) tap();
      else stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [counting, stopping]);

  return (
    <section className={`${card} animate-in flex min-w-0 flex-col p-7 xl:flex-1`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className={eyebrow}>
          {t.slf.round(slf.round, slf.rounds)} · {t.slf.recite.title}
        </p>
        <VolumeControl />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-(--text-secondary)">
          {t.slf.letter}
        </p>
        <p className="mt-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-(--accent) font-mono text-6xl font-bold text-(--accent)">
          {/* Jeder neue Buchstabe springt federnd ins Feld. */}
          <span
            key={counting ? (drawing.current ?? "-") : "?"}
            className={counting ? "animate-letter inline-block" : ""}
          >
            {counting ? (drawing.current ?? "–") : "?"}
          </span>
        </p>

        {counting && (
          <>
            <p className="mt-8 max-w-sm text-sm">{t.slf.recite.you}</p>
            <p className="mt-1 text-sm text-(--text-secondary)">
              {t.slf.recite.stopperIs(stopper?.name ?? "")}
            </p>
            <Button className="mt-6 w-full sm:w-auto sm:min-w-56" onClick={tap}>
              {t.slf.recite.tap}
            </Button>
            <p className="mt-2 hidden text-xs text-(--text-secondary) [@media(hover:hover)]:block">
              {t.slf.recite.keyTap}
            </p>
          </>
        )}

        {stopping && (
          <>
            <p className="mt-8 text-xl font-bold">{t.slf.recite.stopperTitle}</p>
            <p className="mt-1 max-w-sm text-sm text-(--text-secondary)">
              {t.slf.recite.stopperHint(reciter?.name ?? "")}
            </p>
            <Button className="mt-6 w-full sm:w-auto sm:min-w-56" onClick={stop}>
              {t.slf.stop}
            </Button>
            <p className="mt-2 hidden text-xs text-(--text-secondary) [@media(hover:hover)]:block">
              {t.slf.recite.keyStop}
            </p>
          </>
        )}

        {!counting && !stopping && (
          <p className="mt-8 max-w-sm text-sm text-(--text-secondary)">
            {t.slf.recite.others(reciter?.name ?? "", stopper?.name ?? "")}
          </p>
        )}
      </div>
    </section>
  );
}

export default SlfDrawing;
