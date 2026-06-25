import { clsx } from "clsx";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-ink transition placeholder:text-muted hover:border-muted focus:border-brand",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "min-h-28 w-full resize-y rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink transition placeholder:text-muted hover:border-muted focus:border-brand",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-ink transition hover:border-muted focus:border-brand",
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
