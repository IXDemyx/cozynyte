import { useMemo, type CSSProperties } from "react";
import { FaCrown } from "react-icons/fa";
import type { PlayerView } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";

/** Platz nach Punkten – bei Gleichstand teilen sich Spieler den Platz (1, 1, 3, …). */
export function places(ranking: PlayerView[]): number[] {
  return ranking.map((p) => ranking.findIndex((q) => q.score === p.score) + 1);
}

/** Höhe und Farbe der Treppenstufe je Platz. */
const STEPS: Record<number, string> = {
  1: "h-32 sm:h-36 bg-(--accent) text-slate-950",
  2: "h-24 sm:h-28 bg-(--accent-soft) text-(--accent) border border-(--accent-border)",
  3: "h-16 sm:h-20 bg-(--accent-soft) text-(--accent) border border-(--accent-border)",
};

/** Reihenfolge auf dem Treppchen: Zweiter links, Erster in der Mitte, Dritter rechts. */
const ORDER = [1, 0, 2];

/** Treppchen für die besten drei – die Stufen fahren nacheinander hoch (Dritter zuerst). */
function Podium({ ranking, you }: { ranking: PlayerView[]; you: string }) {
  const { t } = useLanguage();
  const place = places(ranking);
  const top = ORDER.filter((i) => i < ranking.length);

  return (
    <div className="mt-8">
      <ol className="relative flex items-end justify-center gap-2 sm:gap-4">
        {top.map((i) => {
          const p = ranking[i];
          const step = Math.min(place[i], 3);
          // Erst die 3, dann die 2, zuletzt der Sieger.
          const delay = (2 - i) * 0.35;
          return (
            <li key={p.id} className="flex w-1/3 max-w-40 flex-col items-center">
              <div
                className="animate-podium-name flex w-full flex-col items-center text-center"
                style={{ animationDelay: `${delay + 0.35}s` }}
              >
                {step === 1 && (
                  <FaCrown className="mb-1 text-2xl text-(--accent)" aria-hidden="true" />
                )}
                <span className="w-full truncate font-bold">{p.name}</span>
                {p.id === you && <span className="text-xs text-(--text-secondary)">{t.you}</span>}
                <span className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-(--text-secondary)">
                  {p.score}
                </span>
              </div>
              <div
                className={`animate-podium mt-2 flex w-full items-start justify-center rounded-t-xl pt-3 font-mono text-3xl font-extrabold ${STEPS[step]}`}
                style={{ animationDelay: `${delay}s` }}
              >
                {place[i]}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const COLORS = ["var(--accent)", "#fbbf24", "#f8fafc", "#fb7185", "#38bdf8"];

/**
 * Einmaliger Konfettiregen über die ganze Karte (bei reduzierter Bewegung aus). Die Karte braucht
 * `relative overflow-hidden`.
 */
export function Confetti({ delay = 0.9 }: { delay?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: delay + Math.random() * 1.2,
        duration: 1.8 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 80,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        color: COLORS[i % COLORS.length],
        wide: Math.random() > 0.5,
      })),
    [delay],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={`confetti absolute top-0 rounded-[1px] ${piece.wide ? "h-1.5 w-2.5" : "h-2.5 w-1.5"}`}
          style={
            {
              left: `${piece.left}%`,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--drift": `${piece.drift}px`,
              "--spin": `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default Podium;
