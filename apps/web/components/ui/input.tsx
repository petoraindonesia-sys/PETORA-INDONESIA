import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
}

export function Input({ label, hint, error, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = hint || error ? inputId + "-description" : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-primary">
        {label}
        {props.required ? <span aria-hidden="true" className="ml-1 text-danger">*</span> : null}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={descriptionId}
        className={[
          "min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-primary shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-tertiary hover:border-control-hover focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-tertiary aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/10 motion-reduce:transition-none",
          className,
        ].join(" ").trim()}
      />
      {hint || error ? <p id={descriptionId} className={error ? "text-xs text-danger" : "text-xs text-secondary"}>{error ?? hint}</p> : null}
    </div>
  );
}
