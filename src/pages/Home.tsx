/**
 * HaemKakis — Home
 * ================
 *
 * The status card and the last few entries. On a phone this is the Home tab;
 * from `lg` the same status card heads the one-page layout in `Dashboard.tsx`,
 * beside the tracker's cards.
 *
 * The card answers the two questions its scene draws: is the schedule on time
 * (Kaki and his shield, the cover figure, the meter), and is there factor at
 * home (the room, the vials figure). When the cupboard runs low or empty the
 * card says so itself — in its status word, its vials figure and an order
 * button — rather than in a banner stacked above it.
 *
 * CLINICAL BOUNDARY: the interval position in this file is a PROTOTYPE / DEMO
 * heuristic based on recorded schedule timing only. It is not a measured
 * factor level, not pharmacokinetic guidance, and not clinically validated.
 * It is isolated in `getIntervalPosition` so clinically validated logic can
 * replace it without touching any component.
 *
 * INTEGRATION BOUNDARY:
 *  - <HomeScreen /> (default export) adapts the shared `HomeDataProvider`
 *    state to <HomePage />'s props. It is the only place routing lives.
 *  - <HomePage /> and <StatusCard /> are presentation: give them
 *    `HomeDashboardData` + `HomeActions` and they never touch shared state,
 *    storage, or a router.
 *  - `onRecordDose` writes a prophylaxis event to the same ledger the tracker
 *    edits, on the Singapore day the user picks. The ledger records days, not
 *    minutes, so the sheet asks for a date and nothing else.
 *  - `onRescheduleDose` moves the NEXT planned dose to another day, as a
 *    calendar exception on the routine — the same thing the tracker does from
 *    a day's sheet. Tracker owns the routine, so Home does not offer to change
 *    the cycle itself.
 *  - `activityStatus.hasLoggedBleed` is an on-demand dose within the last few
 *    days, folded by the API from the tracker's ledger (`last_bleed_on`).
 */

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { coverageFromDose, type Supply as SceneSupply } from "@/components/platelet/scene-state";
import { StatusScene } from "@/components/platelet/StatusScene";
import { ProfileButton } from "@/components/profile/ProfileButton";
import { ProfileSheet } from "@/components/profile/ProfileSheet";
import { Card, CardHeaderRow } from "@/components/ui/Card";
import { CriticalButton, OutlineButton, PrimaryButton } from "@/components/ui/Button";
import { Meter, Stat } from "@/components/ui/Stat";
import { StatusDot } from "@/components/ui/StatusDot";
import {
  daysBetweenKeys,
  formatDayGap,
  formatLongDay,
  formatShortDay,
  getDayPeriod,
  isOverdue,
} from "@/lib/home-format";
import { FOCUS_RING, INK, INK_MUTED } from "@/lib/theme";
import { getSingaporeTodayKey } from "@/lib/tracker-dates";
import { cn } from "@/lib/utils";
import type {
  ActivityStatus,
  DoseState,
  HomeDashboardData,
  HomeUser,
  LedgerEntrySummary,
  SaveResult,
  SupplyStatus,
  TreatmentStatus,
} from "@/lib/home-data";
import { useHomeData } from "@/state/home-context";
import { useProfiles } from "@/state/profile-context";

/* ===================================================================== */
/* 1. Data contracts                                                      */
/* ===================================================================== */

export interface RecordDosePayload {
  /** The Singapore calendar day the dose was taken, as `YYYY-MM-DD`. */
  takenOn: string;
}

export interface RescheduleDosePayload {
  /** The Singapore calendar day the next planned dose should move to, as `YYYY-MM-DD`. */
  movedTo: string;
}

/** Every side effect Home can trigger. The host app implements these. */
export interface HomeActions {
  /** Handles both the "Log dose" (prospective) and "I took it" (retrospective) flows. */
  onRecordDose: (payload: RecordDosePayload) => Promise<SaveResult>;
  /** Moves the next planned dose to another day. The routine's cycle is unchanged. */
  onRescheduleDose: (payload: RescheduleDosePayload) => Promise<SaveResult>;
  /** Optional: hook into real notification infra. Home always defers the prompt locally either way. */
  onRemindLater?: () => void;
  /** "See all" on the recent entries. Omitted where the calendar is already on the page. */
  onOpenActivity?: () => void;
  onOpenTreatmentSetup: () => void;
  /** The tracker's "Factor at home" card, with the order advice. */
  onOpenSupply: () => void;
}

export interface HomePageProps {
  data: HomeDashboardData;
  actions: HomeActions;
  /** Injectable clock so relative times are deterministic in demos. */
  now?: Date;
}

/* ===================================================================== */
/* 2. Prototype logic — replaceable, NOT clinically validated             */
/* ===================================================================== */

interface IntervalPosition {
  hoursSinceLastDose: number;
  /** 0–100, how far through the recorded interval the meter sits. */
  position: number;
}

/**
 * PROTOTYPE / DEMO LOGIC — rough "where am I in my recorded interval"
 * position from elapsed time + half-life, purely to give the meter a bounded
 * visual range. Replace the body only; nothing above reads its internals.
 */
function getIntervalPosition(input: {
  treatment: Pick<TreatmentStatus, "lastDoseAt" | "factorHalfLifeHours"> | null;
  activity: ActivityStatus;
  now: Date;
}): IntervalPosition {
  const { treatment, activity, now } = input;
  if (!treatment?.lastDoseAt) return { hoursSinceLastDose: 0, position: 0 };

  const elapsedMs = now.getTime() - new Date(treatment.lastDoseAt).getTime();
  const hoursSinceLastDose = Math.max(0, Math.round(elapsedMs / 3_600_000));
  const halfLife = treatment.factorHalfLifeHours > 0 ? treatment.factorHalfLifeHours : 24;
  /** Two half-lives bounds the visual range of demo data. */
  const position = Math.min(100, Math.max(0, (hoursSinceLastDose / halfLife / 2) * 100));

  // A recorded bleed pushes the meter well along whatever the clock says.
  return {
    hoursSinceLastDose,
    position: activity.hasLoggedBleed ? Math.max(position, 78) : position,
  };
}

/* ===================================================================== */
/* 3. Status vocabulary — one word for the whole card                     */
/* ===================================================================== */

/** The schedule on its own. It tints the cover figure and the meter. */
type DoseStatus = "recentBleed" | "overdue" | "dueToday" | "onTrack";

/** The cupboard on its own: fine, worth ordering soon, or empty. */
type SupplyNeed = "ok" | "low" | "out";

type StatusId = DoseStatus | "runningLow" | "outOfFactor";

const STATUS_TEXT: Record<StatusId, { label: string; ink: string; dot: string }> = {
  onTrack: { label: "On track", ink: "text-moss-700", dot: "bg-moss-600" },
  dueToday: { label: "Due today", ink: "text-ochre-700", dot: "bg-ochre-600" },
  runningLow: { label: "Running low", ink: "text-ochre-700", dot: "bg-ochre-600" },
  overdue: { label: "Overdue", ink: "text-brick-600", dot: "bg-brick-600" },
  recentBleed: { label: "Recent bleed", ink: "text-brick-600", dot: "bg-brick-600" },
  outOfFactor: { label: "Out of factor", ink: "text-brick-600", dot: "bg-brick-600" },
};

const DOSE_SEVERITY: Record<DoseState, 0 | 1 | 2> = { covered: 0, low: 1, veryLow: 2 };

/** Priority model for the schedule, highest first. Replaceable in one place. */
function resolveDoseStatus(ctx: { dose: DoseState; hasRecentBleed: boolean }): DoseStatus {
  if (ctx.hasRecentBleed) return "recentBleed";
  if (DOSE_SEVERITY[ctx.dose] >= 2) return "overdue";
  if (DOSE_SEVERITY[ctx.dose] === 1) return "dueToday";
  return "onTrack";
}

/**
 * The rule the tracker's supply card tints its figure by: out at zero, low
 * for the last three vials or once the order-by date has arrived. Unknown —
 * the status still loading — reads as fine rather than as empty.
 */
function supplyNeedOf(supply: SupplyStatus | null): SupplyNeed {
  if (!supply) return "ok";
  if (supply.vialsOnHand <= 0) return "out";
  return supply.vialsOnHand <= 3 || supply.order?.due === true ? "low" : "ok";
}

/**
 * The card's one status word. An empty cupboard outranks everything, because
 * it blocks the next dose whatever the schedule says; running low sits under
 * the brick states but above "due today".
 */
function resolveStatus(dose: DoseStatus, supply: SupplyNeed): StatusId {
  if (supply === "out") return "outOfFactor";
  if (dose === "recentBleed" || dose === "overdue") return dose;
  return supply === "low" ? "runningLow" : dose;
}

/** The tone the meter and the cover figure take, from the schedule alone. */
function toneOf(dose: DoseStatus): "teal" | "caution" | "critical" {
  if (dose === "onTrack") return "teal";
  return dose === "dueToday" ? "caution" : "critical";
}

/** The room the scene furnishes, from the same reading as the status word. */
const SCENE_SUPPLY: Record<SupplyNeed, SceneSupply> = { ok: "stocked", low: "low", out: "empty" };

/** The line under a low vials figure: the day the fold advises ordering by. */
function orderNote(supply: SupplyStatus): string | undefined {
  if (supply.order) {
    return supply.order.due ? "Order now" : `Order by ${formatShortDay(supply.order.byOn)}`;
  }
  return supply.runsOutOn ? `Runs out ${formatShortDay(supply.runsOutOn)}` : undefined;
}

/* ===================================================================== */
/* 4. Home sections                                                       */
/* ===================================================================== */

export function HomeHeader({ user, now }: { user: HomeUser; now: Date }) {
  const dateLine = new Intl.DateTimeFormat("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] lg:text-[28px] lg:tracking-[-0.015em]">
          {getDayPeriod(now)}, {user.firstName}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted lg:text-[15px]">{dateLine}</p>
      </div>
      {/* From `lg` the switcher sits in the top bar instead. */}
      <ProfileButton className="lg:hidden" />
    </header>
  );
}

/** The one-line status: a dot, the word, and what regimen it refers to. */
function StatusLine({
  status,
  regimen,
  className,
}: {
  status: StatusId;
  regimen: string;
  className?: string;
}) {
  const { label, ink, dot } = STATUS_TEXT[status];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", dot)} aria-hidden="true" />
      <span className={cn("text-[15px] font-semibold", ink)}>{label}</span>
      <span className="ml-auto truncate text-[13.5px] text-ink-subtle">{regimen}</span>
    </div>
  );
}

/**
 * The card itself — the scene, the two figures that matter, the meter, and
 * the sentence that says what the meter means.
 *
 * On a phone it stacks; from `lg` the scene sits beside the figures.
 */
function StatusHero({
  treatmentStatus,
  activityStatus,
  supplyStatus,
  doseStatus,
  supply,
  now,
  children,
}: {
  treatmentStatus: TreatmentStatus;
  activityStatus: ActivityStatus;
  supplyStatus: SupplyStatus | null;
  doseStatus: DoseStatus;
  supply: SupplyNeed;
  now: Date;
  /** The action row — which buttons appear is decided by `StatusActions`. */
  children?: ReactNode;
}) {
  const status = resolveStatus(doseStatus, supply);
  const { position } = getIntervalPosition({
    treatment: treatmentStatus,
    activity: activityStatus,
    now,
  });
  const tone = toneOf(doseStatus);

  const coverDays = treatmentStatus.estimatedProtectionDays;
  const regimen = [treatmentStatus.medicationName, treatmentStatus.prescribedDose]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card padded={false} aria-label="Treatment and supply" className="overflow-hidden">
      <div className="lg:flex lg:items-center lg:gap-5 lg:p-6 xl:gap-6">
        <div className="lg:w-[260px] lg:shrink-0 xl:w-[356px]">
          <StatusLine status={status} regimen={regimen} className="px-4 pb-3.5 pt-4 lg:hidden" />
          <StatusScene
            coverage={coverageFromDose(treatmentStatus.dose)}
            supply={SCENE_SUPPLY[supply]}
            className="lg:overflow-hidden lg:rounded-2xl"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-5 sm:px-5 lg:p-0">
          <StatusLine status={status} regimen={regimen} className="hidden lg:flex" />

          <div className="flex gap-6 lg:mt-4">
            <Stat
              label="Cover left"
              value={coverDays === undefined ? "—" : coverDays}
              unit={coverDays === undefined ? undefined : coverDays === 1 ? "day" : "days"}
              tone={tone === "teal" ? "ink" : tone === "caution" ? "caution" : "critical"}
              size="lg"
              className="flex-1"
            />
            <Stat
              label="Vials at home"
              value={supplyStatus?.vialsOnHand ?? "—"}
              unit={supplyStatus ? "left" : undefined}
              tone={supply === "out" ? "critical" : supply === "low" ? "caution" : "ink"}
              note={supply === "low" && supplyStatus ? orderNote(supplyStatus) : undefined}
              size="lg"
              className="flex-1"
            />
          </div>

          <Meter
            percent={position}
            tone={tone}
            className="mt-5"
            label="How far through your recorded dose interval you are"
          />
          <DoseSentence treatmentStatus={treatmentStatus} />

          {children}
        </div>
      </div>
    </Card>
  );
}

/**
 * "Last dose 4 days ago, on Thursday. Next one due Friday 25 September."
 *
 * Every clause is dropped rather than guessed at when the fold does not know
 * it, so a fresh profile reads as a short sentence instead of a wrong one.
 */
function DoseSentence({ treatmentStatus }: { treatmentStatus: TreatmentStatus }) {
  const todayKey = getSingaporeTodayKey();
  const lastKey = treatmentStatus.lastDoseAt
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(
        new Date(treatmentStatus.lastDoseAt),
      )
    : null;
  const nextKey = treatmentStatus.nextDoseAt
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(
        new Date(treatmentStatus.nextDoseAt),
      )
    : null;

  if (!lastKey && !nextKey) {
    // `hasSchedule` is undefined until the status arrives; say nothing till then.
    if (treatmentStatus.hasSchedule === undefined) return null;
    return (
      <p className={cn("mt-2.5 text-[13.5px] leading-relaxed", INK_MUTED)}>No doses logged yet.</p>
    );
  }

  const gap = lastKey ? daysBetweenKeys(lastKey, todayKey) : null;
  const weekday = lastKey
    ? new Intl.DateTimeFormat("en-SG", { weekday: "long", timeZone: "Asia/Singapore" }).format(
        new Date(`${lastKey}T00:00:00+08:00`),
      )
    : null;

  return (
    <p className={cn("mt-2.5 text-[13.5px] leading-relaxed lg:text-[14.5px]", INK_MUTED)}>
      {lastKey ? (
        <>
          Last dose {gap === 0 ? "today" : `${formatDayGap(gap ?? 0)} ago`}
          {gap !== 0 && weekday ? `, on ${weekday}` : ""}.{" "}
        </>
      ) : null}
      {nextKey ? (
        <>
          {nextKey < todayKey ? "Was due" : "Next one due"}{" "}
          <strong className={cn("font-semibold", INK)}>{formatLongDay(nextKey)}</strong>.
        </>
      ) : (
        <>No dose planned yet.</>
      )}
    </p>
  );
}

const ENTRY_LABEL: Record<
  LedgerEntrySummary["kind"],
  { label: string; mark: "taken" | "missed" | "bleed" }
> = {
  prophylaxis: { label: "Dose taken", mark: "taken" },
  makeup: { label: "Dose made up", mark: "taken" },
  "on-demand": { label: "Bleed treated", mark: "bleed" },
  "follow-up": { label: "Follow-up dose", mark: "taken" },
  missed: { label: "Dose missed", mark: "missed" },
  refill: { label: "Refill", mark: "taken" },
};

/** Vials as the ledger charged them — "2 vials", and nothing at all for zero. */
function vialsLabel(appliedVials: number): string {
  const count = Math.abs(appliedVials);
  if (!count) return "—";
  return `${count} ${count === 1 ? "vial" : "vials"}`;
}

/**
 * The last few things recorded. A phone shows a short list; from `lg` the same
 * rows become a table with the columns a clinic conversation asks for.
 */
export function RecentEntries({
  entries,
  onOpenTracker,
}: {
  entries: LedgerEntrySummary[];
  /** "See all". Left out where the calendar is already on the page. */
  onOpenTracker?: () => void;
}) {
  const rows = entries.slice(0, 4);

  return (
    <Card className="lg:p-6">
      <CardHeaderRow
        title="Recent entries"
        action={
          onOpenTracker ? (
            <button
              type="button"
              onClick={onOpenTracker}
              className={cn("text-sm font-medium text-teal-700 hover:text-teal-800", FOCUS_RING)}
            >
              See all
            </button>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <p className={cn("mt-4 text-sm leading-relaxed", INK_MUTED)}>Nothing logged yet.</p>
      ) : (
        <>
          {/* Desktop column headings; the phone list needs none. */}
          <div className="mt-4 hidden border-b border-line pb-2.5 text-[13.5px] text-ink-subtle lg:grid lg:grid-cols-[1.3fr_1.2fr_0.9fr]">
            <span>Date</span>
            <span>Entry</span>
            <span>Amount</span>
          </div>

          <ul className="mt-3 lg:mt-0">
            {rows.map((entry) => {
              const meta = ENTRY_LABEL[entry.kind];
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3.5 py-3 lg:grid lg:grid-cols-[1.3fr_1.2fr_0.9fr] lg:items-center lg:gap-0 lg:border-b lg:border-line-soft lg:py-3.5 lg:last:border-0"
                >
                  <StatusDot kind={meta.mark} className="lg:hidden" />
                  <span className="hidden text-[14.5px] lg:block">
                    {formatShortDay(entry.occurredOn)}
                  </span>
                  <span className="flex min-w-0 flex-grow flex-col gap-0.5 lg:flex-row lg:items-center lg:gap-2.5">
                    <StatusDot kind={meta.mark} className="hidden lg:block" />
                    <span className="text-[15px] lg:text-[14.5px]">{meta.label}</span>
                    <span className="text-[13px] text-ink-faint lg:hidden">
                      {formatShortDay(entry.occurredOn)}
                    </span>
                  </span>
                  <span className="text-sm text-ink-muted lg:text-[14.5px]">
                    {vialsLabel(entry.appliedVials)}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

/* ===================================================================== */
/* 5. Low-friction dose workflow                                          */
/*                                                                        */
/* A lightweight sheet so this file stays dependency-free. If the team    */
/* repo grows a shared accessible Dialog, swap this for it — the props    */
/* below are the whole contract.                                          */
/* ===================================================================== */

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-[13.5px] font-medium text-ink-muted">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const INPUT_CLASS = cn(
  "h-12 w-full rounded-xl border border-sand-300 bg-card px-3.5 text-[15px] text-ink",
  "focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600",
);

function BottomSheet({
  open,
  onClose,
  title,
  returnFocusRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
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
    // Bottom sheet on a phone, a centred dialog from `sm` where there is room.
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-card border border-line bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-card sm:pb-5"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className={cn("text-lg font-semibold", INK)}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-soft",
              FOCUS_RING,
            )}
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

/**
 * Handles BOTH "Log dose" (prospective, defaults to today) and "I took it"
 * (retrospective) — the product distinguishes "not taken" from "taken but not
 * yet recorded", and both end in the same entry.
 *
 * Only the day is asked for. The ledger files a dose under a Singapore
 * calendar date and never records a time or an amount — a prophylaxis dose is
 * always the routine's, exactly as on the tracker — so asking for more here
 * would collect something nothing stores.
 */
function RecordDoseSheet({
  treatmentStatus,
  onClose,
  onConfirm,
}: {
  treatmentStatus: TreatmentStatus;
  onClose: () => void;
  onConfirm: HomeActions["onRecordDose"];
}) {
  const today = getSingaporeTodayKey();
  const [takenOn, setTakenOn] = useState(today);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [failureMessage, setFailureMessage] = useState("");

  const submit = async () => {
    if (saveState === "submitting") return;
    if (!takenOn || takenOn > today) {
      setFailureMessage("Pick today or an earlier day.");
      setSaveState("failure");
      return;
    }
    setSaveState("submitting");
    const result = await onConfirm({ takenOn });
    if (result.ok) setSaveState("success");
    else {
      setFailureMessage(
        result.message ?? "We couldn't save this entry. Your record has not been updated.",
      );
      setSaveState("failure");
    }
  };

  return (
    <BottomSheet open onClose={onClose} title="Log dose">
      {saveState === "success" ? (
        <div className="py-8" role="status">
          <p className={cn("text-lg font-semibold", INK)}>Dose logged</p>
          <PrimaryButton className="mt-5 w-full" onClick={onClose}>
            Done
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <p className={cn("font-semibold", INK)}>{treatmentStatus.medicationName}</p>
            {treatmentStatus.prescribedDose ? (
              <p className={cn("text-sm", INK_MUTED)}>{treatmentStatus.prescribedDose}</p>
            ) : null}
          </div>
          <Field id="dose-record-day" label="Taken on">
            <input
              id="dose-record-day"
              type="date"
              max={today}
              value={takenOn}
              onChange={(event) => {
                setTakenOn(event.target.value);
                setSaveState("idle");
              }}
              className={INPUT_CLASS}
            />
          </Field>
          {saveState === "failure" ? (
            <p role="alert" className="text-sm font-medium text-brick-600">
              {failureMessage}
            </p>
          ) : null}
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={onClose}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              className="flex-1"
              disabled={saveState === "submitting"}
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

/**
 * "Move next dose" — one sheet for both the upcoming and the overdue entry
 * point. This moves one dose only; changing the recurring routine lives on
 * the tracker, which owns the schedule.
 */
function RescheduleSheet({
  currentScheduledAt,
  onClose,
  onConfirm,
}: {
  currentScheduledAt?: string;
  onClose: () => void;
  onConfirm: HomeActions["onRescheduleDose"];
}) {
  const today = getSingaporeTodayKey();
  const [movedTo, setMovedTo] = useState(() => {
    const planned = currentScheduledAt
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(
          new Date(currentScheduledAt),
        )
      : today;
    return planned >= today ? planned : today;
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [failureMessage, setFailureMessage] = useState("");

  const confirm = async () => {
    if (saveState === "submitting") return;
    if (!movedTo || movedTo < today) {
      setFailureMessage("Pick today or a later day.");
      setSaveState("failure");
      return;
    }
    setSaveState("submitting");
    const result = await onConfirm({ movedTo });
    if (result.ok) setSaveState("success");
    else {
      setFailureMessage(result.message ?? "We couldn't move the dose. Your routine is unchanged.");
      setSaveState("failure");
    }
  };

  return (
    <BottomSheet open onClose={onClose} title="Move next dose">
      {saveState === "success" ? (
        <div className="py-8" role="status">
          <p className={cn("text-lg font-semibold", INK)}>Dose moved</p>
          <PrimaryButton className="mt-5 w-full" onClick={onClose}>
            Done
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <Field id="reschedule-day" label="New day">
            <input
              id="reschedule-day"
              type="date"
              min={today}
              value={movedTo}
              onChange={(event) => {
                setMovedTo(event.target.value);
                setSaveState("idle");
              }}
              className={INPUT_CLASS}
            />
          </Field>
          {saveState === "failure" ? (
            <p role="alert" className="text-sm font-medium text-brick-600">
              {failureMessage}
            </p>
          ) : null}
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={onClose}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              className="flex-1"
              disabled={saveState === "submitting"}
              onClick={confirm}
            >
              {saveState === "submitting"
                ? "Moving…"
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

/* ===================================================================== */
/* 6. The status card and its buttons                                     */
/* ===================================================================== */

function doseActionState(
  nextDoseAt: string | undefined,
  now: Date,
): "upcoming" | "needsAttention" | null {
  if (!nextDoseAt) return null;
  if (Number.isNaN(new Date(nextDoseAt).getTime())) return null;
  return isOverdue(nextDoseAt, now) ? "needsAttention" : "upcoming";
}

/**
 * The buttons at the foot of the status card — only what is worth doing now.
 * No streaks, no missed-dose counters, no guilt language.
 *
 * Ordering joins the dose buttons once the cupboard runs low. When it is
 * empty, ordering becomes the thing to do: it takes the primary slot, in
 * brick, and the dose buttons step down to outlines beneath it.
 */
function StatusActions({
  treatmentStatus,
  supply,
  now,
  onRecord,
  onReschedule,
  onSetUpRoutine,
  onOrder,
  onRemindLater,
}: {
  treatmentStatus: TreatmentStatus;
  supply: SupplyNeed;
  now: Date;
  onRecord: () => void;
  onReschedule: () => void;
  onSetUpRoutine: () => void;
  onOrder: () => void;
  onRemindLater?: () => void;
}) {
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  // Without a routine there is no order advice either, so this is the only ask.
  if (treatmentStatus.hasSchedule === false) {
    return (
      <PrimaryButton className="mt-5 w-full" onClick={onSetUpRoutine}>
        Set up routine
      </PrimaryButton>
    );
  }

  const state = doseActionState(treatmentStatus.nextDoseAt, now);
  const overdue = state === "needsAttention";
  const showDose = state !== null && !(overdue && dismissedFor === treatmentStatus.nextDoseAt);
  const out = supply === "out";
  const RecordButton = out ? OutlineButton : PrimaryButton;
  const OrderButton = out ? CriticalButton : OutlineButton;

  const order =
    supply === "ok" ? null : (
      <OrderButton className="w-full" onClick={onOrder}>
        How much to order
      </OrderButton>
    );
  const dose = showDose ? (
    <div className="flex gap-2.5">
      <RecordButton className="flex-grow" onClick={onRecord}>
        {overdue ? "I took it" : "Log dose"}
      </RecordButton>
      <OutlineButton className="px-5" onClick={onReschedule}>
        Move
      </OutlineButton>
    </div>
  ) : null;

  if (!order && !dose) return null;
  return (
    <div className="mt-5 flex flex-col gap-2.5">
      {out ? order : dose}
      {out ? dose : order}
      {showDose && overdue ? (
        <button
          type="button"
          className={cn("min-h-11 self-start text-sm font-medium text-teal-700", FOCUS_RING)}
          onClick={() => {
            setDismissedFor(treatmentStatus.nextDoseAt ?? null);
            onRemindLater?.();
          }}
        >
          Remind me later
        </button>
      ) : null}
    </div>
  );
}

/**
 * The status card with the sheets its buttons open. It is the heart of Home
 * on a phone, and the head of the one-page layout from `lg`.
 */
export function StatusCard({ data, actions, now = new Date() }: HomePageProps) {
  const [recordOpen, setRecordOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const { treatmentStatus, activityStatus, supplyStatus } = data;
  const doseStatus = resolveDoseStatus({
    dose: treatmentStatus.dose,
    hasRecentBleed: activityStatus.hasLoggedBleed,
  });
  const supply = supplyNeedOf(supplyStatus);

  return (
    <>
      <StatusHero
        treatmentStatus={treatmentStatus}
        activityStatus={activityStatus}
        supplyStatus={supplyStatus}
        doseStatus={doseStatus}
        supply={supply}
        now={now}
      >
        <StatusActions
          treatmentStatus={treatmentStatus}
          supply={supply}
          now={now}
          onRecord={() => setRecordOpen(true)}
          onReschedule={() => setRescheduleOpen(true)}
          onSetUpRoutine={actions.onOpenTreatmentSetup}
          onOrder={actions.onOpenSupply}
          onRemindLater={actions.onRemindLater}
        />
      </StatusHero>

      {recordOpen ? (
        <RecordDoseSheet
          treatmentStatus={treatmentStatus}
          onClose={() => setRecordOpen(false)}
          onConfirm={actions.onRecordDose}
        />
      ) : null}
      {rescheduleOpen ? (
        <RescheduleSheet
          currentScheduledAt={treatmentStatus.nextDoseAt}
          onClose={() => setRescheduleOpen(false)}
          onConfirm={actions.onRescheduleDose}
        />
      ) : null}
    </>
  );
}

/* ===================================================================== */
/* 7. HomePage — the phone's Home tab                                     */
/* ===================================================================== */

export function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading Home">
      <div className="h-16 rounded-xl bg-rail" />
      <div className="h-80 rounded-card bg-rail" />
      <div className="h-40 rounded-card bg-rail" />
    </div>
  );
}

export function HomePage({ data, actions, now = new Date() }: HomePageProps) {
  return (
    <div className="px-4 pt-7 sm:px-1">
      <HomeHeader user={data.user} now={now} />
      <div className="mt-5 flex flex-col gap-4">
        <StatusCard data={data} actions={actions} now={now} />
        <RecentEntries entries={data.recentEntries} onOpenTracker={actions.onOpenActivity} />
      </div>
    </div>
  );
}

/* ===================================================================== */
/* 8. HomeScreen — the adapter between the page and the shared state      */
/*                                                                        */
/* The only place routing and the providers are touched. <HomePage />     */
/* and every component above stay unchanged.                              */
/* ===================================================================== */

/** Nobody to show yet: the first profile is one button away. */
export function EmptyHome({ error }: { error: string | null }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="px-4 pt-7 sm:px-1 lg:px-0 lg:pt-8">
      <header className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] lg:text-[28px]">Welcome</h1>
        <ProfileButton className="lg:hidden" />
      </header>
      {error ? (
        <Card className="mt-5 lg:max-w-xl">
          <p className={cn("text-sm leading-relaxed", INK_MUTED)}>{error}</p>
        </Card>
      ) : (
        <PrimaryButton className="mt-5 w-full sm:w-auto" onClick={() => setAdding(true)}>
          Add a profile
        </PrimaryButton>
      )}
      <ProfileSheet open={adding} startWith="add" onClose={() => setAdding(false)} />
    </div>
  );
}

export function HomeScreen({ now }: { now?: Date }) {
  const {
    data,
    now: contextNow,
    isLoading,
    administerDose,
    moveNextDose,
    refreshStatus,
  } = useHomeData();
  const { error } = useProfiles();
  const navigate = useNavigate();
  const clock = now ?? contextNow;

  // The provider refetches on a profile change; a dose logged on the tracker
  // in between would otherwise leave "Next dose" stale until then.
  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  if (isLoading) {
    return (
      <div className="px-4 pt-7 sm:px-1">
        <HomeSkeleton />
      </div>
    );
  }
  if (!data) return <EmptyHome error={error} />;

  const actions: HomeActions = {
    onRecordDose: ({ takenOn }) => administerDose({ takenOn }),
    onRescheduleDose: ({ movedTo }) => moveNextDose({ movedTo }),
    onRemindLater: () => undefined,
    onOpenActivity: () => navigate("/tracker"),
    onOpenTreatmentSetup: () => navigate("/tracker#routine"),
    onOpenSupply: () => navigate("/tracker#supply"),
  };

  return <HomePage data={data} actions={actions} now={clock} />;
}

export default HomeScreen;
