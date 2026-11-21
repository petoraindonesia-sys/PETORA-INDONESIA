import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, className = "", ...props }: CardProps) {
  return (
    <div {...props} className={["rounded-2xl border border-border bg-surface shadow-card", padded ? "p-5 sm:p-6" : "", className].join(" ").trim()}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["mb-4 flex flex-wrap items-start justify-between gap-3", className].join(" ").trim()}>{children}</div>;
}

export function CardTitle({ children, className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={["text-base font-semibold tracking-tight text-primary", className].join(" ").trim()}>{children}</h2>;
}

export function CardDescription({ children, className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={["mt-1 text-sm leading-6 text-secondary", className].join(" ").trim()}>{children}</p>;
}
