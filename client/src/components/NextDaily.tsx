import { useState } from "react";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { LuAudioWaveform, LuFlag, LuMap } from "react-icons/lu";
import { Link } from "react-router-dom";
import { DAILY_IDS, dailyStatus, prepareDaily, type DailyId } from "../games/dailyStatus";
import { useLanguage } from "../lib/i18n";
import { GAME_PATH } from "../lib/seo";

const ICONS = { snippet: LuAudioWaveform, flag: LuFlag, outline: LuMap };

/**
 * Nach einem fertigen Tagesrätsel: das nächste, das heute noch offen ist – oder ein Hinweis, dass
 * alle geschafft sind. Wird erst nach der Runde gezeigt, liest den Stand dann einmal.
 */
function NextDaily({ current }: { current: DailyId }) {
  const { t, language } = useLanguage();
  const [next] = useState(() => {
    const at = DAILY_IDS.indexOf(current);
    const others = [...DAILY_IDS.slice(at + 1), ...DAILY_IDS.slice(0, at)];
    return others.find((id) => {
      const { state } = dailyStatus(id);
      return state === "new" || state === "open";
    });
  });
  if (!next) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-(--accent-soft) px-3 py-2.5 text-sm">
        <FiCheck aria-hidden="true" className="shrink-0 text-(--success)" />
        {t.home.allChallengesDone}
      </p>
    );
  }
  const Icon = ICONS[next];
  const texts: Record<DailyId, string> = {
    snippet: t.home.snippetText,
    flag: t.home.flagText,
    outline: t.home.outlineText,
  };
  return (
    <Link
      to={GAME_PATH[next][language]}
      onClick={() => prepareDaily(next)}
      className="flex items-center gap-3 rounded-lg border border-(--accent-border) bg-(--accent-soft) px-3 py-2.5 transition hover:border-(--accent)"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--accent) text-lg text-(--on-accent)">
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-(--text-secondary)">{t.home.nextChallenge}</span>
        <span className="block font-bold tracking-tight">
          {next === "snippet" ? t.home.snippetDaily : t.games[next]}
        </span>
        <span className="block truncate text-xs text-(--text-secondary)">{texts[next]}</span>
      </span>
      <FiArrowRight aria-hidden="true" className="shrink-0 text-(--accent)" />
    </Link>
  );
}

export default NextDaily;
