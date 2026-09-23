import { SCENE_WALL, type Coverage, type Supply } from "@/components/platelet/scene-state";
import { cn } from "@/lib/utils";

/**
 * The hero scene: Kaki at home, in a room that answers two different
 * questions at once.
 *
 * `coverage` is about the *schedule* — it shapes Kaki and the shield bubble
 * around him. Round and alert inside a closed shield when doses are on time;
 * arms drawing in and the shield breaking up as one falls due; retracted and
 * pale with only fragments left once it is overdue.
 *
 * `supply` is about the *cupboard* — it furnishes the room. A bright window,
 * a picture, a healthy plant and a full shelf when there is factor at home;
 * everything dimming and thinning as it runs down; a stripped, cracked room
 * with a bare hook and an empty shelf at zero.
 *
 * The two are deliberately independent: you can be perfectly on schedule and
 * still have nothing left to take, and the scene should say both at once.
 */

const COVERAGE = {
  ok: {
    podY: 4,
    podH: 26,
    bodyR: 35,
    fill: "#B34A42",
    ink: "#2B1210",
    eyeW: 9,
    eyeH: 9,
    eyeR: 4.5,
    eyeY: 50,
    mouth: "M51 70 q9 8 18 0",
    tilt: 0,
    shadowRx: 30,
    shadowOp: 0.14,
    shieldR: 61,
    shieldFill: "#2C7A70",
    shieldFillOp: 0.12,
    shieldStroke: "#2C7A70",
    shieldW: 2.6,
    shieldDash: "none",
    shieldOp: 0.85,
    arcOp: 0.75,
    alt: "rounded and alert inside a closed shield bubble",
  },
  low: {
    podY: 12,
    podH: 20,
    bodyR: 34,
    fill: "#C2716B",
    ink: "#3A1D1A",
    eyeW: 9,
    eyeH: 9,
    eyeR: 4.5,
    eyeY: 52,
    mouth: "M51 72 h18",
    tilt: -3,
    shadowRx: 31,
    shadowOp: 0.13,
    shieldR: 53,
    shieldFill: "#B9832C",
    shieldFillOp: 0.08,
    shieldStroke: "#B9832C",
    shieldW: 2.2,
    shieldDash: "11 8",
    shieldOp: 0.8,
    arcOp: 0.35,
    alt: "arms half drawn in, the shield bubble thinning and breaking up",
  },
  none: {
    podY: 21,
    podH: 13,
    bodyR: 33,
    fill: "#AE9B98",
    ink: "#4A3C3A",
    eyeW: 11,
    eyeH: 3.6,
    eyeR: 1.8,
    eyeY: 55,
    mouth: "M51 75 q9 -7 18 0",
    tilt: -6,
    shadowRx: 34,
    shadowOp: 0.12,
    shieldR: 44,
    shieldFill: "none",
    shieldFillOp: 0,
    shieldStroke: "#A63A2E",
    shieldW: 2,
    shieldDash: "4 15",
    shieldOp: 0.55,
    arcOp: 0,
    alt: "arms retracted and pale, only fragments of the shield bubble left",
  },
} as const;

const SUPPLY = {
  stocked: {
    wall: SCENE_WALL.stocked,
    floor: "#E1DACB",
    seam: "#FFFFFF",
    paneFill: "#FAF4E3",
    curtainFill: "#8FADA7",
    curtainOp: 1,
    crackOp: 0,
    webOp: 0,
    frameOp: 1,
    frameT: "translate(236 26)",
    ghostOp: 0,
    hookOp: 0,
    potRim: "#8F5F4C",
    potFill: "#A9705C",
    stemFill: "#3A7A5E",
    leafFill: "#3A7A5E",
    leafOp: [1, 1, 1],
    leaf1T: "translate(0 0)",
    rugFill: "#B5C7C2",
    rugOp: 0.85,
    boxFill: "#8FADA7",
    boxOp: 1,
    filled: 5,
    alt: "a furnished room with a bright window, a picture on the wall, a healthy plant and a full shelf of factor vials",
  },
  low: {
    wall: SCENE_WALL.low,
    floor: "#D9D3C6",
    seam: "#FFFFFF",
    paneFill: "#E7E3D6",
    curtainFill: "#BDB6A6",
    curtainOp: 0.6,
    crackOp: 0,
    webOp: 0,
    frameOp: 0.7,
    frameT: "translate(236 26) rotate(-5 32 19)",
    ghostOp: 0,
    hookOp: 0,
    potRim: "#8B7360",
    potFill: "#9C8271",
    stemFill: "#7E8C6B",
    leafFill: "#7E8C6B",
    leafOp: [0.9, 0, 0],
    leaf1T: "rotate(38 36 102)",
    rugFill: "#D6CDB8",
    rugOp: 0.7,
    boxFill: "#C6BBA6",
    boxOp: 0.55,
    filled: 2,
    alt: "a dimmer room with a faded curtain, a crooked picture, a drooping plant and only a couple of vials left on the shelf",
  },
  empty: {
    wall: SCENE_WALL.empty,
    floor: "#D2D4D8",
    seam: "#AEB2B8",
    paneFill: "#C4C8CE",
    curtainFill: "#BFC3C9",
    curtainOp: 0,
    crackOp: 0.8,
    webOp: 0.55,
    frameOp: 0,
    frameT: "translate(236 26)",
    ghostOp: 1,
    hookOp: 1,
    potRim: "#9AA0A6",
    potFill: "#A6ACB3",
    stemFill: "#9AA0A6",
    leafFill: "#9AA0A6",
    leafOp: [0, 0, 0],
    leaf1T: "translate(0 0)",
    rugFill: "#C9CCD1",
    rugOp: 0,
    boxFill: "#BFC3C9",
    boxOp: 0,
    filled: 0,
    alt: "a stripped, deserted room with a cracked wall, a bare hook where the picture was, a dead plant and an empty shelf",
  },
} as const;

const POD_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SHELF_X = [206, 232, 258, 284, 310];

/**
 * Where the floorboards meet, every 76 units. The drawing is 356 wide, but
 * the floor is drawn far past that so it can run under the status card's
 * panel when the scene is the card's backdrop (see `StatusScene`).
 */
const FLOOR_SEAMS = Array.from({ length: 40 }, (_, index) => 44 + index * 76);

/** The white arc that catches the light on the top-left of the shield. */
function shieldArc(centreY: number, radius: number): string {
  const r = radius - 7;
  const a1 = (188 * Math.PI) / 180;
  const a2 = (248 * Math.PI) / 180;
  const x1 = (126 + r * Math.cos(a1)).toFixed(1);
  const y1 = (centreY + r * Math.sin(a1)).toFixed(1);
  const x2 = (126 + r * Math.cos(a2)).toFixed(1);
  const y2 = (centreY + r * Math.sin(a2)).toFixed(1);
  return `M${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

export function StatusScene({
  coverage,
  supply,
  className,
}: {
  coverage: Coverage;
  supply: Supply;
  className?: string;
}) {
  const c = COVERAGE[coverage];
  const s = SUPPLY[supply];
  const shieldCy = 80 + c.podY;

  return (
    <div className={cn("overflow-hidden lg:overflow-visible", className)}>
      {/*
        On a phone the drawing is the width of its card. From `lg` the status
        card gives it a box to fill and paints the wall behind everything
        (`SCENE_WALL`): the room is scaled to fit that box, sits in its
        bottom-left corner, and the floor runs on past the box's edge — under
        the panel, out to the card's edge — because the SVG does not clip.
      */}
      <svg
        viewBox="0 0 356 168"
        preserveAspectRatio="xMinYMax meet"
        className="block h-auto w-full lg:h-full lg:overflow-visible"
        role="img"
        aria-label={`Kaki at home, ${c.alt}, in ${s.alt}.`}
      >
        <rect x="0" y="0" width="356" height="168" fill={s.wall} />

        {/* Cobwebs and a crack in the plaster — only once the cupboard is bare. */}
        <g stroke="#AFB5BD" strokeWidth="1" fill="none" opacity={s.webOp}>
          <path d="M356 6 A 28 28 0 0 0 328 34" />
          <path d="M356 18 A 16 16 0 0 0 340 34" />
          <path d="M356 0 L328 34M356 0 L342 34M356 0 L356 34" />
        </g>
        <path
          d="M84 24 l7 13 l-5 10 l8 14"
          stroke="#ACB2BA"
          strokeWidth="1.2"
          fill="none"
          opacity={s.crackOp}
        />

        {/* Window */}
        <rect
          x="2"
          y="20"
          width="14"
          height="74"
          rx="4"
          fill={s.curtainFill}
          opacity={s.curtainOp}
        />
        <rect
          x="12"
          y="28"
          width="52"
          height="60"
          rx="2"
          fill={s.paneFill}
          stroke="#B1BECC"
          strokeWidth="2"
        />
        <path d="M38 28V88M12 58H64" stroke="#B1BECC" strokeWidth="1.6" />
        <rect x="6" y="88" width="64" height="4" rx="2" fill="#B1BECC" />

        {/* Picture, and the bare hook it leaves behind */}
        <rect x="236" y="26" width="64" height="38" rx="2" fill="#F1F2F4" opacity={s.ghostOp} />
        <path
          d="M268 20V25"
          stroke="#A8AEB6"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={s.hookOp}
        />
        <g transform={s.frameT} opacity={s.frameOp}>
          <rect
            x="0"
            y="0"
            width="64"
            height="38"
            rx="2"
            fill="#FFFFFF"
            stroke="#B1BECC"
            strokeWidth="1.5"
          />
          <circle cx="47" cy="13" r="5" fill="#D9BE8A" />
          <path d="M6 33 l13 -13 l9 9 l12 -12 l18 16 Z" fill="#9BB7B3" />
        </g>

        {/* The shelf of vials */}
        <rect x="200" y="100" width="150" height="4" rx="2" fill="#B1BECC" />
        {SHELF_X.map((x, index) => {
          const on = index < s.filled;
          return (
            <g key={x} transform={`translate(${x} 0)`}>
              <rect x="4" y="57" width="10" height="7" rx="2" fill={on ? "#12314F" : "#C1CCD8"} />
              <rect
                x="0"
                y="63"
                width="18"
                height="37"
                rx="5"
                fill="#FFFFFF"
                stroke="#B1BECC"
                strokeWidth="1.5"
              />
              <rect x="3" y="71" width="12" height={on ? 27 : 0} rx="3" fill="#2C7A70" />
            </g>
          );
        })}

        <g opacity={s.boxOp}>
          <rect x="300" y="112" width="44" height="22" rx="3" fill={s.boxFill} />
          <path d="M300 119H344" stroke="#FFFFFF" strokeWidth="1.4" strokeOpacity="0.7" />
        </g>

        {/* Floor — drawn well past the right edge; see the note on the <svg>. */}
        <rect x="0" y="132" width="3000" height="36" fill={s.floor} />
        <path d="M0 133H3000" stroke="#9FA8B4" strokeWidth="1.4" strokeOpacity="0.5" />
        <path
          d={FLOOR_SEAMS.map((x) => `M${x} 133V168`).join("")}
          stroke={s.seam}
          strokeWidth="1"
        />
        <ellipse cx="126" cy="150" rx="78" ry="10" fill={s.rugFill} opacity={s.rugOp} />

        {/* Plant */}
        <g>
          <path d="M36 110V100" stroke={s.stemFill} strokeWidth="2" strokeLinecap="round" />
          <g transform={s.leaf1T} opacity={s.leafOp[0]}>
            <path d="M36 102 c-11 -2 -15 -10 -14 -17 c8 -1 14 6 14 17 Z" fill={s.leafFill} />
          </g>
          <path
            d="M36 102 c11 -2 15 -10 14 -17 c-8 -1 -14 6 -14 17 Z"
            fill={s.leafFill}
            opacity={s.leafOp[1]}
          />
          <path
            d="M36 98 c-4 -8 -2 -17 0 -20 c3 5 4 13 0 20 Z"
            fill={s.leafFill}
            opacity={s.leafOp[2]}
          />
          <rect x="24" y="110" width="24" height="6" rx="2" fill={s.potRim} />
          <path d="M26 116 h20 l-3 18 h-14 Z" fill={s.potFill} />
        </g>

        {/* Kaki, and the shield around him */}
        <ellipse cx="126" cy="146" rx={c.shadowRx} ry="5" fill="#0B1B2B" opacity={c.shadowOp} />
        <circle
          cx="126"
          cy={shieldCy}
          r={c.shieldR}
          fill={c.shieldFill}
          fillOpacity={c.shieldFillOp}
          stroke={c.shieldStroke}
          strokeWidth={c.shieldW}
          strokeDasharray={c.shieldDash}
          strokeOpacity={c.shieldOp}
          strokeLinecap="round"
        />
        <path
          d={shieldArc(shieldCy, c.shieldR)}
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeOpacity={c.arcOp}
          fill="none"
          strokeLinecap="round"
        />

        <g transform={`translate(66 ${20 + c.podY}) rotate(${c.tilt} 60 60)`}>
          <g fill={c.fill}>
            {POD_ANGLES.map((angle) => (
              <rect
                key={angle}
                x="53"
                y={c.podY}
                width="14"
                height={c.podH}
                rx="7"
                transform={angle ? `rotate(${angle} 60 60)` : undefined}
              />
            ))}
            <circle cx="60" cy="60" r={c.bodyR} />
          </g>
          <rect
            x={50 - c.eyeW / 2}
            y={c.eyeY}
            width={c.eyeW}
            height={c.eyeH}
            rx={c.eyeR}
            fill={c.ink}
          />
          <rect
            x={70 - c.eyeW / 2}
            y={c.eyeY}
            width={c.eyeW}
            height={c.eyeH}
            rx={c.eyeR}
            fill={c.ink}
          />
          <path d={c.mouth} stroke={c.ink} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
