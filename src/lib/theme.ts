/**
 * Shared tone tokens for every surface in the app.
 *
 * The neutrals are the clinical palette from the UI kit — a warm paper ground,
 * white cards with a hairline border, ink that never goes fully black. The
 * three status tones stay semantic (moss / ochre / brick) because they carry
 * meaning the neutrals cannot.
 *
 * Tailwind classes live here; the raw hexes live in `design.ts` for SVG fills
 * and anywhere a class cannot reach.
 */

/* Status colours as complete literal classes (Tailwind JIT-safe). */
export type StatusTone = "protected" | "transitioning" | "caution";

export const STATUS_TONE_CLASSES: Record<
  StatusTone,
  { solid: string; soft: string; dot: string; ink: string }
> = {
  protected: {
    solid: "bg-moss-600",
    soft: "bg-teal-50 text-moss-700",
    dot: "bg-moss-600",
    ink: "text-moss-700",
  },
  transitioning: {
    solid: "bg-ochre-600",
    soft: "bg-ochre-50 text-ochre-700",
    dot: "bg-ochre-600",
    ink: "text-ochre-700",
  },
  caution: {
    solid: "bg-brick-600",
    soft: "bg-brick-50 text-brick-600",
    dot: "bg-brick-600",
    ink: "text-brick-600",
  },
};

/* Ink and surface tokens. Kept as named exports because a lot of screens
   already import them by name. */
export const INK = "text-ink";
export const INK_MUTED = "text-ink-muted";
export const SURFACE_RAISED = "bg-card";

/** Focus ring used on every interactive element. */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
