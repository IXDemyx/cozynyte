/**
 * Bausteine der Tagesrätsel (Song, Flagge und Umriss des Tages): Zeitzone des Tageswechsels,
 * Countdown, Archiv und Vergleich mit allen. Die Texte kommen vom jeweiligen Spiel.
 */

import { useEffect, useState } from "react";
import type { DayResult } from "../games/dailyStatus";

/** Zeitzone des Tageswechsels (Berlin) als Kürzel, je nach Jahreszeit: MEZ/MESZ bzw. CET/CEST. */
export function berlinZone(language: string): string {
  return (
    new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
      timeZone: "Europe/Berlin",
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ?? ""
  );
}

/** Zeit bis zum nächsten Tagesrätsel (h:mm:ss), danach ein Knopf zum Laden. */
export function Countdown({
  at,
  onReady,
  text,
}: {
  at: number;
  onReady: () => void;
  text: { nextDaily: string; dailyReady: string };
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, Math.ceil((at - now) / 1000));
  if (!left) {
    return (
      <button
        type="button"
        onClick={onReady}
        className="text-sm font-semibold text-(--accent) transition hover:text-(--accent-hover)"
      >
        {text.dailyReady}
      </button>
    );
  }
  const two = (n: number) => String(n).padStart(2, "0");
  const time = `${Math.floor(left / 3600)}:${two(Math.floor(left / 60) % 60)}:${two(left % 60)}`;
  return (
    <p className="text-sm text-(--text-secondary)">
      {text.nextDaily}{" "}
      <span className="font-mono font-bold tabular-nums text-(--text-primary)">{time}</span>
    </p>
  );
}

/**
 * Archiv: alle bisherigen Tage, neueste zuerst. Gespielte Tage zeigen das Ergebnis (Versuche
 * bzw. ✕), angefangene „…“, offene das Datum. `result`: Stand eines Tages (aus dayResults),
 * `dateOf`: Tag zu einer Nummer, `max`: Anzahl der Versuche.
 */
export function ArchiveList({
  today,
  current,
  max,
  dateOf,
  result,
  dayLabel,
  onPick,
  text,
}: {
  today: number;
  current: number;
  max: number;
  dateOf: (number: number) => string;
  result: (date: string) => DayResult;
  dayLabel: (date: string) => string;
  onPick: (number: number) => void;
  text: { archiveHint: string; todayShort: string };
}) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-white/10">
      <p className="text-xs text-(--text-secondary)">{text.archiveHint}</p>
      <ol className="mt-2 grid max-h-56 grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-1.5 overflow-y-auto">
        {Array.from({ length: today }, (_, i) => today - i).map((number) => {
          const date = dateOf(number);
          const { state, tries } = result(date);
          return (
            <li key={number}>
              <button
                type="button"
                aria-current={number === current || undefined}
                onClick={() => onPick(number)}
                className={`flex w-full flex-col items-center rounded-lg border px-1 py-1.5 transition hover:border-(--accent) ${
                  number === current
                    ? "border-(--accent) bg-(--accent-soft)"
                    : "border-transparent bg-slate-100 dark:bg-white/5"
                }`}
              >
                <span className="font-mono text-xs font-bold">#{number}</span>
                <span
                  className={`text-[11px] ${
                    state === "won"
                      ? "font-bold text-(--success)"
                      : state === "lost"
                        ? "font-bold text-red-600 dark:text-red-400"
                        : "text-(--text-secondary)"
                  }`}
                >
                  {state === "won"
                    ? `${tries}/${max}`
                    : state === "lost"
                      ? "✕"
                      : state === "open"
                        ? "…"
                        : number === today
                          ? text.todayShort
                          : dayLabel(date)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Wie alle an dem Tag abgeschnitten haben – Anteil je Versuch, der eigene markiert.
 * `mine`: eigener Versuch (Anzahl der Versuche = nicht erraten). `alone`: das eigene Ergebnis
 * ist mitgezählt (heute), ein einzelnes Ergebnis ist dann das eigene. `label`: Beschriftung
 * eines Versuchs, `same`: Satz zum Anteil derer, die es wie man selbst erraten haben.
 */
export function GlobalResult({
  global,
  mine,
  alone,
  label,
  same,
  text,
}: {
  global: { byStage: number[]; lost: number };
  mine: number;
  alone: boolean;
  label: (stage: number) => string;
  same: (pct: number) => string;
  text: {
    globalEmpty: string;
    globalLost: (pct: number) => string;
    globalTitle: (n: number) => string;
  };
}) {
  const stages = global.byStage.length;
  const values = [...global.byStage, global.lost];
  const played = values.reduce((sum, n) => sum + n, 0);
  const pct = (n: number) => (played ? Math.round((n / played) * 100) : 0);
  const top = Math.max(1, ...values);
  const note =
    played <= (alone ? 1 : 0)
      ? text.globalEmpty
      : mine < stages
        ? same(pct(values[mine]))
        : text.globalLost(pct(values[mine]));
  return (
    <div className="order-2 rounded-lg bg-slate-100 px-3 py-2.5 lg:order-none dark:bg-white/5">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-semibold">{note}</span>
        <span className="text-xs text-(--text-secondary)">{text.globalTitle(played)}</span>
      </p>
      {played > 0 && (
        <div
          className="mt-2 grid gap-1 text-center font-mono text-[10px] tabular-nums text-(--text-secondary)"
          style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
        >
          {values.map((value, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className={i === mine ? "font-bold text-(--accent)" : ""}>{pct(value)} %</span>
              <div className="flex h-10 w-full items-end">
                <div
                  className={`w-full rounded-sm ${i === mine ? "bg-(--accent)" : "bg-slate-300 dark:bg-white/15"}`}
                  style={{ height: `${Math.max(4, (value / top) * 100)}%` }}
                />
              </div>
              <span className={i === mine ? "font-bold text-(--accent)" : ""}>
                {i < stages ? label(i) : "✕"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
