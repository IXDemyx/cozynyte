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
  children: ReactNode;
}

/** Rahmen jeder Musikrunde: ablaufender Zeitbalken, Überschrift und Sekunden-Countdown. */
function RoundFrame({ title, endsAt, durationMs, offset, children }: RoundFrameProps) {
  const now = useNow(offset);
  const remaining = Math.max(0, endsAt - now);
  const fraction = Math.min(1, remaining / durationMs);

  return (
    <section className={`${card} flex min-w-0 flex-col overflow-hidden xl:flex-1`}>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-(--accent) transition-[width] duration-100 ease-linear"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className={eyebrow}>{title}</p>
          <div className="flex items-center gap-4">
            <VolumeControl />
            <p className="font-mono text-2xl font-semibold tabular-nums" aria-live="off">
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
