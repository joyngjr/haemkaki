/**
 * HaemKakis — Home screen (consolidated single-file build)
 * =========================================================
 *
 * This file is the whole Home feature flattened into one module so it can be
 * pasted into the shared team repository as `Home.tsx`.
 *
 * Dependencies: react, lucide-react. Nothing else.
 * Tailwind: uses the team's existing brand-* palette plus standard utilities.
 * Status colours are defined as literal classes in STATUS_TONE_CLASSES below
 * (green / amber / deep rose) — swap them for team tokens when they exist.
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
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Droplet,
  History,
  House,
  Lightbulb,
  Package,
  PackageOpen,
  PackagePlus,
  PersonStanding,
  Plus,
  ShieldCheck,
  Syringe,
  X,
  type LucideIcon,
} from "lucide-react";

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
   * NOT inventory coverage — Inventory may separately expose
   * estimatedDosesRemaining / estimatedSupplyDays.
   */
  estimatedProtectionDays?: number;
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
  lastBleedAt?: string;
  recentBleedLocation?: string;
}

export type StockState = "wellStocked" | "moderate" | "low";

export interface MedicationStock {
  label: string;
  remaining: number;
  unit: string;
  state: StockState;
  estimatedDosesRemaining?: number;
  estimatedSupplyDays?: number;
}

export interface SupplyItem {
  id: string;
  label: string;
  remaining: number;
  unit: string;
}

export type LogEntryType = "dose" | "bleed" | "stock";

export interface LogEntry {
  id: string;
  type: LogEntryType;
  title: string;
  detail?: string;
  /** ISO timestamp. */
  occurredAt: string;
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

export type DataLoadState = "loading" | "loaded" | "empty" | "unavailable";

export interface HomeDashboardData {
  user: HomeUser;
  treatmentStatus: TreatmentStatus | null;
  activityStatus: ActivityStatus;
  medicationStock: MedicationStock;
  supplyStock: SupplyItem[];
  recentLogs: LogEntry[];
  dailyTip: DailyTipData;
  inventoryState?: DataLoadState;
  recentActivityState?: DataLoadState;
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
  | "inventory"
  | "activity"
  | "carePlan"
  | "bleedRecord"
  | "treatmentSetup";

export type AppNavigationKey = "home" | "tracker" | "resources" | "profile";

export interface AdministerDosePayload {
  medicationName: string;
  dose?: string;
  administeredAt: string;
}

export interface LogBleedPayload {
  occurredAt: string;
  bodyLocation: string;
  note?: string;
}

export type SaveResult = { ok: true } | { ok: false; message?: string };

/** Every side effect Home can trigger. The host app implements these. */
export interface HomeActions {
  onAdministerDose: (payload: AdministerDosePayload) => Promise<SaveResult>;
  onLogStock: () => void;
  onLogBleed: (payload: LogBleedPayload) => Promise<SaveResult>;
  onNavigate: (route: HomeRouteKey) => void;
  onOpenActivity: () => void;
  onViewMedicationStock: () => void;
  onViewSupplies: () => void;
  onViewInventory: () => void;
  onOpenLogEntry: (id: string, type: LogEntryType) => void;
  onRetryInventory?: () => void;
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

function formatRelativeTime(date: Date, now: Date): string {
  const diffHours = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 3_600_000),
  );
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
  }).format(date);
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

/** Stock derivation — replaceable by the Inventory owner's real model. */
const STOCK_THRESHOLDS = { moderate: 5, low: 3 } as const;

function deriveStockState(vialsOnHand: number): StockState {
  if (vialsOnHand <= STOCK_THRESHOLDS.low) return "low";
  if (vialsOnHand < STOCK_THRESHOLDS.moderate) return "moderate";
  return "wellStocked";
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

const KAKI_LABELS: Record<DoseState, string> = {
  covered: "Kaki looking cheerful — protection on track",
  low: "Kaki looking calm — protection tapering",
  veryLow: "Kaki looking attentive — dose needs attention",
};

/** Standalone Kaki for use outside the scene (nav button, list rows). */
function Platelet({ state, className }: { state: DoseState; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={KAKI_LABELS[state]}
      className={cn("h-auto w-full", className)}
    >
      <PlateletBody state={state} />
    </svg>
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

function GhostRow({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-auto w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-brand-50/60",
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
}: {
  user: HomeUser;
  now: Date;
  lastUpdatedAt?: string;
}) {
  return (
    <header>
      <p className={cn("text-sm font-medium", INK_MUTED)}>{formatDate(now)}</p>
      <h1 className={cn("mt-1 break-words text-[26px] font-bold leading-tight", INK)}>
        Good {getDayPeriod(now).toLowerCase()}, {user.firstName}
      </h1>
      {lastUpdatedAt ? (
        <p className={cn("mt-1 text-xs", INK_MUTED)}>
          Last updated {formatDate(new Date(lastUpdatedAt))}
        </p>
      ) : null}
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
  const nextDose = formatNextDose(treatmentStatus?.nextDoseAt, now);

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
        {activityStatus.hasLoggedBleed ? (
          <>
            <p className={cn("mt-2 text-sm", INK_MUTED)}>You recently recorded a bleed.</p>
            {activityStatus.recentBleedLocation && activityStatus.lastBleedAt ? (
              <p className={cn("mt-2 text-sm font-medium", INK)}>
                {activityStatus.recentBleedLocation} ·{" "}
                {formatRelativeTime(new Date(activityStatus.lastBleedAt), now)}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <OutlineButton onClick={() => actions.onNavigate("bleedRecord")}>
                View bleed record
              </OutlineButton>
              <OutlineButton onClick={() => actions.onNavigate("carePlan")}>
                View my care plan
              </OutlineButton>
            </div>
          </>
        ) : cover.state === "needsReview" ? (
          <>
            <p className={cn("mt-2 text-sm", INK_MUTED)}>Your recorded schedule needs attention.</p>
            <p className={cn("mt-2 text-sm", INK_MUTED)}>
              Follow your personal treatment plan. Contact your care team if you're unsure what to
              do.
            </p>
          </>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p className={INK_MUTED}>Your recorded treatment schedule is on track.</p>
            <p>
              <span className="font-semibold">Cover</span>
              <br />
              {cover.displayValue} · {cover.supportingText.toLowerCase()}
            </p>
            <p>
              <span className="font-semibold">Next dose</span>
              <br />
              {nextDose.day}
              {nextDose.dateTime ? `, ${nextDose.dateTime}` : ""}
            </p>
            <p>
              <span className="font-semibold">Last recorded dose</span>
              <br />
              {treatmentStatus.lastDoseAt
                ? formatRelativeTime(new Date(treatmentStatus.lastDoseAt), now)
                : "Not recorded"}
            </p>
          </div>
        )}
        <p className={cn("mt-4 text-xs leading-5", INK_MUTED)}>
          Cover is based on your recorded treatment schedule and is not a measured factor level.
        </p>
      </div>
      <TreatmentStats treatmentStatus={treatmentStatus} cover={cover} now={now} />
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

function InventorySummaryCard({
  medicationStock,
  supplyStock,
  state = "loaded",
  onViewMedicationStock,
  onViewSupplies,
  onLogStock,
  onViewInventory,
  onRetry,
}: {
  medicationStock: MedicationStock;
  supplyStock: SupplyItem[];
  state?: DataLoadState;
  onViewMedicationStock: () => void;
  onViewSupplies: () => void;
  onLogStock: () => void;
  onViewInventory: () => void;
  onRetry?: () => void;
}) {
  return (
    <section
      aria-labelledby="inventory-title"
      className={cn("mt-5 rounded-2xl border border-black/10 p-5 shadow-sm", SURFACE_RAISED)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="inventory-title" className={cn("flex items-center gap-2 text-lg font-bold", INK)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <Package className="h-4 w-4" aria-hidden="true" />
          </span>
          Inventory
        </h2>
        <button
          type="button"
          className="flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-brand-700"
          onClick={onViewInventory}
        >
          View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="py-4">
          <p className={cn("text-sm", INK_MUTED)}>Stock information unavailable.</p>
          {onRetry ? (
            <OutlineButton className="mt-3" onClick={onRetry}>
              Try again
            </OutlineButton>
          ) : null}
        </div>
      ) : state === "loading" ? (
        <div className="space-y-3 py-4" aria-label="Loading inventory">
          <div className="h-12 animate-pulse rounded bg-black/5" />
          <div className="h-12 animate-pulse rounded bg-black/5" />
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <GhostRow className="min-h-16" onClick={onViewMedicationStock}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Syringe className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate font-semibold", INK)}>{medicationStock.label}</span>
              <span className={cn("block text-sm font-normal", INK_MUTED)}>
                {medicationStock.remaining} {medicationStock.unit}
                {medicationStock.estimatedDosesRemaining !== undefined
                  ? ` · ~${medicationStock.estimatedDosesRemaining} scheduled doses`
                  : ""}
              </span>
            </span>
            <ChevronRight className={INK_MUTED} aria-hidden="true" />
          </GhostRow>
          <GhostRow className="min-h-16" onClick={onViewSupplies}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <PackageOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block font-semibold", INK)}>Treatment supplies</span>
              <span className={cn("block truncate text-sm font-normal", INK_MUTED)}>
                {supplyStock.length
                  ? supplyStock
                    .slice(0, 2)
                    .map((item) => `${item.label} ${item.remaining}`)
                    .join(" · ")
                  : "No supplies recorded"}
              </span>
            </span>
            <ChevronRight className={INK_MUTED} aria-hidden="true" />
          </GhostRow>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          className="flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700"
          onClick={onLogStock}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Log new stock
        </button>
      </div>
    </section>
  );
}

const LOG_ICONS: Record<LogEntryType, LucideIcon> = {
  dose: Syringe,
  bleed: Droplet,
  stock: PackagePlus,
};

function RecentLogCard({
  entries,
  now,
  state = "loaded",
  onSeeAll,
  onOpenEntry,
  onQuickLog,
}: {
  entries: LogEntry[];
  now: Date;
  state?: DataLoadState;
  onSeeAll: () => void;
  onOpenEntry: (id: string, type: LogEntryType) => void;
  onQuickLog?: () => void;
}) {
  const iconTone: Record<LogEntryType, string> = {
    dose: "bg-brand-100 text-brand-700",
    bleed: STATUS_TONE_CLASSES.caution.soft,
    stock: "bg-brand-100 text-brand-700",
  };
  return (
    <section
      aria-labelledby="recent-title"
      className={cn("mt-5 rounded-2xl border border-black/10 p-5 shadow-sm", SURFACE_RAISED)}
    >
      <div className="flex items-center justify-between">
        <h2 id="recent-title" className={cn("flex items-center gap-2 text-lg font-bold", INK)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <History className="h-4 w-4" aria-hidden="true" />
          </span>
          Recent activity
        </h2>
        <button
          type="button"
          className="flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-brand-700"
          onClick={onSeeAll}
        >
          See all <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {state === "loading" ? (
        <div className="mt-3 h-32 animate-pulse rounded-xl bg-black/5" aria-label="Loading recent activity" />
      ) : state === "unavailable" ? (
        <p className={cn("mt-3 text-sm", INK_MUTED)}>Recent activity is unavailable.</p>
      ) : entries.length === 0 ? (
        <div className="mt-3">
          <p className={cn("text-sm", INK_MUTED)}>Nothing recorded yet.</p>
          {onQuickLog ? (
            <OutlineButton className="mt-3" onClick={onQuickLog}>
              Quick log
            </OutlineButton>
          ) : null}
        </div>
      ) : (
        <ol className="mt-3 space-y-2">
          {entries.slice(0, 3).map((entry) => {
            const Icon = LOG_ICONS[entry.type];
            return (
              <li key={entry.id}>
                <GhostRow className="min-h-[72px]" onClick={() => onOpenEntry(entry.id, entry.type)}>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      iconTone[entry.type],
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate font-semibold", INK)}>{entry.title}</span>
                    {entry.detail ? (
                      <span className={cn("block truncate text-sm font-normal", INK_MUTED)}>
                        {entry.detail}
                      </span>
                    ) : null}
                    <time dateTime={entry.occurredAt} className={cn("block text-xs font-normal", INK_MUTED)}>
                      {formatDateTime(new Date(entry.occurredAt), now)}
                    </time>
                  </span>
                  <ChevronRight className={INK_MUTED} aria-hidden="true" />
                </GhostRow>
              </li>
            );
          })}
        </ol>
      )}
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
/* 9. Quick Log sheet                                                     */
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

type QuickLogFlow = "menu" | "dose" | "bleed";
type SaveState = "idle" | "submitting" | "success" | "failure";

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function QuickLogSheet({
  open,
  onOpenChange,
  treatment,
  now,
  onAdministerDose,
  onLogBleed,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: TreatmentStatus | null;
  now: Date;
  onAdministerDose: HomeActions["onAdministerDose"];
  onLogBleed: HomeActions["onLogBleed"];
  returnFocusRef?: RefObject<HTMLButtonElement>;
}) {
  const [flow, setFlow] = useState<QuickLogFlow>("menu");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [failureMessage, setFailureMessage] = useState("");
  const [doseTime, setDoseTime] = useState(toLocalInputValue(now));
  const [bleedTime, setBleedTime] = useState(toLocalInputValue(now));
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) {
      setFlow("menu");
      setSaveState("idle");
      setFailureMessage("");
    }
  }, [open]);

  const close = () => onOpenChange(false);

  const submitDose = async () => {
    if (!treatment?.medicationName || saveState === "submitting") return;
    setSaveState("submitting");
    const payload: AdministerDosePayload = {
      medicationName: treatment.medicationName,
      administeredAt: new Date(doseTime).toISOString(),
    };
    if (treatment.prescribedDose) payload.dose = treatment.prescribedDose;
    const result = await onAdministerDose(payload);
    if (result.ok) setSaveState("success");
    else {
      setFailureMessage(result.message ?? "We couldn't save this entry. Your record has not been updated.");
      setSaveState("failure");
    }
  };

  const submitBleed = async () => {
    if (saveState === "submitting") return;
    setSaveState("submitting");
    const payload: LogBleedPayload = {
      occurredAt: new Date(bleedTime).toISOString(),
      bodyLocation: location.trim(),
    };
    if (note.trim()) payload.note = note.trim();
    const result = await onLogBleed(payload);
    if (result.ok) setSaveState("success");
    else {
      setFailureMessage(result.message ?? "We couldn't save this entry. Your record has not been updated.");
      setSaveState("failure");
    }
  };

  const title =
    flow === "menu" ? "Quick log" : flow === "dose" ? "Record dose" : "Record a bleed";

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={title}
      description={flow === "menu" ? "Choose what you want to record." : "Review the details before saving."}
      {...(returnFocusRef ? { returnFocusRef } : {})}
    >
      {saveState === "success" ? (
        <div className="py-8" role="status">
          <p className={cn("text-lg font-bold", INK)}>
            {flow === "dose" ? "Dose recorded" : "Bleed recorded"}
          </p>
          <PrimaryButton className="mt-5 w-full" onClick={close}>
            Done
          </PrimaryButton>
        </div>
      ) : flow === "menu" ? (
        <div className="mt-5 divide-y divide-black/10">
          <GhostRow className="min-h-16 rounded-none px-1 py-4" onClick={() => setFlow("dose")}>
            <Syringe className="h-5 w-5 text-brand-700" aria-hidden="true" />
            <span>
              <span className={cn("block font-semibold", INK)}>Administer dose now</span>
              <span className={cn("block whitespace-normal text-sm font-normal", INK_MUTED)}>
                Record your prophylactic dose.
              </span>
            </span>
          </GhostRow>
          <GhostRow className="min-h-16 rounded-none px-1 py-4" onClick={() => setFlow("bleed")}>
            <Droplet className={cn("h-5 w-5", STATUS_TONE_CLASSES.caution.soft.split(" ")[1])} aria-hidden="true" />
            <span>
              <span className={cn("block font-semibold", INK)}>Had a bleed</span>
              <span className={cn("block whitespace-normal text-sm font-normal", INK_MUTED)}>
                Record a bleed event.
              </span>
            </span>
          </GhostRow>
        </div>
      ) : flow === "dose" ? (
        <div className="mt-5 space-y-5">
          {treatment?.medicationName ? (
            <div>
              <p className={cn("font-semibold", INK)}>{treatment.medicationName}</p>
              {treatment.prescribedDose ? (
                <p className={cn("text-sm", INK_MUTED)}>{treatment.prescribedDose}</p>
              ) : null}
            </div>
          ) : (
            <p className={cn("text-sm", INK_MUTED)}>
              Medication information is unavailable. Check your treatment information before
              recording a dose.
            </p>
          )}
          <Field id="dose-time" label="Taken">
            <input
              id="dose-time"
              type="datetime-local"
              value={doseTime}
              onChange={(event) => setDoseTime(event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <p className={cn("text-xs", INK_MUTED)}>{formatDateTime(new Date(doseTime), now)}</p>
          {saveState === "failure" ? (
            <p role="alert" className={cn("text-sm font-medium", INK)}>
              {failureMessage}
            </p>
          ) : null}
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={() => setFlow("menu")}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              className="flex-1"
              disabled={!treatment?.medicationName || saveState === "submitting"}
              onClick={submitDose}
            >
              {saveState === "submitting" ? "Saving…" : saveState === "failure" ? "Try again" : "Confirm dose"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <Field id="bleed-time" label="Date and time">
            <input
              id="bleed-time"
              type="datetime-local"
              value={bleedTime}
              onChange={(event) => setBleedTime(event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bleed-location" label="Body location">
            <input
              id="bleed-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Enter the location"
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bleed-note" label="Note (optional)">
            <textarea
              id="bleed-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={cn(INPUT_CLASS, "min-h-24")}
            />
          </Field>
          {saveState === "failure" ? (
            <p role="alert" className={cn("text-sm font-medium", INK)}>
              {failureMessage}
            </p>
          ) : null}
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={() => setFlow("menu")}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              className="flex-1"
              disabled={!location.trim() || saveState === "submitting"}
              onClick={submitBleed}
            >
              {saveState === "submitting" ? "Saving…" : saveState === "failure" ? "Try again" : "Confirm bleed"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

/* ===================================================================== */
/* 10. Bottom navigation (shared-candidate; independent of Home data)     */
/* ===================================================================== */

interface NavItem {
  key: AppNavigationKey;
  label: string;
  icon: LucideIcon;
}

const NAV_LEFT: NavItem[] = [
  { key: "home", label: "Home", icon: House },
  { key: "tracker", label: "Tracker", icon: CalendarDays },
];

const NAV_RIGHT: NavItem[] = [
  { key: "resources", label: "Resources", icon: BookOpen },
  { key: "profile", label: "Profile", icon: CircleUserRound },
];

function NavButton({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: (route: AppNavigationKey) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.key)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px]",
        active ? "font-semibold text-brand-700" : INK_MUTED,
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}

export function BottomNavigation({
  activeRoute,
  onNavigate,
  onOpenActions,
  actionsButtonRef,
}: {
  activeRoute: AppNavigationKey;
  onNavigate: (route: AppNavigationKey) => void;
  onOpenActions: () => void;
  actionsButtonRef?: RefObject<HTMLButtonElement>;
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <div className="mx-auto grid h-[72px] max-w-md grid-cols-5 items-end px-1">
        {NAV_LEFT.map((item) => (
          <NavButton key={item.key} item={item} active={activeRoute === item.key} onNavigate={onNavigate} />
        ))}
        <div className="relative flex h-[72px] items-end justify-center">
          <span className="pointer-events-none absolute -top-9 text-[11px] font-bold text-brand-700">
            Quick log
          </span>
          <button


            type="button"
            onClick={onOpenActions}
            aria-label="Open Quick Log actions"
            className="relative flex h-[72px] w-full flex-col items-center gap-0.5 px-0 text-[11px] font-semibold text-brand-700"
          >
            <span className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-brand-50 shadow-[0_6px_16px_rgba(41,38,43,0.16)]">
              <Platelet state="covered" className="h-16 w-16" />
            </span>
            <span className="mt-auto pb-1">Actions</span>
          </button>
        </div>
        {NAV_RIGHT.map((item) => (
          <NavButton key={item.key} item={item} active={activeRoute === item.key} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
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
      <div className="h-44 rounded-2xl bg-black/5" />
      <div className="h-40 rounded bg-black/5" />
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
          <InventorySummaryCard
            medicationStock={data.medicationStock}
            supplyStock={data.supplyStock}
            {...(data.inventoryState ? { state: data.inventoryState } : {})}
            onViewMedicationStock={actions.onViewMedicationStock}
            onViewSupplies={actions.onViewSupplies}
            onLogStock={actions.onLogStock}
            onViewInventory={actions.onViewInventory}
            {...(actions.onRetryInventory ? { onRetry: actions.onRetryInventory } : {})}
          />
          <RecentLogCard
            entries={data.recentLogs}
            now={now}
            {...(data.recentActivityState ? { state: data.recentActivityState } : {})}
            onSeeAll={() => actions.onNavigate("tracker")}
            onOpenEntry={actions.onOpenLogEntry}
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
    medicationStock: {
      label: "Factor VIII",
      remaining: 6,
      unit: "vials",
      state: "wellStocked",
      estimatedDosesRemaining: 3,
    },
    supplyStock: [
      { id: "syringes", label: "Syringes", remaining: 12, unit: "left" },
      { id: "saline", label: "Normal saline", remaining: 8, unit: "ampoules" },
      { id: "swabs", label: "Alcohol swabs", remaining: 24, unit: "left" },
    ],
    recentLogs: [
      { id: "log-1", type: "dose", title: "Prophylactic dose", detail: "2,000 IU", occurredAt: iso(-18) },
      { id: "log-2", type: "bleed", title: "Bleed recorded", occurredAt: iso(-62) },
      { id: "log-3", type: "stock", title: "Factor stock added", detail: "+6 vials", occurredAt: iso(-160) },
    ],
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
  const clock = useMemo(() => now ?? new Date(), [now]);
  const [data, setData] = useState<HomeDashboardData>(() => createHomeMockData(clock));
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<AppNavigationKey>("home");
  const [announcement, setAnnouncement] = useState("");
  const actionsButtonRef = useRef<HTMLButtonElement | null>(null);

  /** REPLACE: connect these intents to the team's router. */
  const announceIntent = (label: string) =>
    setAnnouncement(`${label} integration is awaiting the application shell.`);

  /** REPLACE: persist to the team's backend instead of mutating mock state. */
  const onAdministerDose = async (payload: AdministerDosePayload): Promise<SaveResult> => {
    setData((current) => {
      if (!current.treatmentStatus) return current;
      const remaining = Math.max(0, current.medicationStock.remaining - 1);
      const nextDoseAt = new Date(
        new Date(payload.administeredAt).getTime() + 48 * HOUR,
      ).toISOString();
      return {
        ...current,
        lastUpdatedAt: payload.administeredAt,
        treatmentStatus: {
          ...current.treatmentStatus,
          dose: "covered",
          lastDoseAt: payload.administeredAt,
          nextDoseAt,
          estimatedProtectionDays: 2.5,
        },
        activityStatus: { hasLoggedBleed: false },
        medicationStock: {
          ...current.medicationStock,
          remaining,
          state: deriveStockState(remaining),
          estimatedDosesRemaining: Math.floor(remaining / 2),
        },
        recentLogs: [
          {
            id: `dose-${Date.now()}`,
            type: "dose",
            title: "Prophylactic dose",
            ...(payload.dose ? { detail: payload.dose } : {}),
            occurredAt: payload.administeredAt,
          },
          ...current.recentLogs,
        ],
      };
    });
    return { ok: true };
  };

  /** REPLACE: persist to the team's backend instead of mutating mock state. */
  const onLogBleed = async (payload: LogBleedPayload): Promise<SaveResult> => {
    setData((current) => ({
      ...current,
      lastUpdatedAt: payload.occurredAt,
      activityStatus: {
        hasLoggedBleed: true,
        lastBleedAt: payload.occurredAt,
        recentBleedLocation: payload.bodyLocation,
      },
      recentLogs: [
        {
          id: `bleed-${Date.now()}`,
          type: "bleed",
          title: `${payload.bodyLocation} bleed`,
          ...(payload.note ? { detail: payload.note } : {}),
          occurredAt: payload.occurredAt,
        },
        ...current.recentLogs,
      ],
    }));
    return { ok: true };
  };

  const actions: HomeActions = useMemo(
    () => ({
      onAdministerDose,
      onLogBleed,
      onLogStock: () => announceIntent("Log new stock"),
      onNavigate: (route) => announceIntent(route),
      onOpenActivity: () => announceIntent("Activity"),
      onViewMedicationStock: () => announceIntent("Medication stock"),
      onViewSupplies: () => announceIntent("Treatment supplies"),
      onViewInventory: () => announceIntent("Inventory"),
      onOpenLogEntry: (_id: string, type: LogEntryType) => announceIntent(`${type} record`),
      onRetryInventory: () => announceIntent("Inventory retry"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const navigate = (route: AppNavigationKey) => {
    setActiveRoute(route);
    announceIntent(route);
  };

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800">
      <HomePage data={data} actions={actions} now={clock} />
      <BottomNavigation
        activeRoute={activeRoute}
        onNavigate={navigate}
        onOpenActions={() => setQuickLogOpen(true)}
        actionsButtonRef={actionsButtonRef}
      />
      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        treatment={data.treatmentStatus}
        now={clock}
        onAdministerDose={onAdministerDose}
        onLogBleed={onLogBleed}
        returnFocusRef={actionsButtonRef}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}


export default HomeScreen;
