/**
 * Kaki — the Home screen's platelet mascot.
 *
 * Same geometry as `@/components/platelet/Platelet`, but tinted per
 * {@link DoseState} and animated, so the scene and the nav button read as one
 * character. `Platelet` stays the flat version used inside `FactorScene`.
 */

import {
  KAKI_BOB_DURATION,
  KAKI_PALETTE,
  type KakiPalette,
} from "@/components/platelet/kaki-palette";
import type { DoseState } from "@/components/platelet/Platelet";
import { cn } from "@/lib/utils";

const SPIKES: Record<DoseState, string[]> = {
  covered: [
    "M 100 100 L 100 35",
    "M 100 100 L 45 55",
    "M 100 100 L 155 55",
    "M 100 100 L 35 110",
    "M 100 100 L 165 110",
    "M 100 100 L 70 155",
    "M 100 100 L 130 155",
  ],
  low: [
    "M 100 100 Q 102 64 84 36",
    "M 100 100 Q 72 80 42 72",
    "M 100 100 Q 128 80 158 72",
    "M 100 100 Q 72 104 38 116",
    "M 100 100 Q 128 104 162 116",
    "M 100 100 Q 86 128 72 158",
    "M 100 100 Q 114 128 128 158",
  ],
  veryLow: [
    "M 100 100 Q 104 70 80 48",
    "M 100 100 Q 72 86 42 90",
    "M 100 100 Q 128 86 158 90",
    "M 100 100 Q 72 106 44 124",
    "M 100 100 Q 128 106 156 124",
    "M 100 100 Q 86 126 76 152",
    "M 100 100 Q 114 126 124 152",
  ],
};

const BODY: Record<DoseState, { strokeWidth: number; radius: number }> = {
  covered: { strokeWidth: 24, radius: 45 },
  low: { strokeWidth: 22, radius: 41 },
  veryLow: { strokeWidth: 20, radius: 38 },
};

export { KAKI_BOB_DURATION, KAKI_PALETTE };

export function KakiFace({ state, palette }: { state: DoseState; palette: KakiPalette }) {
  const ink = palette.ink;
  if (state === "covered") {
    // Cheerful, not over-excited.
    return (
      <g>
        <circle cx="70" cy="108" r="8" fill={palette.blush} opacity="0.35" />
        <circle cx="130" cy="108" r="8" fill={palette.blush} opacity="0.35" />
        <circle cx="82" cy="95" r="6" fill={ink} />
        <circle cx="118" cy="95" r="6" fill={ink} />
        <circle cx="80" cy="93" r="2" fill="#FFFFFF" />
        <circle cx="116" cy="93" r="2" fill="#FFFFFF" />
        <path
          d="M 94 106 Q 100 112 106 106"
          stroke={ink}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (state === "low") {
    // Neutral and calm — no sadness, no distress.
    return (
      <g>
        <circle cx="72" cy="108" r="7" fill={palette.blush} opacity="0.2" />
        <circle cx="128" cy="108" r="7" fill={palette.blush} opacity="0.2" />
        <ellipse cx="82" cy="96" rx="5.5" ry="4.5" fill={ink} />
        <ellipse cx="118" cy="96" rx="5.5" ry="4.5" fill={ink} />
        <circle cx="80.5" cy="94.5" r="1.6" fill="#FFFFFF" />
        <circle cx="116.5" cy="94.5" r="1.6" fill="#FFFFFF" />
        <path
          d="M 93 108 Q 100 111 107 108"
          stroke={ink}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }
  // Attentive / gently concerned — alert, never panicked.
  return (
    <g>
      <ellipse cx="82" cy="97" rx="5.5" ry="5" fill={ink} />
      <ellipse cx="118" cy="97" rx="5.5" ry="5" fill={ink} />
      <circle cx="80.5" cy="95.5" r="1.6" fill="#FFFFFF" />
      <circle cx="116.5" cy="95.5" r="1.6" fill="#FFFFFF" />
      <path
        d="M 74 85 Q 82 81 90 84"
        stroke={ink}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M 126 85 Q 118 81 110 84"
        stroke={ink}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path d="M 93 110 L 107 110" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Kaki as a bare <g> on a 200x200 grid centred at (100,100). */
export function KakiBody({ state, palette }: { state: DoseState; palette?: KakiPalette }) {
  const body = BODY[state];
  const colours = palette ?? KAKI_PALETTE[state];
  return (
    <g>
      <g
        fill={colours.body}
        stroke={colours.body}
        strokeWidth={body.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SPIKES[state].map((d) => (
          <path key={d} d={d} fill="none" />
        ))}
        <circle cx="100" cy="100" r={body.radius} />
      </g>
      <KakiFace state={state} palette={colours} />
    </g>
  );
}

const KAKI_LABELS: Record<DoseState, string> = {
  covered: "Kaki looking cheerful — protection on track",
  low: "Kaki looking calm — protection tapering",
  veryLow: "Kaki looking attentive — dose needs attention",
};

/** Standalone Kaki for use outside the scene (nav button, list rows). */
export function Kaki({ state, className }: { state: DoseState; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={KAKI_LABELS[state]}
      className={cn("h-auto w-full", className)}
    >
      <KakiBody state={state} />
    </svg>
  );
}
