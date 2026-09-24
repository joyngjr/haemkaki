import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/theme";

/**
 * The three buttons in the kit, plus a disabled state. Every one clears the
 * 44px touch target, so a page never has to remember to pad them.
 *
 * Height is the only thing that changes between mobile and desktop: 52px is
 * comfortable under a thumb, 48px reads better in a desktop toolbar.
 */
const BASE = cn(
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control px-5",
  "text-[15px] font-semibold transition-colors disabled:cursor-not-allowed",
  "disabled:bg-rail disabled:text-ink-disabled disabled:hover:bg-rail",
  FOCUS_RING,
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Slate blue. One per screen — the thing you most likely came to do. */
export function PrimaryButton({ children, className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(BASE, "h-[52px] bg-slate-600 text-white hover:bg-slate-700", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** White with a hairline border, for the alternative next to a primary. */
export function OutlineButton({ children, className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(
        BASE,
        "h-[52px] border border-sand-300 bg-card font-medium text-ink-strong hover:bg-soft",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Brick. Only for what is actually wrong — out of factor, and little else. */
export function CriticalButton({ children, className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(BASE, "h-[52px] bg-brick-600 text-white hover:bg-brick-700", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
