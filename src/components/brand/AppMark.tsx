import { cn } from "@/lib/utils";

/**
 * The platelet reduced to its silhouette: eight pseudopods and a body, no
 * face. The kit drops the face below 32px, and this mark is never drawn
 * larger than that — the mascot with a face is `Kaki`.
 */
export function AppMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <g fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <rect
            key={angle}
            x="53"
            y="6"
            width="14"
            height="24"
            rx="7"
            transform={angle ? `rotate(${angle} 60 60)` : undefined}
          />
        ))}
        <circle cx="60" cy="60" r="34" />
      </g>
    </svg>
  );
}

/** The mark plus the wordmark, as it sits in the desktop top bar. */
export function AppWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-slate-600", className)}>
      <AppMark />
      <span className="text-base font-semibold">HaemKakis</span>
    </span>
  );
}
