import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "default" | "small";
}

function Button({
  children,
  variant = "primary",
  size = "default",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-primary) disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    // Deaktiviert wie ein dezenter Rahmen-Knopf – ausgegrautes Orange wirkt sonst wie kaputt.
    // Harter, versetzter Schatten: Beim Drücken rutscht der Knopf hinein.
    primary:
      "bg-(--accent) text-slate-950 shadow-[3px_3px_0_var(--press),0_8px_26px_-6px_var(--button-glow)] enabled:hover:bg-(--accent-hover) enabled:active:translate-x-[3px] enabled:active:translate-y-[3px] enabled:active:shadow-none disabled:border disabled:border-slate-300 disabled:bg-transparent disabled:text-(--text-primary) disabled:shadow-none dark:disabled:border-slate-700",
    secondary:
      "border border-slate-300 shadow-sm enabled:active:scale-[0.97] bg-transparent text-(--text-primary) enabled:hover:border-(--accent) enabled:hover:text-(--accent-hover) dark:border-slate-700",
  };
  const sizes = {
    default: "px-6 py-3 text-sm",
    small: "px-4 py-2 text-sm",
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
