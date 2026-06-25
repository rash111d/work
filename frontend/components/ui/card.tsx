import { clsx } from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-lg border border-border bg-panel", className)}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-border/50", className)} />;
}
