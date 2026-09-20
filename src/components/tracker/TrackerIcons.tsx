/** The line glyphs used across the tracker's cards and sheets. */

type IconProps = { className?: string };

function Glyph({ className = "", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m15 18-6-6 6-6" />
    </Glyph>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m9 18 6-6-6-6" />
    </Glyph>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Glyph>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Glyph>
  );
}

export function QuestionIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9.2a3 3 0 0 1 5.8 1c0 2-2.9 2.6-2.9 2.6" />
      <path d="M12 16.8h.01" />
    </Glyph>
  );
}

export function RepeatIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Glyph>
  );
}

export function VialIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="8" y="2" width="8" height="20" rx="4" />
      <path d="M8 8h8" />
    </Glyph>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 4v16l14-8Z" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function SyringeIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 19 4-4M8 20l-4-4M10 14l-3-3 5-5 3 3-5 5ZM14 6l2-2 4 4-2 2M15 15h5v5h-5z" />
    </svg>
  );
}

export function WarningIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  );
}

/** The blood drop that marks on-demand use — a bleed — on the calendar and in lists. */
export function BleedDropIcon({ className = "", label }: IconProps & { label?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z" />
    </svg>
  );
}
