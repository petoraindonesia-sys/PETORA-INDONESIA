import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function Select({ label, hint, error, id, className = "", children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = hint || error ? selectId + "-description" : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-primary">
        {label}
        {props.required ? <span aria-hidden="true" className="ml-1 text-danger">*</span> : null}
      </label>
      <select
        {...props}
        id={selectId}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={descriptionId}
        className={[
          "min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-primary shadow-sm outline-none transition-[border-color,box-shadow] hover:border-control-hover focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-tertiary aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/10 motion-reduce:transition-none",
          className,
        ].join(" ").trim()}
      >
        {children}
      </select>
      {hint || error ? <p id={descriptionId} className={error ? "text-xs text-danger" : "text-xs text-secondary"}>{error ?? hint}</p> : null}
    </div>
  );
}
