import { clsx } from "clsx";

export function Badge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold",
        tone === "neutral" && "border-border bg-surface text-muted",
        tone === "brand" && "border-brand/25 bg-brand/10 text-brand",
        tone === "success" && "border-success/25 bg-success/10 text-success",
        tone === "warning" && "border-warning/30 bg-warning/20 text-ink",
        tone === "danger" && "border-danger/25 bg-danger/10 text-danger"
      )}
    >
      {children}
    </span>
  );
}
