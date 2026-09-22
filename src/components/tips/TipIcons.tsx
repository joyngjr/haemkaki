/** The glyphs on the cards of the Tips index. */
export function MedicalIdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
      <circle cx="9" cy="10" r="2" stroke="white" strokeWidth="1.5" />
      <path
        d="M6 16c0-1.7 1.3-3 3-3s3 1.3 3 3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line x1="13" y1="9" x2="18" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line
        x1="13"
        y1="13"
        x2="18"
        y2="13"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InjectionGuideIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-blue-500">
      <path
        d="M18 6L6 18M14 4l6 6M4 20l3-1 1-3 8-8-3-3-8 8-1 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FindMedicalHelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-green-600">
      <path
        d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
