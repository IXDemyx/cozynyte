/** Wiederverwendete Klassen, damit Karten und Felder überall gleich aussehen. */
export const card =
  "rounded-2xl border border-slate-200 bg-(--surface) shadow-sm dark:border-white/9 dark:bg-(--bg-secondary) dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_40px_-18px_rgba(0,0,0,0.9)]";

/** Spielkarten auf der Startseite: kräftige Kante mit hartem, orangem Schatten. */
export const gameCard =
  "rounded-2xl border-2 border-slate-200 bg-(--surface) shadow-[5px_5px_0_var(--card-pop)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--card-pop)] dark:border-[#2b2b2e] dark:bg-(--bg-secondary)";

export const input =
  "w-full rounded-lg border border-slate-300 bg-(--bg-primary) px-4 py-3 text-sm text-(--text-primary) outline-none transition placeholder:text-slate-400 focus:border-(--accent) focus:ring-2 focus:ring-(--accent-border) dark:border-white/10 dark:bg-black/30";

/** Kleine Überschrift ohne Farbe – für eigene Farben (z. B. die Bereiche der Startseite). */
export const eyebrowBase = "font-mono text-xs font-semibold uppercase tracking-widest";
export const eyebrow = `${eyebrowBase} text-(--accent)`;
