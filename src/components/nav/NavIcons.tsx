/**
 * The bottom-tab icons, one component each.
 *
 * To swap an icon, replace the shapes inside that component's <svg> and leave
 * everything else alone. Keep `viewBox="0 0 24 24"` and `stroke="currentColor"`
 * so the icon inherits the active/inactive colour from the tab around it.
 */

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Home tab. */
export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-8Z"
        {...strokeProps}
      />
    </svg>
  );
}

/** Tracker tab. */
export function TrackerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M6 14v5M12 5v14M18 10v9" {...strokeProps} />
    </svg>
  );
}

/** Tips tab. */
export function TipsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M9 17h6M10 20h4" {...strokeProps} />
      <path
        d="M12 3a6 6 0 0 0-3.5 10.9c.3.2.5.6.5 1v.1h6v-.1c0-.4.2-.8.5-1A6 6 0 0 0 12 3Z"
        {...strokeProps}
      />
    </svg>
  );
}
