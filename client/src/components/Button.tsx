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
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-primary) disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    primary: "bg-(--accent) text-slate-950 enabled:hover:bg-(--accent-hover)",
    secondary:
      "border border-slate-300 bg-transparent text-(--text-primary) enabled:hover:border-(--accent) enabled:hover:text-(--accent-hover) dark:border-slate-700",
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
