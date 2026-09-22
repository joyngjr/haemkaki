/**
 * The two platelet expressions the tracker draws inline.
 *
 * These are hand-drawn faces on the platelet body rather than the shared
 * artwork in `@/components/platelet`, which only carries the supply states.
 */

const BODY_PROPS = {
  fill: "#B34A42",
  stroke: "#B34A42",
  strokeWidth: "24",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PlateletBody() {
  return (
    <g {...BODY_PROPS}>
      <path d="M 100 100 L 100 35" fill="none" />
      <path d="M 100 100 L 45 55" fill="none" />
      <path d="M 100 100 L 155 55" fill="none" />
      <path d="M 100 100 L 35 110" fill="none" />
      <path d="M 100 100 L 165 110" fill="none" />
      <path d="M 100 100 L 70 155" fill="none" />
      <path d="M 100 100 L 130 155" fill="none" />
      <circle cx="100" cy="100" r="45" />
    </g>
  );
}

/** Shown beside the factor supply count once it drops to the minimum buffer. */
export function AlarmedPlatelet({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 200"
      className={className}
      role="img"
      aria-label="Alarmed platelet character"
    >
      <PlateletBody />
      <path
        d="M 72 82 Q 80 72 90 80"
        stroke="#2B1210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 110 80 Q 120 72 128 82"
        stroke="#2B1210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="82" cy="95" r="7" fill="#2B1210" />
      <circle cx="118" cy="95" r="7" fill="#2B1210" />
      <ellipse cx="100" cy="120" rx="8" ry="10" fill="#2B1210" />
      <text
        x="195"
        y="128"
        fontSize="88"
        fontWeight="700"
        fill="#A63A2E"
        transform="rotate(15 195 90)"
      >
        !
      </text>
    </svg>
  );
}

/** Shown when the user opens a date that hasn't happened yet. */
export function ConfusedPlatelet({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Confused platelet character"
    >
      <PlateletBody />
      <path
        d="M 76 88 Q 82 78 90 84"
        stroke="#2B1210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 108 84 Q 116 76 124 86"
        stroke="#2B1210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="83" cy="97" r="5" fill="#2B1210" />
      <circle cx="117" cy="99" r="4" fill="#2B1210" />
      <path
        d="M 88 118 Q 96 112 104 118 Q 112 124 120 116"
        stroke="#2B1210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <text x="128" y="60" fontSize="34" fontWeight="700" fill="#274A63">
        ?
      </text>
    </svg>
  );
}
