import { ChevronLeftIcon, CloseIcon } from "./TrackerIcons";

/**
 * The modal chrome every tracker pop-up shares: a dimmable backdrop that closes
 * on click, a panel that doesn't, and a header with an optional back arrow.
 *
 * `tier` sets the stacking order. AppLayout's tab bar sits at z-40, so all three
 * tiers clear it: the day sheet, then the sheets it opens, then the pickers
 * those open in turn. This used to be done by overriding `.z-30`/`.z-40`/`.z-50`
 * globally from index.css.
 */
export type SheetTier = "day" | "action" | "picker";

const TIER_CLASS: Record<SheetTier, string> = {
  // The day sheet is the only tier that dims what's behind it.
  day: "z-[70] bg-[#242A2F]/25",
  action: "z-[80]",
  picker: "z-[90]",
};

type SheetProps = {
  tier: SheetTier;
  /** Small label above the title, e.g. "Missed Dose". */
  eyebrow?: string;
  title?: string;
  onClose: () => void;
  /** Omitted on the first step of a flow, where there is nothing to go back to. */
  onBack?: () => void;
  backLabel?: string;
  closeLabel?: string;
  /**
   * Distance from the top of the viewport on desktop. Sheets that open on top of
   * another one are pushed down so the sheet underneath stays readable.
   */
  offset?: "center" | "top" | "mid" | "low";
  /** Rendered to the right of the title, e.g. the confused-platelet mascot. */
  aside?: React.ReactNode;
  children?: React.ReactNode;
};

const OFFSET_CLASS: Record<NonNullable<SheetProps["offset"]>, string> = {
  center: "items-center p-3 sm:p-6",
  top: "items-center px-3 pb-3 pt-16 sm:items-start sm:px-6 sm:pb-6 sm:pt-20",
  mid: "items-start px-3 pb-3 pt-44 sm:px-6 sm:pb-6 sm:pt-48",
  low: "items-start px-3 pb-3 pt-60 sm:px-6 sm:pb-6 sm:pt-64",
};

const ROUND_BUTTON =
  "grid h-8 w-8 place-items-center rounded-full text-[#5C646C] hover:bg-[#F7F6F3]";

export function Sheet({
  tier,
  eyebrow,
  title,
  onClose,
  onBack,
  backLabel = "Back",
  closeLabel = "Close",
  offset = "center",
  aside,
  children,
}: SheetProps) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 flex justify-center backdrop-blur-sm ${TIER_CLASS[tier]} ${OFFSET_CLASS[offset]}`}
    >
      <aside
        onClick={(event) => event.stopPropagation()}
        // Nudged up on phones so the panel clears the tab bar and the thumb.
        className={`w-full max-w-md rounded-3xl border border-[#E7E5E0] bg-[#FFFFFF] p-5 shadow-2xl sm:p-6 ${
          offset === "center" || offset === "top" ? "-translate-y-14 sm:translate-y-0" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div>
              {eyebrow ? <p className="text-sm font-medium text-[#5C646C]">{eyebrow}</p> : null}
              {title ? <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2> : null}
            </div>
            {aside}
          </div>
          <div className="flex items-center gap-1">
            {onBack ? (
              <button onClick={onBack} aria-label={backLabel} className={ROUND_BUTTON}>
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            ) : null}
            <button onClick={onClose} aria-label={closeLabel} className={ROUND_BUTTON}>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {children}
      </aside>
    </div>
  );
}

/** The stacked tappable rows that make up every choice step in a flow. */
export function SheetOption({
  title,
  description,
  onClick,
  pressed,
  ringColor = "#2C7A70",
  trailing,
}: {
  title: string;
  description?: string;
  onClick: () => void;
  pressed?: boolean;
  ringColor?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      style={pressed ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined}
      className={`relative w-full rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] p-4 text-left transition hover:bg-[#F7F6F3] ${trailing ? "pr-12" : ""}`}
    >
      <span className="block text-sm font-bold text-[#242A2F]">{title}</span>
      {description ? (
        <span className="mt-1 block text-xs text-[#5C646C]">{description}</span>
      ) : null}
      {trailing}
    </button>
  );
}
