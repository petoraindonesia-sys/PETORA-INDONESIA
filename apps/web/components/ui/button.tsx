import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-hover active:bg-accent-pressed disabled:bg-accent-disabled",
  secondary: "border border-border bg-surface text-primary shadow-sm hover:bg-surface-muted active:bg-surface-subtle disabled:text-tertiary",
  tertiary: "bg-transparent text-accent hover:bg-accent-subtle active:bg-accent-muted disabled:text-tertiary",
  danger: "bg-danger text-white shadow-sm hover:bg-danger-hover active:bg-danger-pressed disabled:opacity-50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 rounded-lg px-3 text-xs",
  md: "min-h-10 rounded-xl px-4 text-sm",
  lg: "min-h-12 rounded-xl px-5 text-base",
};

export function Button({ variant = "primary", size = "md", loading = false, disabled, className = "", children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:shadow-none motion-reduce:transition-none",
        variants[variant],
        sizes[size],
        className,
      ].join(" ").trim()}
    >
      {loading ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" /> : null}
      {children}
    </button>
  );
}
