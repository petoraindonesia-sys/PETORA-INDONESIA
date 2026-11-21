import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-subtle text-secondary ring-border",
  info: "bg-accent-subtle text-accent-strong ring-accent/15",
  success: "bg-success-subtle text-success-strong ring-success/15",
  warning: "bg-warning-subtle text-warning-strong ring-warning/15",
  danger: "bg-danger-subtle text-danger-strong ring-danger/15",
};

export function Badge({ tone = "neutral", children, className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; children: ReactNode }) {
  return <span {...props} className={["inline-flex min-h-6 items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", tones[tone], className].join(" ").trim()}>{children}</span>;
}
