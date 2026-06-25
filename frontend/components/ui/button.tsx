import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-brand text-white hover:bg-brand/90",
        variant === "secondary" && "border border-border bg-panel text-ink hover:bg-surface",
        variant === "ghost" && "text-muted hover:bg-surface hover:text-ink",
        variant === "danger" && "bg-danger text-white hover:bg-danger/90",
        className
      )}
      {...props}
    />
  );
}
