/**
 * HaemKakis — Home screen
 * =======================
 *
 * This pass implements the team's final Home scope + the low-friction dose
 * workflow from patient survey feedback:
 *  - REMOVED: Inventory card, Recent Activity card, Quick Log, centre Actions
 *    button. Not replaced with new permanent cards.
 *  - Bottom navigation: exactly Home / Tracker / Resources.
 *  - Profile moved to the header (top-right), via the shared `ProfileButton`
 *    that Tracker and `PageHeader` also carry — the switcher is no longer in
 *    the tab bar, so every top-level header has to offer it.
 *  - Kaki's tap panel is now a short, state-aware explanation only — no
 *    numeric details, no action buttons.
 *  - New: a contextual dose-action area (Taken / Change time / I took it /
 *    Update schedule / Remind me later) that only appears when relevant.
 *
 * CLINICAL BOUNDARY: the cover estimate and activity timing logic in this file
 * are PROTOTYPE / DEMO heuristics based on recorded schedule timing only.
 * They are not measured factor levels, not pharmacokinetic guidance, and not
 * clinically validated. They are isolated in `getCoverStatus` and
 * `getActivitySafety` so clinically validated logic can replace them without
 * touching any component.
 *
 * INTEGRATION BOUNDARY:
 *  - <HomeScreen /> (default export) adapts the shared `HomeDataProvider`
 *    state to <HomePage />'s props. It is the only place routing lives.
 *  - <HomePage /> is pure presentation: give it `HomeDashboardData` +
 *    `HomeActions` and it never touches state, storage, or a router.
 *  - `onRescheduleDose` moves the NEXT dose only. There is no recurring
 *    schedule in `HomeDataProvider` to edit — Tracker owns the routine — so
 *    Home does not offer to change one.
 *  - `activityStatus.hasLoggedBleed` drives the "recent bleed" states below,
 *    but nothing sets it any more: Tracker keeps its own bleed ledger and the
 *    two are not connected yet. Those branches stay unreachable until they are.
 */

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { Clock3, Lightbulb, PersonStanding, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { KAKI_BOB_DURATION, KakiBody } from "@/components/platelet/Kaki";
import { ProfileButton } from "@/components/profile/ProfileButton";
import { formatDate, formatDateTime, formatNextDose, getDayPeriod } from "@/lib/home-format";
import { INK, INK_MUTED, STATUS_TONE_CLASSES, SURFACE_RAISED, type StatusTone } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type {
  ActivityStatus,
  CoverStatus,
  DailyTipData,
  DoseState,
  HomeDashboardData,
  HomeUser,
  SaveResult,
  TreatmentStatus,
} from "@/lib/home-data";
import { useHomeData } from "@/state/home-context";

/* ===================================================================== */
/* 1. Data contracts                                                      */
/* ===================================================================== */

/**
 * Logical destinations Home can request. Home never knows URLs — reconcile
 * these keys with the team's router in one place.
 */
export interface RecordDosePayload {
  /** ISO timestamp of the actual administration time (prospective or retrospective). */
  administeredAt: string;
  /** Amount actually administered for this event; this never changes the usual regimen. */
  administeredDose?: string;
}

export interface RescheduleDosePayload {
  /** ISO timestamp of the new scheduled time. */
  newScheduledAt: string;
}

/** Every side effect Home can trigger. The host app implements these. */
export interface HomeActions {
  /** Handles both the "Taken" (prospective) and "I took it" (retrospective) flows. */
  onRecordDose: (payload: RecordDosePayload) => Promise<SaveResult>;
  /** Moves the next scheduled dose. There is no recurring-schedule model to edit yet. */
  onRescheduleDose: (payload: RescheduleDosePayload) => void;
  /** Optional: hook into real notification infra. Home always defers the prompt locally either way. */
  onRemindLater?: () => void;
  onOpenActivity: () => void;
  onOpenTreatmentSetup: () => void;
}

export interface HomePageProps {
  data: HomeDashboardData;
  actions: HomeActions;
  /** Injectable clock so relative times are deterministic in demos/tests. */
  now?: Date;
  isLoading?: boolean;
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
  const position = Math.min(100, Math.max(0, (hoursSinceLastDose / halfLife / 2) * 100));

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
            x="48"
            y="48"
            width="112"
            height="126"
            rx="10"
            fill={ROOM.light}
            stroke={ROOM.wood}
            strokeWidth="4"
          />
          <line
            x1="104"
            y1="48"
            x2="104"
            y2="174"
            stroke={ROOM.wood}
            strokeWidth="3"
            opacity="0.45"
          />
          <line
            x1="48"
            y1="111"
            x2="160"
            y2="111"
            stroke={ROOM.wood}
            strokeWidth="3"
            opacity="0.45"
          />
        </g>
        <ellipse cx="240" cy="214" rx="230" ry="165" fill={`url(#${lightId})`} />

        {/* Plant */}
        <g>
          <path d="M 519 288 L 526 242 Q 549 251 539 288 Z" fill={ROOM.plant} />
          <path d="M 526 268 Q 499 245 494 260 Q 506 282 527 280 Z" fill={ROOM.plant} />
          <path
            d="M 529 259 Q 554 237 564 250 Q 554 274 531 276 Z"
            fill={ROOM.plant}
            opacity="0.82"
          />
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
            <KakiBody state={dose} />
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
            className={cn(
              "h-2 w-2 rounded-full",
              STATUS_TONE_CLASSES[SCENE_STATUS_TONE[status]].dot,
            )}
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
      <p className="sr-only">
        Kaki reflects recorded treatment context, not a measured factor level.
      </p>
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

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
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
      <ProfileButton />
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
        <PrimaryButton className="mt-4" onClick={actions.onOpenTreatmentSetup}>
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
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            tone.soft,
          )}
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
    <section
      aria-labelledby="daily-tip-title"
      className="mt-5 flex gap-3 border-t border-black/10 px-1 py-5"
    >
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
    // Captured now: by cleanup time the ref may already point elsewhere, and
    // focus has to return to the control that opened the sheet.
    const opener = returnFocusRef?.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />
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
  mode,
  treatmentStatus,
  now,
  onClose,
  onConfirm,
}: {
  mode: "taken" | "retrospective";
  treatmentStatus: TreatmentStatus;
  now: Date;
  onClose: () => void;
  onConfirm: HomeActions["onRecordDose"];
}) {
  const usualDose = treatmentStatus.prescribedDose ?? "";
  const usualDoseMatch = usualDose.match(/^\s*([\d,.]+)\s*(.*?)\s*$/);
  const usualDoseValue = usualDoseMatch?.[1].replace(/,/g, "") ?? "";
  const doseUnit = usualDoseMatch?.[2] ?? "";

  const [time, setTime] = useState(() => toLocalInputValue(now));
  const [isDifferentDose, setIsDifferentDose] = useState(false);
  const [doseValue, setDoseValue] = useState(usualDoseValue);
  const [doseError, setDoseError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [failureMessage, setFailureMessage] = useState("");

  const hasMedication = Boolean(treatmentStatus.medicationName);
  const title = "Record dose";

  const submit = async () => {
    if (!hasMedication || saveState === "submitting") return;
    const numericDose = Number(doseValue.replace(/,/g, ""));
    if (
      isDifferentDose &&
      (!doseValue.trim() || !Number.isFinite(numericDose) || numericDose <= 0)
    ) {
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
      setFailureMessage(
        result.message ?? "We couldn't save this entry. Your record has not been updated.",
      );
      setSaveState("failure");
    }
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={title}
      description="Review the details before saving."
    >
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
                <p className={cn("text-sm", INK_MUTED)}>
                  Usual dose: {treatmentStatus.prescribedDose}
                </p>
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
                  {doseUnit ? (
                    <span className={cn("shrink-0 text-sm font-semibold", INK_MUTED)}>
                      {doseUnit}
                    </span>
                  ) : null}
                </div>
              </Field>
              {doseError ? (
                <p
                  id="dose-administered-error"
                  role="alert"
                  className="-mt-3 text-sm font-medium text-rose-700"
                >
                  {doseError}
                </p>
              ) : null}
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
          {mode === "taken" ? (
            <p className={cn("text-xs", INK_MUTED)}>{formatDateTime(new Date(time), now)}</p>
          ) : null}
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
              {saveState === "submitting"
                ? "Saving…"
                : saveState === "failure"
                  ? "Try again"
                  : "Confirm"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

/** "Change time" / "Update schedule" — one scheduling UI, two entry points. */
function RescheduleSheet({
  currentScheduledAt,
  now,
  onClose,
  onConfirm,
}: {
  currentScheduledAt?: string;
  now: Date;
  onClose: () => void;
  onConfirm: HomeActions["onRescheduleDose"];
}) {
  const [time, setTime] = useState(() =>
    toLocalInputValue(currentScheduledAt ? new Date(currentScheduledAt) : now),
  );

  const confirm = () => {
    onConfirm({ newScheduledAt: new Date(time).toISOString() });
    onClose();
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Change time"
      description="Move your next scheduled dose."
    >
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
        {/* This moves the next dose only. Changing the recurring routine lives
            on Tracker, which is the screen that owns the schedule. */}
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

function getDoseActionState(
  nextDoseAt: string | undefined,
  now: Date,
): "upcoming" | "needsAttention" | null {
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

      {recordMode !== null ? (
        <RecordDoseSheet
          mode={recordMode}
          treatmentStatus={treatmentStatus}
          now={now}
          onClose={() => setRecordMode(null)}
          onConfirm={actions.onRecordDose}
        />
      ) : null}
      {rescheduleOpen ? (
        <RescheduleSheet
          {...(treatmentStatus.nextDoseAt
            ? { currentScheduledAt: treatmentStatus.nextDoseAt }
            : {})}
          now={now}
          onClose={() => setRescheduleOpen(false)}
          onConfirm={actions.onRescheduleDose}
        />
      ) : null}
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
    <div className="px-4 pt-7 sm:px-1">
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
          <DailyTip tip={data.dailyTip} />
        </>
      )}
    </div>
  );
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
    onOpenTreatmentSetup: () => navigate("/tracker"),
  };

  return <HomePage data={data} actions={actions} now={clock} isLoading={isLoading} />;
}

export default HomeScreen;
