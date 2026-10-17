import type { ReactNode } from "react";

interface OptionProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** Auswahlknopf einer Einstellung (z. B. „30s"); der aktive ist orange gefüllt. */
export function Option({ active, disabled = false, onClick, children }: OptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`h-10 min-w-10 rounded-lg border px-3 font-mono text-sm font-semibold transition ${
        active
          ? "border-(--accent) bg-(--accent) text-(--on-accent)"
          : "border-slate-300 text-(--text-secondary) enabled:hover:border-(--accent) dark:border-slate-700"
      } disabled:cursor-default`}
    >
      {children}
    </button>
  );
}

interface OptionGroupProps<T> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Über die ganze Breite des Einstellungsrasters. */
  wide?: boolean;
}

/**
 * Beschriftete Reihe von Auswahlknöpfen. Wer nichts ändern darf (`disabled`, z. B. nicht Host),
 * sieht statt aller Knöpfe nur kompakt, was eingestellt ist.
 */
export function OptionGroup<T>({
  label,
  value,
  options,
  onChange,
  disabled,
  wide = false,
}: OptionGroupProps<T>) {
  if (disabled) {
    const selected = options.find((option) => option.value === value);
    return (
      <div className={wide ? "sm:col-span-2" : undefined}>
        <p className="text-xs text-(--text-secondary)">{label}</p>
        <p className="mt-0.5 font-mono text-sm font-semibold text-(--accent)">
          {selected?.label ?? "–"}
        </p>
      </div>
    );
  }
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <p className="text-sm font-semibold">{label}</p>
      {/* Auf dem Handy umbrechen, ab zwei Spalten in einer Reihe bleiben. */}
      <div className="mt-3 flex flex-wrap gap-2 sm:flex-nowrap">
        {options.map((option) => (
          <Option
            key={String(option.value)}
            active={option.value === value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Option>
        ))}
      </div>
    </div>
  );
}
