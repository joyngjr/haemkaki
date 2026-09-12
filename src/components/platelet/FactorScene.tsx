import { useId, type ReactNode } from "react";

import { PlateletBody, type DoseState } from "@/components/platelet/Platelet";
import { cn } from "@/lib/utils";

/** How many vials are at home — drives the shelf. Independent of {@link DoseState}. */
export type StockState = "wellStocked" | "moderate" | "low";

type Severity = 0 | 1 | 2;

const DOSE_SEVERITY: Record<DoseState, Severity> = { covered: 0, low: 1, veryLow: 2 };
const STOCK_SEVERITY: Record<StockState, Severity> = { wellStocked: 0, moderate: 1, low: 2 };

/** Vials shown as full, out of SHELF_SIZE, when no explicit count is passed. */
const STOCK_VIALS: Record<StockState, number> = { wellStocked: 7, moderate: 4, low: 2 };
const SHELF_SIZE = 7;

const DOSE_LABEL: Record<DoseState, string> = {
  covered: "Topped up",
  low: "Dose due soon",
  veryLow: "Dose overdue",
};

const STOCK_LABEL: Record<StockState, string> = {
  wellStocked: "Well stocked",
  moderate: "Restock soon",
  low: "Low on vials",
};

/**
 * One palette per severity, not per state — the room reacts to whichever axis is
 * more urgent, so the two signals never tint the scene in opposite directions.
 */
const AMBIENT: Record<
  Severity,
  {
    wallTop: string;
    wallBottom: string;
    floor: string;
    shelf: string;
    shadow: string;
    vialTop: string;
    vialBottom: string;
    vialEdge: string;
    empty: string;
    text: string;
  }
> = {
  0: {
    wallTop: "#FDF4DE",
    wallBottom: "#EAD2A4",
    floor: "#C7A679",
    shelf: "#AF8C61",
    shadow: "#9A7A52",
    vialTop: "#FFFCF2",
    vialBottom: "#E6C68E",
    vialEdge: "#B08C57",
    empty: "#C4A473",
    text: "#4A3520",
  },
  // Sits 45% of the way from 0 to 2 on every channel, so the room reads as one
  // palette dimming rather than three unrelated colour schemes.
  1: {
    wallTop: "#F6EEE3",
    wallBottom: "#DECBB5",
    floor: "#B69C87",
    shelf: "#9D826F",
    shadow: "#8B7160",
    vialTop: "#FDFAF5",
    vialBottom: "#DDC5A9",
    vialEdge: "#9F836B",
    empty: "#B29781",
    text: "#433229",
  },
  2: {
    wallTop: "#EEE7EA",
    wallBottom: "#D0C3CA",
    floor: "#A28F99",
    shelf: "#88757F",
    shadow: "#786671",
    vialTop: "#FBF7F9",
    vialBottom: "#D2C3CA",
    vialEdge: "#8B7883",
    empty: "#9C8791",
    text: "#3B2E35",
  },
};

/** Vial x positions, centred on the shelf. */
const VIAL_X = Array.from({ length: SHELF_SIZE }, (_, i) => 185 + i * 34);

function Vial({
  x,
  filled,
  fill,
  edge,
  empty,
}: {
  x: number;
  filled: boolean;
  fill: string;
  edge: string;
  empty: string;
}) {
  if (!filled) {
    return (
      <rect
        x={x}
        y={159}
        width={26}
        height={54}
        rx={13}
        fill={empty}
        fillOpacity={0.22}
        stroke={empty}
        strokeWidth={1.5}
        strokeOpacity={0.5}
        strokeDasharray="3 4"
      />
    );
  }
  return (
    <g>
      <rect
        x={x}
        y={159}
        width={26}
        height={54}
        rx={13}
        fill={fill}
        stroke={edge}
        strokeWidth={1.25}
        strokeOpacity={0.4}
      />
      <rect x={x + 5} y={161} width={16} height={7} rx={3.5} fill={edge} fillOpacity={0.22} />
    </g>
  );
}

export type FactorSceneProps = {
  /** Factor in the patient right now. */
  dose: DoseState;
  /** Vials at home. */
  stock: StockState;
  /** Optional real count — overrides the number of full vials implied by `stock`. */
  vialsOnHand?: number;
  /** Badge scale. Use "sm" for thumbnails and grids, "md" for a hero card. */
  size?: "sm" | "md";
  /**
   * Control docked to the top-right corner of the scene. When set, the stock
   * pill moves alongside the dose pill on the left so the two never overlap.
   */
  action?: ReactNode;
  className?: string;
};

export function FactorScene({
  dose,
  stock,
  vialsOnHand,
  size = "md",
  action,
  className,
}: FactorSceneProps) {
  const uid = useId();
  const wallId = `wall-${uid}`;
  const vialId = `vial-${uid}`;

  const severity = Math.max(DOSE_SEVERITY[dose], STOCK_SEVERITY[stock]) as Severity;
  const ambient = AMBIENT[severity];

  const full = Math.max(0, Math.min(SHELF_SIZE, vialsOnHand ?? STOCK_VIALS[stock]));
  const calm = DOSE_SEVERITY[dose] === 0 && STOCK_SEVERITY[stock] === 0;

  // Silence means fine: a pill only appears for an axis that wants attention.
  const dosePill = calm ? "Warm & stocked" : DOSE_SEVERITY[dose] > 0 ? DOSE_LABEL[dose] : null;
  const stockPill = STOCK_SEVERITY[stock] > 0 ? STOCK_LABEL[stock] : null;

  const pillClass = cn(
    "rounded-full bg-white/90 font-semibold shadow-sm backdrop-blur-sm",
    size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-4 py-1.5 text-sm",
  );

  // The platelet gets slower and shallower as it runs out of factor.
  const bob = dose === "covered" ? "4s" : dose === "low" ? "6s" : "9s";

  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      <svg viewBox="0 0 600 420" className="block h-auto w-full" aria-hidden="true">
        <defs>
          <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ambient.wallTop} />
            <stop offset="100%" stopColor={ambient.wallBottom} />
          </linearGradient>
          <linearGradient id={vialId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ambient.vialTop} />
            <stop offset="100%" stopColor={ambient.vialBottom} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="600" height="420" fill={`url(#${wallId})`} />
        <rect x="0" y="292" width="600" height="128" fill={ambient.floor} />

        {VIAL_X.map((x, i) => (
          <Vial
            key={x}
            x={x}
            filled={i < full}
            fill={`url(#${vialId})`}
            edge={ambient.vialEdge}
            empty={ambient.empty}
          />
        ))}
        <rect x="40" y="212" width="520" height="11" rx="5.5" fill={ambient.shelf} />

        <ellipse cx="223" cy="337" rx="41" ry="7" fill={ambient.shadow} opacity="0.35" />
        <ellipse cx="450" cy="338" rx="20" ry="4" fill={ambient.shadow} opacity="0.28" />

        <g transform="translate(128 168) scale(0.95)">
          <g
            className="animate-platelet-bob motion-reduce:animate-none"
            style={{ animationDuration: bob }}
          >
            <PlateletBody state={dose} />
          </g>
        </g>

        <g transform="translate(400 250) scale(0.5)">
          <g
            className="animate-platelet-bob motion-reduce:animate-none"
            style={{ animationDuration: bob, animationDelay: "-1.4s" }}
          >
            <PlateletBody state={dose} />
          </g>
        </g>
      </svg>

      <div
        className={cn(
          "pointer-events-none absolute flex items-start justify-between gap-2",
          size === "sm" ? "inset-x-2.5 top-2.5" : "inset-x-4 top-4",
        )}
      >
        <div className="flex min-w-0 flex-wrap gap-2">
          {dosePill ? (
            <span className={pillClass} style={{ color: ambient.text }}>
              {dosePill}
            </span>
          ) : null}
          {action && stockPill ? (
            <span className={pillClass} style={{ color: ambient.text }}>
              {stockPill}
            </span>
          ) : null}
        </div>
        {action ? <div className="pointer-events-auto shrink-0">{action}</div> : null}
        {!action && stockPill ? (
          <span className={pillClass} style={{ color: ambient.text }}>
            {stockPill}
          </span>
        ) : null}
      </div>

      <p className="sr-only">
        {DOSE_LABEL[dose]}. {STOCK_LABEL[stock]} — {full} of {SHELF_SIZE} vials at home.
      </p>
    </div>
  );
}
