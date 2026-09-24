import { cn } from "@/lib/utils";

/**
 * A headline figure: label on top, a big mono number, its unit beside it.
 *
 * Mono is reserved for figures like this one — vials, days, calendar dates —
 * so a number always looks like a number and columns of them line up.
 */
export function Stat({
  label,
  value,
  unit,
  tone = "ink",
  size = "md",
  note,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  /** `caution` and `critical` tint the figure and the note; the label and unit stay neutral. */
  tone?: "ink" | "caution" | "critical";
  size?: "md" | "lg";
  /** A short line under the figure, e.g. "Order by Mon 28 Sept". */
  note?: string;
  className?: string;
}) {
  const toneClass =
    tone === "critical" ? "text-brick-600" : tone === "caution" ? "text-ochre-700" : "text-ink";
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[13px] text-ink-subtle">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono font-semibold leading-none tracking-[-0.02em]",
            size === "lg" ? "text-[34px] sm:text-[38px]" : "text-[30px] sm:text-[34px]",
            toneClass,
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-[15px] text-ink-muted">{unit}</span> : null}
      </span>
      {note ? <span className={cn("text-[13px] font-medium", toneClass)}>{note}</span> : null}
    </div>
  );
}

/**
 * A meter with no ticks and no axis labels — the sentence underneath says what
 * it means. `percent` is clamped, so a caller can hand it anything.
 */
export function Meter({
  percent,
  tone = "teal",
  className,
  label,
}: {
  percent: number;
  tone?: "teal" | "caution" | "critical";
  className?: string;
  /** Screen-reader description; the bar itself is decorative without it. */
  label?: string;
}) {
  const width = Math.min(100, Math.max(0, percent));
  const fill =
    tone === "critical" ? "bg-brick-600" : tone === "caution" ? "bg-ochre-600" : "bg-teal-600";
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-rail", className)}
      {...(label
        ? { role: "progressbar", "aria-valuenow": Math.round(width), "aria-label": label }
        : { "aria-hidden": true })}
    >
      <span className={cn("block h-2 rounded-full", fill)} style={{ width: `${width}%` }} />
    </div>
  );
}
