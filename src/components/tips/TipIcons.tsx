/**
 * The glyphs on the Resources cards. All one family: 24px box, 1.7 stroke,
 * round caps and joins, `currentColor` so the tile sets the tint.
 */

type IconProps = { className?: string };

const BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** A syringe — mixing and infusing. */
export function InjectionGuideIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M17 3.2 20.8 7M18.9 5.1 8.6 15.4l-4.1.9.9-4.1L15.7 1.9" />
      <path d="M13.4 7.6 16.4 10.6M4.6 19.4h15.2" />
    </svg>
  );
}

/** A map pin — treatment centres near you. */
export function FindMedicalHelpIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M12 21.2s7-5.4 7-10.6A7 7 0 0 0 5 10.6c0 5.2 7 10.6 7 10.6Z" />
      <circle cx="12" cy="10.4" r="2.6" />
    </svg>
  );
}

/** A card with a cross — the medical ID. */
export function MedicalIdIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <rect x="3.2" y="5" width="17.6" height="14" rx="2.5" />
      <path d="M12 9.2v5.6M9.2 12h5.6" />
    </svg>
  );
}

/** A heart with a cross — what to do for a bleed. */
export function BleedHelpIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M12 21s7.5-4.6 7.5-10.2A7.5 7.5 0 0 0 12 3.2a7.5 7.5 0 0 0-7.5 7.6C4.5 16.4 12 21 12 21Z" />
      <path d="M12 7.8v5.6M9.2 10.6h5.6" />
    </svg>
  );
}

/** An arrow into a tray — importing another tracker's history. */
export function ImportTrackerIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M12 3.6v11M7.6 10.2 12 14.6l4.4-4.4" />
      <path d="M4.6 15.4v3.2a1.8 1.8 0 0 0 1.8 1.8h11.2a1.8 1.8 0 0 0 1.8-1.8v-3.2" />
    </svg>
  );
}

/** A chevron — the affordance at the end of a guide row. */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...BASE} strokeWidth={1.9} className={className}>
      <path d="M9.5 5 16 12l-6.5 7" />
    </svg>
  );
}
