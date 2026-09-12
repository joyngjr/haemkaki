/**
 * HaemKakis — Home.
 *
 * The screen is one file on purpose: the hero, the cards and the heuristics
 * behind them are tuned against each other, and splitting them made every copy
 * change a three-file edit. What genuinely belongs elsewhere already lives
 * elsewhere — the mascot in `@/components/platelet/Kaki`, the data contracts
 * and demo data in `@/lib/home-data`, the Quick Log sheet in
 * `@/components/quick-log`, the tab bar in `@/components/nav/BottomNav`.
 *
 * CLINICAL BOUNDARY: the cover estimate and activity timing below are PROTOTYPE
 * heuristics over recorded schedule timing only. They are not measured factor
 * levels and not clinically validated. Both are isolated in `getCoverStatus`
 * and `getActivitySafety`.
 *
 * `HomePage` is pure presentation — give it `HomeDashboardData` + `HomeActions`
 * and it never touches state, storage or the router. `Home` is the adapter that
 * reads `useHomeData()` and turns Home's route intents into real navigation.
 */

import { useId, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Clock3,
  Droplet,
  History,
  Lightbulb,
  Package,
  PackageOpen,
  PackagePlus,
  PersonStanding,
  Plus,
  ShieldCheck,
  Syringe,
  type LucideIcon,
} from "lucide-react";

import { KAKI_BOB_DURATION, KakiBody } from "@/components/platelet/Kaki";
import { DOSE_SEVERITY, ROOM_PALETTE, roomSeverity } from "@/components/platelet/room-palette";
import { GhostRow, OutlineButton } from "@/components/ui/form";
import {
  formatDate,
  formatDateTime,
  formatNextDose,
  formatRelativeTime,
  getDayPeriod,
} from "@/lib/home-format";
import type {
  ActivityStatus,
  CoverStatus,
  DataLoadState,
  DailyTipData,
  DoseState,
  StockState,
  HomeActions,
  HomePageProps,
  HomeRouteKey,
  HomeUser,
  LogEntry,
  LogEntryType,
  MedicationStock,
  SupplyItem,
  TreatmentStatus,
} from "@/lib/home-data";
import { INK, INK_MUTED, STATUS_TONE_CLASSES, SURFACE_RAISED, type StatusTone } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useHomeData } from "@/state/home-context";

/* ===================================================================== */
/* Clinical heuristics — PROTOTYPE, isolated so validated logic can       */
/* replace them without touching a component.                            */
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
/* Scene status — which single pill the hero shows                        */
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
/* FactorScene — the homely hero scene                                    */
/* ===================================================================== */

interface FactorSceneProps {
  dose: DoseState;
  /** Vials at home. Tints the room alongside `dose`; never changes Kaki. */
  stock: StockState;
  hasRecentBleed?: boolean;
  sceneStatus?: SceneStatusId;
  onKakiTap?: () => void;
  expanded?: boolean;
  controlsId?: string;
  className?: string;
}

/**
 * Kaki-focused scene. Nothing here loads an image: the character is drawn from
 * `KAKI_PALETTE[dose]` and the room from `ROOM_PALETTE[severity]`, so both
 * follow the `dose_state` / `stock_state` the API returned for this profile.
 */
function FactorScene({
  dose,
  stock,
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
  const ROOM = ROOM_PALETTE[roomSeverity(dose, stock)];
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
        className="absolute left-[24%] top-[21%] h-[67%] w-[55%] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 focus-visible:ring-offset-2"
      />
      <p className="sr-only">
        Kaki reflects recorded treatment context, not a measured factor level.
      </p>
    </div>
  );
}

/* ===================================================================== */
/* Home sections                                                          */
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
    <div className="grid grid-cols-2 divide-x divide-sand-200 px-3 py-4">
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
            className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-200 text-sand-700"
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
  stock,
  now,
  actions,
}: {
  treatmentStatus: TreatmentStatus | null;
  activityStatus: ActivityStatus;
  /** Shelf level from the profile — tints the room, never Kaki. */
  stock: StockState;
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
        className={cn("mt-5 border-y border-sand-200 p-5", SURFACE_RAISED)}
      >
        <h2 id="treatment-setup-title" className={cn("text-lg font-bold", INK)}>
          Treatment information isn't set up yet.
        </h2>
        <p className={cn("mt-2 text-sm", INK_MUTED)}>
          Add your treatment details before Home shows schedule context.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Treatment context"
      className={cn("mt-5 overflow-hidden rounded-3xl border border-sand-200", SURFACE_RAISED)}
    >
      <FactorScene
        dose={visualDose}
        stock={stock}
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
        className="border-t border-sand-200 bg-sand-100/70 px-5 py-4"
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
      className="mt-4 rounded-3xl border border-sand-200 bg-sand-100/70 p-5"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 w-full items-center justify-start gap-3 rounded-2xl p-0 text-left"
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
          <div className="relative h-2 rounded-full bg-sand-200">
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
          className="mt-1 min-h-11 px-0 text-sm font-semibold text-sand-700 underline-offset-2 hover:underline"
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
      className={cn("mt-5 rounded-3xl border border-sand-200 p-5 shadow-sm", SURFACE_RAISED)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="inventory-title" className={cn("flex items-center gap-2 text-lg font-bold", INK)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand-200 text-sand-700">
            <Package className="h-4 w-4" aria-hidden="true" />
          </span>
          Inventory
        </h2>
        <button
          type="button"
          className="flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-sand-700"
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
          <div className="h-12 animate-pulse rounded bg-sand-200/70" />
          <div className="h-12 animate-pulse rounded bg-sand-200/70" />
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <GhostRow className="min-h-16" onClick={onViewMedicationStock}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-700">
              <Syringe className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate font-semibold", INK)}>
                {medicationStock.label}
              </span>
              <span className={cn("block text-sm font-normal", INK_MUTED)}>
                {medicationStock.remaining} {medicationStock.unit}
                {medicationStock.estimatedSupplyDays !== undefined
                  ? ` · ~${medicationStock.estimatedSupplyDays} days cover`
                  : medicationStock.estimatedDosesRemaining !== undefined
                    ? ` · ~${medicationStock.estimatedDosesRemaining} scheduled doses`
                    : ""}
              </span>
            </span>
            <ChevronRight className={INK_MUTED} aria-hidden="true" />
          </GhostRow>
          <GhostRow className="min-h-16" onClick={onViewSupplies}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-700">
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
          className="flex min-h-11 items-center gap-1 text-sm font-semibold text-sand-700"
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
    dose: "bg-sand-200 text-sand-700",
    bleed: STATUS_TONE_CLASSES.caution.soft,
    stock: "bg-sand-200 text-sand-700",
  };
  return (
    <section
      aria-labelledby="recent-title"
      className={cn("mt-5 rounded-3xl border border-sand-200 p-5 shadow-sm", SURFACE_RAISED)}
    >
      <div className="flex items-center justify-between">
        <h2 id="recent-title" className={cn("flex items-center gap-2 text-lg font-bold", INK)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand-200 text-sand-700">
            <History className="h-4 w-4" aria-hidden="true" />
          </span>
          Recent activity
        </h2>
        <button
          type="button"
          className="flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-sand-700"
          onClick={onSeeAll}
        >
          See all <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {state === "loading" ? (
        <div
          className="mt-3 h-32 animate-pulse rounded-2xl bg-sand-200/70"
          aria-label="Loading recent activity"
        />
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
                <GhostRow
                  className="min-h-[72px]"
                  onClick={() => onOpenEntry(entry.id, entry.type)}
                >
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
                    <time
                      dateTime={entry.occurredAt}
                      className={cn("block text-xs font-normal", INK_MUTED)}
                    >
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
    <section
      aria-labelledby="daily-tip-title"
      className="mt-5 flex gap-3 border-t border-sand-200 px-1 py-5"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-700"
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
/* HomePage — pure presentation composition                               */
/* ===================================================================== */

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading Home">
      <div className="h-16 rounded bg-sand-200/70" />
      <div className="h-80 rounded-3xl bg-sand-200/70" />
      <div className="h-44 rounded-3xl bg-sand-200/70" />
      <div className="h-40 rounded bg-sand-200/70" />
    </div>
  );
}

function HomePage({ data, actions, now = new Date(), isLoading = false }: HomePageProps) {
  return (
    <div className="px-4 pt-7 sm:px-5">
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
            stock={data.medicationStock.state}
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
    </div>
  );
}

/* ===================================================================== */
/* Home — the adapter between HomePage's intents and the app's router     */
/* ===================================================================== */

/**
 * Where each of Home's route intents actually goes today.
 *
 * Inventory, activity and bleed records all live on the tracker: the supply
 * card and the calendar are the pages that hold them. The map is total, so a
 * new key does not compile until it has somewhere to go.
 */
const ROUTE_PATHS: Record<HomeRouteKey, string> = {
  tracker: "/tracker",
  inventory: "/tracker",
  activity: "/tracker",
  bleedRecord: "/tracker",
};

export function Home() {
  const { data, now, isLoading, administerDose, logBleed } = useHomeData();
  const navigate = useNavigate();

  const actions = useMemo<HomeActions>(() => {
    const go = (route: HomeRouteKey) => navigate(ROUTE_PATHS[route]);
    return {
      onAdministerDose: administerDose,
      onLogBleed: logBleed,
      onNavigate: go,
      onLogStock: () => go("inventory"),
      onOpenActivity: () => go("activity"),
      onViewMedicationStock: () => go("inventory"),
      onViewSupplies: () => go("inventory"),
      onViewInventory: () => go("inventory"),
      onOpenLogEntry: () => go("tracker"),
    };
  }, [administerDose, logBleed, navigate]);

  return <HomePage data={data} actions={actions} now={now} isLoading={isLoading} />;
}
