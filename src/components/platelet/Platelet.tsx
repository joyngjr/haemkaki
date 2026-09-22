import { cn } from "@/lib/utils";

/**
 * The two axes the app tracks, and the two the API returns per profile
 * (`dose_state` / `stock_state`). They live together here because they are
 * domain states rather than drawing details: the mascot is tinted by the dose,
 * the room behind it is tinted by whichever axis is worse.
 */

/** How much factor is in the patient right now — drives the platelet's mood. */
export type DoseState = "covered" | "low" | "veryLow";

/** How many vials are at home. Independent of {@link DoseState}. */
export type StockState = "wellStocked" | "moderate" | "low";

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

const BODY: Record<DoseState, { fill: string; strokeWidth: number; radius: number }> = {
  covered: { fill: "#B34A42", strokeWidth: 24, radius: 45 },
  low: { fill: "#C2716B", strokeWidth: 22, radius: 41 },
  veryLow: { fill: "#AE9B98", strokeWidth: 20, radius: 38 },
};

function Face({ state }: { state: DoseState }) {
  if (state === "covered") {
    return (
      <g>
        <circle cx="70" cy="108" r="8" fill="#9B3A33" opacity="0.4" />
        <circle cx="130" cy="108" r="8" fill="#9B3A33" opacity="0.4" />
        <circle cx="82" cy="95" r="6" fill="#2B1210" />
        <circle cx="118" cy="95" r="6" fill="#2B1210" />
        <circle cx="80" cy="93" r="2" fill="#FFFFFF" />
        <circle cx="116" cy="93" r="2" fill="#FFFFFF" />
        <path
          d="M 94 105 Q 100 113 106 105"
          stroke="#2B1210"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (state === "low") {
    return (
      <g>
        <circle cx="72" cy="108" r="7" fill="#9B3A33" opacity="0.22" />
        <circle cx="128" cy="108" r="7" fill="#9B3A33" opacity="0.22" />
        <ellipse cx="82" cy="96" rx="6" ry="3.5" fill="#2B1210" />
        <ellipse cx="118" cy="96" rx="6" ry="3.5" fill="#2B1210" />
        <path
          d="M 75 87 Q 82 84 89 87"
          stroke="#2B1210"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M 111 87 Q 118 84 125 87"
          stroke="#2B1210"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M 92 109 Q 96 105.5 100 109 Q 104 112.5 108 109"
          stroke="#2B1210"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M 140 44 Q 147 55 140 58 Q 133 55 140 44 Z" fill="#8FC0DE" />
      </g>
    );
  }

  return (
    <g>
      <path
        d="M 74 94 Q 82 103 90 94"
        stroke="#2B1210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 110 94 Q 118 103 126 94"
        stroke="#2B1210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 92 114 Q 100 104 108 114"
        stroke="#2B1210"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <g stroke="#8FA9BE" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
        <line x1="70" y1="106" x2="66" y2="116" />
        <line x1="77" y1="108" x2="73" y2="118" />
        <line x1="130" y1="106" x2="126" y2="116" />
        <line x1="123" y1="108" x2="119" y2="118" />
      </g>
      <path d="M 138 56 Q 145 67 138 70 Q 131 67 138 56 Z" fill="#8FC0DE" />
      <path d="M 56 62 Q 61 70 56 72.5 Q 51 70 56 62 Z" fill="#8FC0DE" opacity="0.85" />
    </g>
  );
}

/**
 * The platelet drawn as a bare `<g>` on a 200x200 grid centred at (100,100).
 * Drop it into any parent `<svg>` with a `<g transform>` — no re-measuring needed.
 */
export function PlateletBody({ state }: { state: DoseState }) {
  const body = BODY[state];

  return (
    <g>
      <g
        fill={body.fill}
        stroke={body.fill}
        strokeWidth={body.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SPIKES[state].map((d) => (
          <path key={d} d={d} fill="none" />
        ))}
        <circle cx="100" cy="100" r={body.radius} />
      </g>
      <Face state={state} />
    </g>
  );
}

const LABELS: Record<DoseState, string> = {
  covered: "Platelet looking happy — factor levels covered",
  low: "Platelet looking tired — factor levels running low",
  veryLow: "Platelet drooping — factor levels very low",
};

/** Standalone platelet, for use outside the scene (list rows, empty states, headers). */
export function Platelet({ state, className }: { state: DoseState; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={LABELS[state]}
      className={cn("h-auto w-full", className)}
    >
      <PlateletBody state={state} />
    </svg>
  );
}
