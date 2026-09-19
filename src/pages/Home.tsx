/**
 * HaemKakis — Home screen (consolidated single-file build)
 * =========================================================
 *
 * This pass implements the team's final Home scope + the low-friction dose
 * workflow from patient survey feedback:
 *  - REMOVED: Inventory card, Recent Activity card, Quick Log, centre Actions
 *    button. Not replaced with new permanent cards.
 *  - Bottom navigation: exactly Home / Tracker / Resources.
 *  - Profile moved to the header (top-right).
 *  - Kaki's tap panel is now a short, state-aware explanation only — no
 *    numeric details, no action buttons.
 *  - New: a contextual dose-action area (Taken / Change time / I took it /
 *    Update schedule / Remind me later) that only appears when relevant.
 *
 * Dependencies: react, lucide-react. Nothing else.
 * Tailwind: uses the team's existing brand-* palette plus standard utilities.
 *
 * CLINICAL BOUNDARY: the cover estimate and activity timing logic in this file
 * are PROTOTYPE / DEMO heuristics based on recorded schedule timing only.
 * They are not measured factor levels, not pharmacokinetic guidance, and not
 * clinically validated. They are isolated in `getCoverStatus` and
 * `getActivitySafety` so clinically validated logic can replace them without
 * touching any component.
 *
 * INTEGRATION BOUNDARY:
 *  - <HomeScreen /> (default export) wires Home to MOCK data + local state so
 *    it renders standalone today.
 *  - <HomePage /> is pure presentation: give it `HomeDashboardData` +
 *    `HomeActions` and it never touches state, storage, or a router.
 *  - Navigation is expressed as `onNavigate(route: HomeRouteKey)` intents.
 *    Connect them to the team's router in one place (see HomeScreen below).
 *  - `onRescheduleDose` with `scope: "futureSchedule"` is a UI/intention
 *    boundary only — see HomeScreen for where that's flagged as pending.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  CircleUserRound,
  Clock3,
  Lightbulb,
  PersonStanding,
  ShieldCheck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ProfileSheet } from "@/components/profile/ProfileSheet";
import { useHomeData } from "@/state/home-context";

/* ===================================================================== */
/* Tiny utilities                                                         */
/* ===================================================================== */

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* Injected once: Kaki animations + reduced-motion handling. */
const HOME_STYLE_TEXT = `
@keyframes platelet-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
@keyframes kaki-pop {
  0% { transform: scale(1); }
  40% { transform: scale(0.92, 1.06); }
  70% { transform: scale(1.05, 0.95); }
  100% { transform: scale(1); }
}
.animate-platelet-bob { animation: platelet-bob 5s ease-in-out infinite; }
.animate-kaki-pop { animation: kaki-pop 0.6s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .animate-platelet-bob, .animate-kaki-pop { animation: none !important; }
}
`;

function HomeStyles() {
  return <style>{HOME_STYLE_TEXT}</style>;
}

/* Status colours as complete literal classes (Tailwind JIT-safe). */
type StatusTone = "protected" | "transitioning" | "caution";

const STATUS_TONE_CLASSES: Record<
  StatusTone,
  { solid: string; soft: string; dot: string }
> = {
  protected: {
    solid: "bg-emerald-600",
    soft: "bg-emerald-600/15 text-emerald-700",
    dot: "bg-emerald-500",
  },
  transitioning: {
    solid: "bg-amber-500",
    soft: "bg-amber-500/15 text-amber-700",
    dot: "bg-amber-500",
  },
  caution: {
    solid: "bg-rose-700",
    soft: "bg-rose-700/15 text-rose-800",
    dot: "bg-rose-600",
  },
};

/* Ink/surface fallbacks so the file works even before team tokens exist. */
const INK = "text-stone-800";
const INK_MUTED = "text-stone-500";
const SURFACE_RAISED = "bg-white";

/* ===================================================================== */
/* 1. Data contracts                                                      */
/* ===================================================================== */

/** How much factor cover the patient has right now — drives Kaki. */
export type DoseState = "covered" | "low" | "veryLow";

export interface HomeUser {
  firstName: string;
}

/** Single source of truth for treatment / half-life information. */
export interface TreatmentStatus {
  dose: DoseState;
  /** ISO timestamp of the most recent administered dose. */
  lastDoseAt?: string;
  /** ISO timestamp of the next scheduled prophylactic dose. */
  nextDoseAt?: string;
  factorHalfLifeHours: number;
  /**
   * Estimated days of prophylactic protection from the treatment schedule.
   * NOT inventory coverage — Home no longer shows inventory at all.
   */
  estimatedProtectionDays?: number;
  /** Already configured on the patient's treatment profile — never re-asked here. */
  medicationName?: string;
  prescribedDose?: string;
}

export interface CoverStatus {
  state: "estimated" | "approaching" | "needsReview" | "unavailable";
  displayValue?: string;
  source: "scheduleEstimate" | "validatedPK" | "unavailable";
  supportingText: string;
}

export interface ActivityStatus {
  hasLoggedBleed?: boolean;
}

export interface DailyTipData {
  id: string;
  title: string;
  body: string;
  sourceLabel?: string;
  sourceUrl?: string;
  reviewedAt?: string;
  clinicalReviewStatus?: "pending" | "reviewed";
}

export interface HomeDashboardData {
  user: HomeUser;
  treatmentStatus: TreatmentStatus | null;
  activityStatus: ActivityStatus;
  dailyTip: DailyTipData;
  lastUpdatedAt?: string;
}

/**
 * Logical destinations Home can request. Home never knows URLs — reconcile
 * these keys with the team's router in one place.
 */
export type HomeRouteKey =
  | "home"
  | "tracker"
  | "resources"
  | "profile"
  | "activity"
  | "treatmentSetup";

export type SaveResult = { ok: true } | { ok: false; message?: string };

export interface RecordDosePayload {
  /** ISO timestamp of the actual administration time (prospective or retrospective). */
  administeredAt: string;
  /** Amount actually administered for this event; this never changes the usual regimen. */
  administeredDose?: string;
}

export interface RescheduleDosePayload {
  /** ISO timestamp of the new scheduled time. */
  newScheduledAt: string;
  scope: "thisDose" | "futureSchedule";
}

/** Every side effect Home can trigger. The host app implements these. */
export interface HomeActions {
  /** Handles both the "Taken" (prospective) and "I took it" (retrospective) flows. */
  onRecordDose: (payload: RecordDosePayload) => Promise<SaveResult>;
  /** UI/intention boundary — see HomeScreen for how "futureSchedule" is flagged pending. */
  onRescheduleDose: (payload: RescheduleDosePayload) => void;
  /** Optional: hook into real notification infra. Home always defers the prompt locally either way. */
  onRemindLater?: () => void;
  onOpenActivity: () => void;
  onNavigate: (route: HomeRouteKey) => void;
}

export interface HomePageProps {
  data: HomeDashboardData;
  actions: HomeActions;
  /** Injectable clock so relative times are deterministic in demos/tests. */
  now?: Date;
  isLoading?: boolean;
}

/* ===================================================================== */
/* 2. Date/time formatting helpers (pure)                                 */
/* ===================================================================== */

const DEFAULT_LOCALE = "en-SG";
const DEFAULT_TIME_ZONE = "Asia/Singapore";

function getDayPeriod(date: Date): "Morning" | "Afternoon" | "Evening" {
  const hour = date.getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

interface NextDoseDisplay {
  day: string;
  dateTime: string;
  state: "scheduled" | "overdue" | "missing" | "invalid";
}

function formatNextDose(
  iso: string | undefined,
  now: Date,
  timeZone = DEFAULT_TIME_ZONE,
): NextDoseDisplay {
  if (!iso) return { day: "Not scheduled", dateTime: "", state: "missing" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    return { day: "Unavailable", dateTime: "", state: "invalid" };
  if (date.getTime() < now.getTime()) {
    return { day: "Schedule needs attention", dateTime: "", state: "overdue" };
  }
  const day = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    weekday: "long",
    timeZone,
  }).format(date);
  const datePart = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
  const time = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  return { day, dateTime: `${datePart} · ${time}`, state: "scheduled" };
}

function formatDateTime(
  date: Date,
  now: Date,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  const sameDay = dayKey(date) === dayKey(now);
  const isYesterday = dayKey(date) === dayKey(new Date(now.getTime() - 86_400_000));
  const dateLabel = sameDay
    ? "Today"
    : isYesterday
      ? "Yesterday"
      : new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        day: "numeric",
        month: "short",
        timeZone,
      }).format(date);
  const time = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  return `${dateLabel} · ${time}`;
}

/* ===================================================================== */
/* 3. Prototype logic — replaceable, NOT clinically validated             */
/* ===================================================================== */

/**
 * PROTOTYPE / DEMO LOGIC — NOT CLINICALLY VALIDATED PK GUIDANCE.
 * Describes recorded schedule context only; never a measured factor level.
 */
function getCoverStatus(
  treatment: TreatmentStatus | null,
  activity: ActivityStatus,
  now: Date,
): CoverStatus {
  if (!treatment || !treatment.lastDoseAt) {
    return {
      state: "unavailable",
      source: "unavailable",
      supportingText: "Not enough treatment information",
    };
  }
  if (activity.hasLoggedBleed) {
    return {
      state: "needsReview",
      displayValue: "Review context",
      source: "scheduleEstimate",
      supportingText: "Recent bleed recorded",
    };
  }
  const nextDose = treatment.nextDoseAt ? new Date(treatment.nextDoseAt) : null;
  if (nextDose && !Number.isNaN(nextDose.getTime()) && nextDose.getTime() < now.getTime()) {
    return {
      state: "needsReview",
      displayValue: "Needs review",
      source: "scheduleEstimate",
      supportingText: "Recorded schedule needs attention",
    };
  }
  if (typeof treatment.estimatedProtectionDays !== "number") {
    return {
      state: "unavailable",
      source: "unavailable",
      supportingText: "Schedule estimate unavailable",
    };
  }
  return {
    state: treatment.dose === "covered" ? "estimated" : "approaching",
    displayValue:
      treatment.estimatedProtectionDays >= 1
        ? `${treatment.estimatedProtectionDays} days`
        : `${Math.round(treatment.estimatedProtectionDays * 24)} hours`,
    source: "scheduleEstimate",
    supportingText: "Schedule estimate",
  };
}

type ActivitySafetyStatus = "protected" | "transitioning" | "caution";

interface ActivitySafetyResult {
  hoursSinceLastDose: number;
  /** 0–100, position of the marker on the cover bar. */
  position: number;
  status: ActivitySafetyStatus;
  title: string;
  guidance: string;
}

/**
 * PROTOTYPE / DEMO LOGIC — rough "where am I in my recorded interval"
 * position from elapsed time + half-life, purely to give the UI a bounded
 * visual range. Replace the body only; ActivityCard must not change.
 */
function getActivitySafety(input: {
  treatment: Pick<TreatmentStatus, "lastDoseAt" | "factorHalfLifeHours"> | null;
  activity: ActivityStatus;
  now: Date;
}): ActivitySafetyResult {
  const { treatment, activity, now } = input;
  if (!treatment?.lastDoseAt) {
    return {
      hoursSinceLastDose: 0,
      position: 0,
      status: "caution",
      title: "Not enough information yet",
      guidance: "Add your treatment information to show timing context here.",
    };
  }
  const elapsedMs = now.getTime() - new Date(treatment.lastDoseAt).getTime();
  const hoursSinceLastDose = Math.max(0, Math.round(elapsedMs / 3_600_000));
  const halfLife = treatment.factorHalfLifeHours > 0 ? treatment.factorHalfLifeHours : 24;
  /** Two half-lives bounds the visual range of demo data. */
  const position = Math.min(
    100,
    Math.max(0, (hoursSinceLastDose / halfLife / 2) * 100),
  );

  if (activity.hasLoggedBleed) {
    return {
      hoursSinceLastDose,
      position: Math.max(position, 78),
      status: "caution",
      title: "Recent bleed recorded",
      guidance: "A recent bleed may affect your activity plans.",
    };
  }
  if (position < 50) {
    return {
      hoursSinceLastDose,
      position,
      status: "protected",
      title: "Earlier in your recorded treatment interval",
      guidance:
        "Individual protection can vary. Follow your personal care plan and check with your care team if you're unsure.",
    };
  }
  if (position < 75) {
    return {
      hoursSinceLastDose,
      position,
      status: "transitioning",
      title: "Later in your recorded treatment interval",
      guidance:
        "Individual protection can vary. Follow your personal care plan and check with your care team if you're unsure.",
    };
  }
  return {
    hoursSinceLastDose,
    position,
    status: "caution",
    title: "Your recorded schedule needs attention",
    guidance:
      "Follow your personal care plan and check with your care team if you're unsure what to do.",
  };
}

/* ===================================================================== */
/* 4. Kaki — mascot state mapping (presentation only, retunable)          */
/* ===================================================================== */

interface KakiPalette {
  body: string;
  blush: string;
  ink: string;
}

/** Warm coral -> softer dusty pink -> muted mauve. Never red. */
const KAKI_PALETTE: Record<DoseState, KakiPalette> = {
  covered: { body: "#FF7B93", blush: "#FF4766", ink: "#2D3748" },
  low: { body: "#DFA2B0", blush: "#C87F92", ink: "#3B3A46" },
  veryLow: { body: "#B78D9E", blush: "#9C7488", ink: "#463F49" },
};

/** Bob duration per state — calmer as protection tapers. */
const KAKI_BOB_DURATION: Record<DoseState, string> = {
  covered: "5s",
  low: "7.5s",
  veryLow: "11s",
};

type SceneStatusId = "recentBleed" | "doseOverdue" | "doseApproaching" | "onTrack";

const SCENE_STATUS_LABEL: Record<SceneStatusId, string> = {
  recentBleed: "Recent bleed logged",
  doseOverdue: "Check your dose",
  doseApproaching: "Dose coming up",
  onTrack: "On track",
};

const SCENE_STATUS_TONE: Record<SceneStatusId, StatusTone> = {
  onTrack: "protected",
  doseApproaching: "transitioning",
  doseOverdue: "caution",
  recentBleed: "caution",
};

const DOSE_SEVERITY: Record<DoseState, 0 | 1 | 2> = { covered: 0, low: 1, veryLow: 2 };

/** Priority model, highest first. Replaceable in one place. */
function resolveSceneStatus(ctx: {
  dose: DoseState;
  hasRecentBleed?: boolean | undefined;
}): SceneStatusId {
  if (ctx.hasRecentBleed === true) return "recentBleed";
  if (DOSE_SEVERITY[ctx.dose] >= 2) return "doseOverdue";
  if (DOSE_SEVERITY[ctx.dose] === 1) return "doseApproaching";
  return "onTrack";
}

/* ===================================================================== */
/* 5. Kaki drawing (Platelet / PlateletBody)                              */
/* ===================================================================== */

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

function KakiFace({ state, palette }: { state: DoseState; palette: KakiPalette }) {
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
function PlateletBody({ state, palette }: { state: DoseState; palette?: KakiPalette }) {
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

/* ===================================================================== */
/* 6. FactorScene — the homely hero scene                                 */
/* ===================================================================== */

const ROOM = {
  wallTop: "#FDF4DE",
  wallBottom: "#EADFCF",
  floor: "#DCCBB7",
  wood: "#9D826F",
  plant: "#849B82",
  light: "#FFF3D0",
  text: "#433229",
};

interface FactorSceneProps {
  dose: DoseState;
  hasRecentBleed?: boolean;
  sceneStatus?: SceneStatusId;
  onKakiTap?: () => void;
  expanded?: boolean;
  controlsId?: string;
  className?: string;
}

/** Kaki-focused, inventory-free scene. All clinical context arrives via props. */
function FactorScene({
  dose,
  hasRecentBleed,
  sceneStatus,
  onKakiTap,
  expanded,
  controlsId,
  className,
}: FactorSceneProps) {
  const uid = useId();
  const wallId = `wall-${uid}`;
  const lightId = `light-${uid}`;
  const status = sceneStatus ?? resolveSceneStatus({ dose, hasRecentBleed });
  const [tapped, setTapped] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleTap = () => {
    window.clearTimeout(timer.current);
    setTapped(true);
    timer.current = window.setTimeout(() => setTapped(false), 600);
    onKakiTap?.();
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <svg viewBox="0 0 600 390" className="block h-auto w-full" aria-hidden="true">
        <defs>
          <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ROOM.wallTop} />
            <stop offset="100%" stopColor={ROOM.wallBottom} />
          </linearGradient>
          <radialGradient id={lightId} cx="0.4" cy="0.45" r="0.6">
            <stop offset="0%" stopColor={ROOM.light} stopOpacity="0.9" />
            <stop offset="100%" stopColor={ROOM.light} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="390" fill={`url(#${wallId})`} />
        <rect y="286" width="600" height="104" fill={ROOM.floor} />
        <rect y="284" width="600" height="4" fill={ROOM.wood} opacity="0.14" />

        {/* Window */}
        <g opacity="0.5">
          <rect
            x="48" y="48" width="112" height="126" rx="10"
            fill={ROOM.light} stroke={ROOM.wood} strokeWidth="4"
          />
          <line x1="104" y1="48" x2="104" y2="174" stroke={ROOM.wood} strokeWidth="3" opacity="0.45" />
          <line x1="48" y1="111" x2="160" y2="111" stroke={ROOM.wood} strokeWidth="3" opacity="0.45" />
        </g>
        <ellipse cx="240" cy="214" rx="230" ry="165" fill={`url(#${lightId})`} />

        {/* Plant */}
        <g>
          <path d="M 519 288 L 526 242 Q 549 251 539 288 Z" fill={ROOM.plant} />
          <path d="M 526 268 Q 499 245 494 260 Q 506 282 527 280 Z" fill={ROOM.plant} />
          <path d="M 529 259 Q 554 237 564 250 Q 554 274 531 276 Z" fill={ROOM.plant} opacity="0.82" />
          <path
            d="M 505 288 h 48 l -7 36 a 6 6 0 0 1 -6 5 h -22 a 6 6 0 0 1 -6 -5 Z"
            fill={ROOM.wood}
          />
        </g>

        {/* Shadow + Kaki */}
        <ellipse cx="310" cy="335" rx="98" ry="15" fill={ROOM.wood} opacity="0.25" />
        <g transform="translate(163 76) scale(1.48)">
          <g
            className={cn("animate-platelet-bob", tapped && "animate-kaki-pop")}
            style={tapped ? undefined : { animationDuration: KAKI_BOB_DURATION[dose] }}
          >
            <PlateletBody state={dose} />
          </g>
        </g>
      </svg>

      {/* Single most relevant status — one pill, never competing badges. */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-sm",
            SURFACE_RAISED + "/90",
          )}
          style={{ color: ROOM.text }}
        >
          <span
            className={cn("h-2 w-2 rounded-full", STATUS_TONE_CLASSES[SCENE_STATUS_TONE[status]].dot)}
            aria-hidden="true"
          />
          {SCENE_STATUS_LABEL[status]}
        </span>
      </div>

      <button
        type="button"
        onClick={handleTap}
        aria-label={`Kaki: ${SCENE_STATUS_LABEL[status]}. Show why Kaki looks this way.`}
        aria-expanded={expanded}
        aria-controls={controlsId}
        className="absolute left-[24%] top-[21%] h-[67%] w-[55%] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      />
      <p className="sr-only">Kaki reflects recorded treatment context, not a measured factor level.</p>
    </div>
  );
}

/* ===================================================================== */
/* 7. Shared UI bits (minimal, dependency-free)                           */
/* ===================================================================== */

function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function OutlineButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-stone-700">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const INPUT_CLASS =
  "min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500";

/* ===================================================================== */
/* 8. Home sections                                                       */
/* ===================================================================== */

function HomeHeader({
  user,
  now,
  lastUpdatedAt,
  onOpenProfile,
}: {
  user: HomeUser;
  now: Date;
  lastUpdatedAt?: string;
  onOpenProfile: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className={cn("break-words text-[26px] font-bold leading-tight", INK)}>
          Good {getDayPeriod(now).toLowerCase()}, {user.firstName}
        </h1>
        <p className={cn("mt-1 text-sm font-medium", INK_MUTED)}>{formatDate(now)}</p>
        {lastUpdatedAt ? (
          <p className={cn("mt-1 text-xs", INK_MUTED)}>
            Last updated {formatDate(new Date(lastUpdatedAt))}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label="Open profile"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-stone-600 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <CircleUserRound className="h-6 w-6" aria-hidden="true" />
      </button>
    </header>
  );
}

function TreatmentStats({
  treatmentStatus,
  cover,
  now,
}: {
  treatmentStatus: TreatmentStatus | null;
  cover: CoverStatus;
  now: Date;
}) {
  const nextDose = formatNextDose(treatmentStatus?.nextDoseAt, now);
  const coverTone =
    cover.state === "estimated"
      ? STATUS_TONE_CLASSES.protected.soft
      : cover.state === "approaching"
        ? STATUS_TONE_CLASSES.transitioning.soft
        : STATUS_TONE_CLASSES.caution.soft;
  return (
    <div className="grid grid-cols-2 divide-x divide-black/10 px-3 py-4">
      <div className="min-w-0 px-2">
        <div className="flex items-center gap-2">
          <span
            className={cn("flex h-7 w-7 items-center justify-center rounded-full", coverTone)}
            aria-hidden="true"
          >
            <ShieldCheck className="h-4 w-4" />
          </span>
          <p className={cn("text-xs font-semibold", INK_MUTED)}>Cover</p>
        </div>
        <p className={cn("mt-2 break-words text-lg font-bold", INK)}>
          {cover.displayValue ?? "Unavailable"}
        </p>
        <p className={cn("mt-0.5 text-xs", INK_MUTED)}>{cover.supportingText}</p>
      </div>
      <div className="min-w-0 px-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700"
            aria-hidden="true"
          >
            <Clock3 className="h-4 w-4" />
          </span>
          <p className={cn("text-xs font-semibold", INK_MUTED)}>Next dose</p>
        </div>
        <p className={cn("mt-2 break-words text-base font-bold leading-tight", INK)}>
          {nextDose.day}
        </p>
        {nextDose.dateTime ? (
          <p className={cn("mt-1 text-sm font-semibold", INK_MUTED)}>{nextDose.dateTime}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Short, state-aware answer to "why does Kaki look like this?" — derived from
 * the SAME cover/activity state driving the rest of Home. No numeric details,
 * no action buttons: those live in TreatmentStats and DoseActionPanel instead.
 */
function KakiExplanation({
  activityStatus,
  cover,
}: {
  activityStatus: ActivityStatus;
  cover: CoverStatus;
}) {
  const text = activityStatus.hasLoggedBleed
    ? "A recent bleed has been recorded."
    : cover.state === "needsReview"
      ? "Your recorded treatment schedule needs attention."
      : cover.state === "approaching"
        ? "Your next recorded dose is coming up."
        : "Your recorded treatment schedule is on track.";

  return (
    <>
      <p className={cn("mt-2 text-sm", INK_MUTED)}>{text}</p>
      <p className={cn("mt-3 text-xs leading-5", INK_MUTED)}>
        Cover is based on your recorded treatment schedule and is not a measured factor level.
      </p>
    </>
  );
}

function TreatmentHero({
  treatmentStatus,
  activityStatus,
  now,
  actions,
}: {
  treatmentStatus: TreatmentStatus | null;
  activityStatus: ActivityStatus;
  now: Date;
  actions: HomeActions;
}) {
  const [expanded, setExpanded] = useState(false);
  const disclosureId = useId();
  const cover = getCoverStatus(treatmentStatus, activityStatus, now);
  const visualDose = activityStatus.hasLoggedBleed ? "veryLow" : (treatmentStatus?.dose ?? "low");

  if (!treatmentStatus) {
    return (
      <section
        aria-labelledby="treatment-setup-title"
        className={cn("mt-5 border-y border-black/10 p-5", SURFACE_RAISED)}
      >
        <h2 id="treatment-setup-title" className={cn("text-lg font-bold", INK)}>
          Treatment information isn't set up yet.
        </h2>
        <p className={cn("mt-2 text-sm", INK_MUTED)}>
          Add your treatment details before Home shows schedule context.
        </p>
        <PrimaryButton className="mt-4" onClick={() => actions.onNavigate("treatmentSetup")}>
          Set up treatment
        </PrimaryButton>
      </section>
    );
  }

  return (
    <section
      aria-label="Treatment context"
      className={cn("mt-5 overflow-hidden rounded-2xl border border-black/10", SURFACE_RAISED)}
    >
      <FactorScene
        dose={visualDose}
        {...(activityStatus.hasLoggedBleed !== undefined
          ? { hasRecentBleed: activityStatus.hasLoggedBleed }
          : {})}
        onKakiTap={() => setExpanded((value) => !value)}
        expanded={expanded}
        controlsId={disclosureId}
      />
      <div
        id={disclosureId}
        hidden={!expanded}
        className="border-t border-black/10 bg-brand-50/50 px-5 py-4"
      >
        <h2 className={cn("font-bold", INK)}>Why does Kaki look like this?</h2>
        <KakiExplanation activityStatus={activityStatus} cover={cover} />
      </div>
      <TreatmentStats treatmentStatus={treatmentStatus} cover={cover} now={now} />
      <DoseActionPanel treatmentStatus={treatmentStatus} now={now} actions={actions} />
    </section>
  );
}

function ActivityCard({
  treatmentStatus,
  activityStatus,
  now,
  onOpen,
}: {
  treatmentStatus: TreatmentStatus | null;
  activityStatus: ActivityStatus;
  now: Date;
  onOpen: () => void;
}) {
  const result = getActivitySafety({ treatment: treatmentStatus, activity: activityStatus, now });
  const tone = STATUS_TONE_CLASSES[result.status];
  return (
    <section
      aria-labelledby="activity-title"
      className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 w-full items-center justify-start gap-3 rounded-lg p-0 text-left"
      >
        <span
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tone.soft)}
          aria-hidden="true"
        >
          <PersonStanding className="h-5 w-5" />
        </span>
        <span>
          <span id="activity-title" className={cn("block text-lg font-bold", INK)}>
            Activity
          </span>
          <span className={cn("block whitespace-normal text-sm font-normal", INK_MUTED)}>
            {activityStatus.hasLoggedBleed
              ? result.title
              : `${result.hoursSinceLastDose}h since your last recorded dose`}
          </span>
        </span>
      </button>
      {!activityStatus.hasLoggedBleed && treatmentStatus?.lastDoseAt ? (
        <div className="mt-4" aria-label="Position within recorded treatment interval">
          <div className="relative h-2 rounded-full bg-black/10">
            <span
              className={cn("absolute left-0 top-0 h-2 rounded-full", tone.solid)}
              style={{ width: `${result.position}%` }}
            />
            <span
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm",
                tone.solid,
              )}
              style={{ left: `${result.position}%` }}
            />
          </div>
          <div className={cn("mt-2 flex justify-between text-[11px] font-medium", INK_MUTED)}>
            <span>Earlier in interval</span>
            <span>Later in interval</span>
          </div>
        </div>
      ) : null}
      <p className={cn("mt-4 text-sm leading-6", INK_MUTED)}>{result.guidance}</p>
      {activityStatus.hasLoggedBleed ? (
        <button
          type="button"
          className="mt-1 min-h-11 px-0 text-sm font-semibold text-brand-700 underline-offset-2 hover:underline"
          onClick={onOpen}
        >
          View bleed information
        </button>
      ) : null}
      <p className={cn("mt-2 text-xs leading-5", INK_MUTED)}>
        Treatment timing only — not a measured factor concentration.
      </p>
    </section>
  );
}

function DailyTip({ tip }: { tip: DailyTipData }) {
  return (
    <section aria-labelledby="daily-tip-title" className="mt-5 flex gap-3 border-t border-black/10 px-1 py-5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
        aria-hidden="true"
      >
        <Lightbulb className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className={cn("text-xs font-semibold uppercase tracking-wide", INK_MUTED)}>Daily tip</p>
        <h2 id="daily-tip-title" className={cn("mt-1 text-base font-bold tracking-[-0.01em]", INK)}>
          {tip.title}
        </h2>
        <p className={cn("mt-1 text-sm leading-6", INK_MUTED)}>{tip.body}</p>
        {tip.sourceLabel ? (
          <p className={cn("mt-2 text-xs", INK_MUTED)}>
            Source: {tip.sourceLabel}
            {tip.clinicalReviewStatus === "pending" ? " · Clinical review pending" : ""}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* 9. Low-friction dose workflow                                          */
/*                                                                      */
/* Lightweight bottom sheet so this file stays dependency-free. If the   */
/* team repo has a shared accessible Sheet/Dialog primitive, swap this   */
/* for it — the props below are the whole contract.                      */
/* ===================================================================== */

function BottomSheet({
  open,
  onClose,
  title,
  description,
  returnFocusRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  returnFocusRef?: RefObject<HTMLButtonElement>;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button, input, textarea")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef?.current?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-black/10 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={cn("text-lg font-bold", INK)}>{title}</h2>
            <p className={cn("mt-1 text-sm", INK_MUTED)}>{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-stone-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type SaveState = "idle" | "submitting" | "success" | "failure";

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Handles BOTH "Taken" (prospective, defaults to now) and "I took it"
 * (retrospective) — same shape, different heading/default per the product
 * distinction between "not taken" and "taken but not yet recorded."
 * Medication/dose are read from the treatment profile, never re-typed here.
 */
function RecordDoseSheet({
  open,
  mode,
  treatmentStatus,
  now,
  onClose,
  onConfirm,
}: {
  open: boolean;
  mode: "taken" | "retrospective";
  treatmentStatus: TreatmentStatus;
  now: Date;
  onClose: () => void;
  onConfirm: HomeActions["onRecordDose"];
}) {
  const [time, setTime] = useState(toLocalInputValue(now));
  const [isDifferentDose, setIsDifferentDose] = useState(false);
  const [doseValue, setDoseValue] = useState("");
  const [doseError, setDoseError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [failureMessage, setFailureMessage] = useState("");

  const usualDose = treatmentStatus.prescribedDose ?? "";
  const usualDoseMatch = usualDose.match(/^\s*([\d,.]+)\s*(.*?)\s*$/);
  const usualDoseValue = usualDoseMatch?.[1].replace(/,/g, "") ?? "";
  const doseUnit = usualDoseMatch?.[2] ?? "";

  useEffect(() => {
    if (open) {
      setTime(toLocalInputValue(now));
      setIsDifferentDose(false);
      setDoseValue(usualDoseValue);
      setDoseError("");
      setSaveState("idle");
      setFailureMessage("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usualDoseValue]);

  const hasMedication = Boolean(treatmentStatus.medicationName);
  const title = "Record dose";

  const submit = async () => {
    if (!hasMedication || saveState === "submitting") return;
    const numericDose = Number(doseValue.replace(/,/g, ""));
    if (isDifferentDose && (!doseValue.trim() || !Number.isFinite(numericDose) || numericDose <= 0)) {
      setDoseError("Enter a sensible positive dose amount.");
      return;
    }
    if (Number.isNaN(new Date(time).getTime())) {
      setFailureMessage("Enter the date and time the dose was taken.");
      setSaveState("failure");
      return;
    }
    setSaveState("submitting");
    const administeredDose = isDifferentDose
      ? `${doseValue.trim()}${doseUnit ? ` ${doseUnit}` : ""}`
      : usualDose || undefined;
    const result = await onConfirm({
      administeredAt: new Date(time).toISOString(),
      ...(administeredDose ? { administeredDose } : {}),
    });
    if (result.ok) setSaveState("success");
    else {
      setFailureMessage(result.message ?? "We couldn't save this entry. Your record has not been updated.");
      setSaveState("failure");
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title} description="Review the details before saving.">
      {saveState === "success" ? (
        <div className="py-8" role="status">
          <p className={cn("text-lg font-bold", INK)}>Dose recorded</p>
          <PrimaryButton className="mt-5 w-full" onClick={onClose}>
            Done
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {hasMedication ? (
            <div>
              <p className={cn("font-semibold", INK)}>{treatmentStatus.medicationName}</p>
              {treatmentStatus.prescribedDose ? (
                <p className={cn("text-sm", INK_MUTED)}>Usual dose: {treatmentStatus.prescribedDose}</p>
              ) : null}
            </div>
          ) : (
            <p className={cn("text-sm", INK_MUTED)}>
              Medication information is unavailable. Check your treatment information before
              recording a dose.
            </p>
          )}
          {isDifferentDose ? (
            <>
              <Field id="dose-administered" label="Dose administered">
                <div className="flex items-center gap-2">
                  <input
                    id="dose-administered"
                    type="text"
                    inputMode="decimal"
                    value={doseValue}
                    onChange={(event) => {
                      setDoseValue(event.target.value);
                      setDoseError("");
                    }}
                    aria-invalid={Boolean(doseError)}
                    aria-describedby={doseError ? "dose-administered-error" : undefined}
                    className={INPUT_CLASS}
                  />
                  {doseUnit ? <span className={cn("shrink-0 text-sm font-semibold", INK_MUTED)}>{doseUnit}</span> : null}
                </div>
              </Field>
              {doseError ? <p id="dose-administered-error" role="alert" className="-mt-3 text-sm font-medium text-rose-700">{doseError}</p> : null}
              <button
                type="button"
                className="min-h-11 text-sm font-semibold text-brand-700"
                onClick={() => {
                  setIsDifferentDose(false);
                  setDoseError("");
                  setDoseValue(usualDoseValue);
                }}
              >
                Use usual dose instead
              </button>
            </>
          ) : (
            <button
              type="button"
              className="min-h-11 text-sm font-semibold text-brand-700"
              onClick={() => setIsDifferentDose(true)}
            >
              Different dose?
            </button>
          )}
          <Field id="dose-record-time" label="Taken">
            <input
              id="dose-record-time"
              type="datetime-local"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          {mode === "taken" ? <p className={cn("text-xs", INK_MUTED)}>{formatDateTime(new Date(time), now)}</p> : null}
          {saveState === "failure" ? (
            <p role="alert" className={cn("text-sm font-medium", INK)}>
              {failureMessage}
            </p>
          ) : null}
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={onClose}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              className="flex-1"
              disabled={!hasMedication || saveState === "submitting"}
              onClick={submit}
            >
              {saveState === "submitting" ? "Saving…" : saveState === "failure" ? "Try again" : "Confirm"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

/** "Change time" / "Update schedule" — one scheduling UI, two entry points. */
function RescheduleSheet({
  open,
  currentScheduledAt,
  now,
  onClose,
  onConfirm,
}: {
  open: boolean;
  currentScheduledAt?: string;
  now: Date;
  onClose: () => void;
  onConfirm: HomeActions["onRescheduleDose"];
}) {
  const initialTime = () => toLocalInputValue(currentScheduledAt ? new Date(currentScheduledAt) : now);
  const [time, setTime] = useState(initialTime);
  const [scope, setScope] = useState<RescheduleDosePayload["scope"]>("thisDose");

  useEffect(() => {
    if (open) {
      setTime(initialTime());
      setScope("thisDose");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentScheduledAt]);

  const confirm = () => {
    onConfirm({ newScheduledAt: new Date(time).toISOString(), scope });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Change time" description="Update your scheduled dose time.">
      <div className="mt-5 space-y-5">
        <Field id="reschedule-time" label="New time">
          <input
            id="reschedule-time"
            type="datetime-local"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <fieldset>
          <legend className={cn("text-sm font-semibold", INK)}>Change</legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="reschedule-scope"
                checked={scope === "thisDose"}
                onChange={() => setScope("thisDose")}
              />
              This dose only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="reschedule-scope"
                checked={scope === "futureSchedule"}
                onChange={() => setScope("futureSchedule")}
              />
              Future schedule
            </label>
          </div>
        </fieldset>
        <div className="flex gap-3">
          <OutlineButton className="flex-1" onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className="flex-1" onClick={confirm}>
            Confirm
          </PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

function getDoseActionState(nextDoseAt: string | undefined, now: Date): "upcoming" | "needsAttention" | null {
  if (!nextDoseAt) return null;
  const date = new Date(nextDoseAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime() < now.getTime() ? "needsAttention" : "upcoming";
}

/**
 * The one new permanent-ish area on Home — except it isn't permanent: it only
 * renders when there's something worth doing right now, and stays out of the
 * way otherwise. No streaks, no missed-dose counters, no guilt language.
 */
function DoseActionPanel({
  treatmentStatus,
  now,
  actions,
}: {
  treatmentStatus: TreatmentStatus;
  now: Date;
  actions: HomeActions;
}) {
  const [recordMode, setRecordMode] = useState<"taken" | "retrospective" | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  const state = getDoseActionState(treatmentStatus.nextDoseAt, now);
  if (!state) return null;
  if (state === "needsAttention" && dismissedFor === treatmentStatus.nextDoseAt) return null;

  return (
    <div className="border-t border-black/10 px-5 py-4">
      {state === "upcoming" ? (
        <>
          <div className="flex gap-3">
            <PrimaryButton className="flex-1" onClick={() => setRecordMode("taken")}>
              Taken
            </PrimaryButton>
            <OutlineButton className="flex-1" onClick={() => setRescheduleOpen(true)}>
              Change time
            </OutlineButton>
          </div>
        </>
      ) : (
        <>
          <p className={cn("text-sm font-semibold", INK)}>Dose record needs attention</p>
          <div className="mt-3 flex gap-3">
            <PrimaryButton className="flex-1" onClick={() => setRecordMode("retrospective")}>
              I took it
            </PrimaryButton>
            <OutlineButton className="flex-1" onClick={() => setRescheduleOpen(true)}>
              Update schedule
            </OutlineButton>
          </div>
          <button
            type="button"
            className="mt-2 min-h-11 text-sm font-semibold text-brand-700"
            onClick={() => {
              setDismissedFor(treatmentStatus.nextDoseAt ?? null);
              actions.onRemindLater?.();
            }}
          >
            Remind me later
          </button>
        </>
      )}

      <RecordDoseSheet
        open={recordMode !== null}
        mode={recordMode ?? "taken"}
        treatmentStatus={treatmentStatus}
        now={now}
        onClose={() => setRecordMode(null)}
        onConfirm={actions.onRecordDose}
      />
      <RescheduleSheet
        open={rescheduleOpen}
        {...(treatmentStatus.nextDoseAt ? { currentScheduledAt: treatmentStatus.nextDoseAt } : {})}
        now={now}
        onClose={() => setRescheduleOpen(false)}
        onConfirm={actions.onRescheduleDose}
      />
    </div>
  );
}

/* ===================================================================== */
/* 11. HomePage — pure presentation composition                           */
/* ===================================================================== */

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading Home">
      <div className="h-16 rounded bg-black/5" />
      <div className="h-80 rounded-2xl bg-black/5" />
      <div className="h-24 rounded-2xl bg-black/5" />
      <div className="h-20 rounded bg-black/5" />
    </div>
  );
}

export function HomePage({ data, actions, now = new Date(), isLoading = false }: HomePageProps) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-7 sm:px-5">
      <HomeStyles />
      {isLoading ? (
        <HomeSkeleton />
      ) : (
        <>
          <HomeHeader
            user={data.user}
            now={now}
            {...(data.lastUpdatedAt ? { lastUpdatedAt: data.lastUpdatedAt } : {})}
            onOpenProfile={() => actions.onNavigate("profile")}
          />
          <TreatmentHero
            treatmentStatus={data.treatmentStatus}
            activityStatus={data.activityStatus}
            now={now}
            actions={actions}
          />
          <ActivityCard
            treatmentStatus={data.treatmentStatus}
            activityStatus={data.activityStatus}
            now={now}
            onOpen={actions.onOpenActivity}
          />
          <DailyTip tip={data.dailyTip} />
        </>
      )}
    </main>
  );
}

/* ===================================================================== */
/* 12. Mock data (replace by swapping the caller, not the components)     */
/* ===================================================================== */

const HOUR = 3_600_000;

export function createHomeMockData(now: Date = new Date()): HomeDashboardData {
  const t = now.getTime();
  const iso = (offsetHours: number) => new Date(t + offsetHours * HOUR).toISOString();
  return {
    user: { firstName: "Sam" },
    treatmentStatus: {
      dose: "covered",
      lastDoseAt: iso(-18),
      nextDoseAt: iso(30),
      factorHalfLifeHours: 24,
      estimatedProtectionDays: 2.5,
      medicationName: "Factor VIII",
      prescribedDose: "2,000 IU",
    },
    activityStatus: { hasLoggedBleed: false },
    dailyTip: {
      id: "tip-rotate-sites",
      title: "Keep your records current",
      body: "Recording changes when they happen can make your next care conversation easier.",
      sourceLabel: "HaemKakis demo content",
      clinicalReviewStatus: "pending",
    },
  };
}

/* ===================================================================== */
/* 13. HomeScreen — standalone adapter (mock data + local state)          */
/*                                                                      */
/* This is the ONLY place mock data and mutations live. When the team's  */
/* backend/state lands, re-implement these callbacks and delete the      */
/* mock; <HomePage /> and every component above stay unchanged.          */
/* ===================================================================== */

export function HomeScreen({ now }: { now?: Date }) {
  const { data, now: contextNow, isLoading, administerDose, rescheduleDose } = useHomeData();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const clock = now ?? contextNow;

  const actions: HomeActions = {
    onRecordDose: async (payload) =>
      administerDose({
        medicationName: data.treatmentStatus?.medicationName ?? "",
        administeredAt: payload.administeredAt,
        ...(payload.administeredDose ? { administeredDose: payload.administeredDose } : {}),
      }),
    onRescheduleDose: ({ newScheduledAt }) => rescheduleDose(newScheduledAt),
    onRemindLater: () => undefined,
    onOpenActivity: () => navigate("/tracker"),
    onNavigate: (route) => {
      if (route === "profile") setProfileOpen(true);
      else if (route === "tracker" || route === "activity") navigate("/tracker");
      else if (route === "resources") navigate("/tips");
    },
  };

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800">
      <HomePage data={data} actions={actions} now={clock} isLoading={isLoading} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default HomeScreen;
