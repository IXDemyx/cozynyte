import { FiX } from "react-icons/fi";
import { FACE, FIXED, allowedValues, isUpper, type Category } from "../../../../shared/kniffel";
import Button from "../../components/Button";
import { card, eyebrow } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";

interface EntryDialogProps {
  columnName: string;
  category: Category;
  /** Bisheriger Eintrag im Feld. */
  value: number | undefined;
  /** Punkte aus den aktuellen Würfeln, falls vorhanden. */
  hint: number | undefined;
  /** Wert eintragen (0 = streichen, null = leeren). */
  onChoose: (value: number | null, fromDice?: boolean) => void;
  onClose: () => void;
}

/** Auswahl der Punkte für ein Feld – als Sheet von unten bzw. Dialog auf großen Bildschirmen. */
function EntryDialog({ columnName, category, value, hint, onChoose, onClose }: EntryDialogProps) {
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.kniffel.categories[category]}
        className={`${card} animate-in w-full max-w-md rounded-b-none p-5 sm:rounded-b-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={eyebrow}>{columnName}</p>
            <h2 className="mt-1 text-xl font-bold">{t.kniffel.categories[category]}</h2>
            <p className="text-sm text-(--text-secondary)">{t.kniffel.hints[category]}</p>
          </div>
          <button
            type="button"
            aria-label={t.kniffel.close}
            onClick={onClose}
            className="rounded-lg p-2 text-(--text-secondary) hover:text-(--text-primary)"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        {hint !== undefined && (
          <Button className="mt-5 w-full" onClick={() => onChoose(hint, true)}>
            {t.kniffel.fromDice(hint)}
          </Button>
        )}

        <div
          className={`mt-5 grid gap-2 ${
            isUpper(category) ? "grid-cols-3" : FIXED[category] ? "grid-cols-1" : "grid-cols-6"
          }`}
        >
          {allowedValues(category)
            .filter((v) => v > 0)
            .map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChoose(option)}
                className={`h-11 rounded-lg border font-mono text-sm font-semibold transition ${
                  option === value
                    ? "border-(--accent) bg-(--accent) text-slate-950"
                    : "border-slate-300 hover:border-(--accent) hover:text-(--accent) dark:border-slate-700"
                }`}
              >
                {isUpper(category)
                  ? t.kniffel.times(option / FACE[category], option)
                  : FIXED[category]
                    ? t.kniffel.enter(option)
                    : option}
              </button>
            ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => onChoose(0)}
            className={value === 0 ? "border-(--accent)! text-(--accent)!" : ""}
          >
            {t.kniffel.strike}
          </Button>
          <Button variant="secondary" onClick={() => onChoose(null)} disabled={value === undefined}>
            {t.kniffel.clear}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EntryDialog;
