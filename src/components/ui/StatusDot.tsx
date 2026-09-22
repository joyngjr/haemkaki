import { cn } from "@/lib/utils";

export type MarkKind = "taken" | "planned" | "missed" | "bleed" | "none";

/**
 * The four marks the calendar, the legend and the entry lists all share:
 * a filled dot for something recorded, a ring for something only planned.
 *
 * `onDark` swaps the colour for white, for a dot sitting on a selected cell.
 */
export function StatusDot({
  kind,
  onDark = false,
  className,
}: {
  kind: MarkKind;
  onDark?: boolean;
  className?: string;
}) {
  if (kind === "none") return <span className={cn("h-2 w-2", className)} aria-hidden="true" />;

  const colour = onDark
    ? "bg-white"
    : kind === "taken"
      ? "bg-teal-600"
      : kind === "missed"
        ? "bg-ochre-600"
        : "bg-brick-600";

  if (kind === "planned") {
    return (
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full border-2 bg-transparent",
          onDark ? "border-white" : "border-teal-600",
          className,
        )}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={cn("h-2 w-2 shrink-0 rounded-full", colour, className)} aria-hidden="true" />
  );
}

const LEGEND: { kind: MarkKind; label: string }[] = [
  { kind: "planned", label: "Planned" },
  { kind: "taken", label: "Dose taken" },
  { kind: "missed", label: "Missed" },
  { kind: "bleed", label: "Bleed" },
];

/** Two columns on a phone, one row on a wide card. */
export function MarkLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-2.5 sm:flex sm:flex-wrap sm:gap-x-6",
        className,
      )}
    >
      {LEGEND.map(({ kind, label }) => (
        <span key={label} className="flex items-center gap-2.5 text-[13px] text-ink-muted">
          <StatusDot kind={kind} />
          {label}
        </span>
      ))}
    </div>
  );
}
