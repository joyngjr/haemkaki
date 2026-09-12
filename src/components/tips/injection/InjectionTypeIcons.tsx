/**
 * The white glyphs on the coloured tiles of the injection guide index. Bigger
 * and heavier than the per-step glyphs in ./StepIcons, which is why they are
 * separate.
 */
function TypeGlyph({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
      {children}
    </svg>
  );
}

export function IntravenousIcon() {
  return (
    <TypeGlyph>
      <path
        d="M18 6L6 18M14 4l6 6M4 20l3-1 1-3 8-8-3-3-8 8-1 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </TypeGlyph>
  );
}

export function SubcutaneousIcon() {
  return (
    <TypeGlyph>
      <path
        d="M12 2v14M12 16l-3-3M12 16l3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="5" y="18" width="14" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </TypeGlyph>
  );
}

export function PortACathIcon() {
  return (
    <TypeGlyph>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </TypeGlyph>
  );
}
