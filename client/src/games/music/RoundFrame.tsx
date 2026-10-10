import type { ReactNode } from "react";
import { card, eyebrow } from "../../components/ui";
import VolumeControl from "../../components/VolumeControl";
import { useNow } from "../../hooks/useNow";

interface RoundFrameProps {
  /** Überschrift links oben, z. B. „Song 4 / 9". */
  title: ReactNode;
  endsAt: number;
  durationMs: number;
  /** Abstand zur Serverzeit (aus useRoom). */
  offset: number;
  /** Lautstärkeregler im Kopf zeigen (Spiele ohne Musik: aus). */
  volume?: boolean;
  /** Countdown rot hervorheben (z. B. nach „Stopp!"). */
  urgent?: boolean;
  children: ReactNode;
}

/** Rahmen jeder Musikrunde: ablaufender Zeitbalken, Überschrift und Sekunden-Countdown. */
function RoundFrame({
  title,
  endsAt,
  durationMs,
  offset,
  volume = true,
  urgent = false,
  children,
}: RoundFrameProps) {
  const now = useNow(offset);
  // Vor dem Start (z. B. Countdown bei Stadt Land Fluss) steht die Anzeige auf voller Zeit.
  const remaining = Math.min(durationMs, Math.max(0, endsAt - now));
  const fraction = Math.min(1, remaining / durationMs);

  return (
    <section className={`${card} flex min-w-0 flex-col overflow-hidden xl:flex-1`}>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full transition-[width] duration-100 ease-linear ${urgent ? "bg-red-500" : "bg-(--accent)"}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className={eyebrow}>{title}</p>
          <div className="flex items-center gap-4">
            {volume && <VolumeControl />}
            <p
              className={`font-mono text-2xl font-semibold tabular-nums ${urgent ? "text-red-500" : ""}`}
              aria-live="off"
            >
              {Math.ceil(remaining / 1000)}
              <span className="text-sm text-(--text-secondary)">s</span>
            </p>
          </div>
        </div>
        {/* Auf hohen Bildschirmen steht das Geschehen mittig statt oben in einer leeren Karte. */}
        <div className="flex flex-1 flex-col justify-center xl:pb-10">{children}</div>
      </div>
    </section>
  );
}

export default RoundFrame;
