import type { ReactNode } from "react";

type StatusTone = "info" | "success" | "warning" | "error";

const styles: Record<StatusTone, string> = {
  info: "border-accent/20 bg-accent-subtle text-accent-strong",
  success: "border-success/20 bg-success-subtle text-success-strong",
  warning: "border-warning/20 bg-warning-subtle text-warning-strong",
  error: "border-danger/20 bg-danger-subtle text-danger-strong",
};

export function StatusMessage({ tone = "info", title, children }: { tone?: StatusTone; title: string; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={["rounded-xl border px-4 py-3", styles[tone]].join(" ")}>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-1 text-sm leading-6 opacity-90">{children}</div>
    </div>
  );
}
