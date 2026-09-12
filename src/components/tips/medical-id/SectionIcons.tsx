/** The glyphs in the coloured bubble beside each SectionCard title. */
function SectionGlyph({
  children,
  stroke = "currentColor",
}: {
  children: React.ReactNode;
  stroke?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="2">
      {children}
    </svg>
  );
}

export function PersonIcon() {
  return (
    <SectionGlyph>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" />
    </SectionGlyph>
  );
}

export function CapsuleIcon() {
  return (
    <SectionGlyph>
      <rect x="9" y="3" width="6" height="18" rx="3" strokeLinecap="round" />
    </SectionGlyph>
  );
}

export function PlusIcon() {
  return (
    <SectionGlyph>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </SectionGlyph>
  );
}

export function PhoneIcon() {
  return (
    <SectionGlyph stroke="#dc2626">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2.1z" />
    </SectionGlyph>
  );
}

export function StethoscopeIcon() {
  return (
    <SectionGlyph>
      <path d="M9 3v6a3 3 0 0 0 6 0V3M6 12v3a6 6 0 0 0 12 0v-3" strokeLinecap="round" />
    </SectionGlyph>
  );
}
