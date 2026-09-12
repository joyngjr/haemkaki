/**
 * The glyphs that sit in the tile beside each injection step.
 *
 * Every one is drawn on the same 24x24 grid with the same stroke, so they share
 * a frame and each export below is just its paths. A new step type means adding
 * one export here, not another inline <svg> in a page.
 */
function StepGlyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      {children}
    </svg>
  );
}

const VIAL_PATH = "M9 3h6M10 3v4l-2 3v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9l-2-3V3";
const SYRINGE_PATH = "M4 20l3-1 1-3 8-8-3-3-8 8-1 3z";
const SYRINGE_WITH_PLUNGER_PATH = "M18 6l-3-3M15 6l3 3M4 20l3-1 1-3 8-8-3-3-8 8-1 3z";

export function VialIcon() {
  return (
    <StepGlyph>
      <path d={VIAL_PATH} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15h8" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function TwoVialsIcon() {
  return (
    <StepGlyph>
      <path
        d="M5 4h3M6 4v3l-1 2v7a1.5 1.5 0 0 0 1.5 1.5h1A1.5 1.5 0 0 0 9 16V9L8 7V4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 4h3M17 4v3l-1 2v7a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5V9l-1-2V4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 10h7" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function CleanVialIcon() {
  return (
    <StepGlyph>
      <path d={VIAL_PATH} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5l3 3M4 8l3-3" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function SyringeIcon() {
  return (
    <StepGlyph>
      <path d={SYRINGE_WITH_PLUNGER_PATH} strokeLinecap="round" strokeLinejoin="round" />
    </StepGlyph>
  );
}

export function FilterSyringeIcon() {
  return (
    <StepGlyph>
      <path d={SYRINGE_WITH_PLUNGER_PATH} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </StepGlyph>
  );
}

export function SyringeSwapIcon() {
  return (
    <StepGlyph>
      <path d={SYRINGE_PATH} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4l4 4" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function AngleSyringeIcon() {
  return (
    <StepGlyph>
      <path d={SYRINGE_WITH_PLUNGER_PATH} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 21h20" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function SwabIcon() {
  return (
    <StepGlyph>
      <circle cx="8" cy="8" r="3" />
      <path d="M10.5 10.5 18 18" strokeLinecap="round" />
      <path d="M15 19l3-3 1 1-3 3z" strokeLinecap="round" strokeLinejoin="round" />
    </StepGlyph>
  );
}

export function PinchSkinIcon() {
  return (
    <StepGlyph>
      <path d="M12 3c-1 3-1 5 0 7s1 4 0 7" strokeLinecap="round" />
      <path d="M8 6c1 3 1 4 0 6M16 6c-1 3-1 4 0 6" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function AngleNeedleIcon() {
  return (
    <StepGlyph>
      <path d="M12 3v10" strokeLinecap="round" />
      <path d="M12 13l0 4" strokeLinecap="round" />
      <circle cx="12" cy="19" r="2" />
      <path d="M9 3h6" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function SalinePushIcon() {
  return (
    <StepGlyph>
      <path d={SYRINGE_PATH} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 10v4" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function MedicationPushIcon() {
  return (
    <StepGlyph>
      <rect
        x="9"
        y="3"
        width="6"
        height="10"
        rx="1.5"
        fill="currentColor"
        stroke="none"
        opacity="0.25"
      />
      <rect x="9" y="3" width="6" height="10" rx="1.5" />
      <path d="M12 13v8" strokeLinecap="round" />
    </StepGlyph>
  );
}

export function FlushIcon() {
  return (
    <StepGlyph>
      <path d={SYRINGE_PATH} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4l0 6" strokeLinecap="round" />
      <path d="M17 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </StepGlyph>
  );
}
