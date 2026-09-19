/**
 * Shared tone tokens for the Home surface and the chrome around it.
 *
 * Neutrals come from the `sand` palette so Home reads as the same room as the
 * platelet scene; the three status tones stay semantic (green / amber / rose)
 * because they carry meaning the neutrals cannot.
 */

/* Status colours as complete literal classes (Tailwind JIT-safe). */
export type StatusTone = "protected" | "transitioning" | "caution";

export const STATUS_TONE_CLASSES: Record<StatusTone, { solid: string; soft: string; dot: string }> =
  {
    protected: {
      solid: "bg-emerald-600",
      soft: "bg-emerald-600/15 text-emerald-700",
      dot: "bg-emerald-500",
    },
    transitioning: {
      solid: "bg-amber-500",
      soft: "bg-amber-500/15 text-amber-700",
      dot: "bg-amber-500",
    },
    caution: {
      solid: "bg-rose-700",
      soft: "bg-rose-700/15 text-rose-800",
      dot: "bg-rose-600",
    },
  };

/* Ink and surface tokens, mapped onto the sand palette in tailwind.config.js. */
export const INK = "text-sand-900";
export const INK_MUTED = "text-sand-600";
export const SURFACE_RAISED = "bg-white";
