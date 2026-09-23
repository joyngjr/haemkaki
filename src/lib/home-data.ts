/**
 * Home's data contracts, and the one function that builds them.
 *
 * `buildHomeData` derives everything Home shows from the active profile and
 * the folded `/users/{id}/status`. Nothing is seeded and nothing is overlaid:
 * before the status arrives the timings are simply absent and the hero says
 * "not enough information", and with no profile at all Home shows nobody
 * rather than a demo person.
 *
 * One thing is still demo content because nothing collects or stores it, and
 * it is marked at its definition rather than left to look real:
 * `factorHalfLifeHours`.
 */

import type { DoseState, StockState } from "@/components/platelet/Platelet";
import { doseLabel } from "@/components/profile/clinical-profile";
import type { EventKind, Profile, Status } from "@/lib/api";
import { vialLabel } from "@/lib/tracker-entries";

export type { DoseState };

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
  /**
   * DEMO DATA. Nothing collects this — the onboarding form records a dose in
   * vials and no half-life — so it is a textbook figure, not this patient's. It
   * only positions the status card's meter.
   */
  factorHalfLifeHours: number;
  /**
   * Whole days until the next scheduled dose; 0 means it is due today. This is
   * schedule cover, NOT inventory cover — the tracker shows days of supply.
   */
  estimatedProtectionDays?: number;
  medicationName?: string;
  prescribedDose?: string;
  /** Whether a routine has been set up. Undefined until the status has loaded. */
  hasSchedule?: boolean;
}

export interface ActivityStatus {
  /** An on-demand dose within {@link RECENT_BLEED_DAYS} of today. */
  hasLoggedBleed: boolean;
  /** ISO timestamp (start of day, Singapore) of the most recent on-demand dose. */
  lastBleedAt?: string;
}

/**
 * What is in the cupboard, as the fold reports it. Null until the status has
 * loaded — the overview then says nothing rather than guessing at zero.
 */
export interface SupplyStatus {
  vialsOnHand: number;
  /** Calendar days until a planned dose cannot be supplied. */
  daysCover: number;
  stockState: StockState;
  /** What the fold advises ordering, when it advises anything. */
  order?: { byOn: string; vials: number; due: boolean; coversUntil: string };
}

/** One row in "Recent entries", flattened out of the ledger. */
/**
 * What a "Recent entries" row can be. `missed` is not an event kind: a missed
 * dose is a planned day the ledger has nothing for, which the fold reports as
 * `status.missed_doses`, so it joins the list here rather than coming from a
 * row of its own.
 */
export type LedgerRowKind = EventKind | "missed";

export interface LedgerEntrySummary {
  /** Stable across re-reads, and unique across events and derived misses alike. */
  key: string;
  kind: LedgerRowKind;
  /** `YYYY-MM-DD`, the day key the calendar files it under. */
  occurredOn: string;
  /** What the fold charged the cupboard: negative for a dose, positive for a refill. */
  appliedVials: number;
}

export interface HomeDashboardData {
  user: HomeUser;
  treatmentStatus: TreatmentStatus;
  activityStatus: ActivityStatus;
  /** Null until the folded status has arrived for this profile. */
  supplyStatus: SupplyStatus | null;
  /** Newest first. Empty before the status loads, and for a profile with no ledger. */
  recentEntries: LedgerEntrySummary[];
  /** When the folded status was last fetched. Absent until it has been. */
  lastUpdatedAt?: string;
}

export interface AdministerDosePayload {
  /** The Singapore calendar day the dose was taken, as `YYYY-MM-DD`. */
  takenOn: string;
}

export type SaveResult = { ok: true } | { ok: false; message?: string };

/**
 * PROTOTYPE threshold: how many days an on-demand dose keeps Home in its
 * "recent bleed" state. On-demand use is the app's own marker for a treated
 * bleed — it is what the tracker draws the blood drop for.
 */
export const RECENT_BLEED_DAYS = 3;

/** DEMO DATA — see `TreatmentStatus.factorHalfLifeHours`. */
const DEMO_HALF_LIFE_HOURS = 24;

const DAY = 86_400_000;

/** The greeting wants "Sam", not "Sam Tan". */
function firstNameOf(name: string): string {
  const [first] = name.trim().split(/\s+/);
  return first || name;
}

function trackedProductLabel(profile: Profile): string {
  const diagnosis = profile.clinical_profile?.diagnosis;
  if (diagnosis === "factor_xi_deficiency") return "Factor XI";
  if (diagnosis === "acquired_haemophilia") return "Acquired haemophilia";
  if (diagnosis === "other_or_unknown") return "Care plan";
  return `Factor ${profile.factor_type}`;
}

/**
 * A ledger day as an instant: midnight in Singapore on that date.
 *
 * The ledger records the day a dose was taken, never the minute. Pinning the
 * instant to Singapore rather than the browser's zone keeps "today" the same
 * day the tracker calendar shows, whichever laptop the demo runs on, and lets
 * `home-format` recognise it as day-only and hide the "12:00 am".
 */
export function atStartOfSingaporeDay(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00+08:00`).toISOString();
}

/** Whole days from one day key to another; negative when `to` is earlier. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

export interface HomeDataOptions {
  /** When `status` was fetched. */
  fetchedAt?: string;
}

/** The kinds that belong in "Recent entries" — a refill is supply, not treatment. */
const LEDGER_ROW_KINDS: ReadonlySet<EventKind> = new Set<EventKind>([
  "prophylaxis",
  "on-demand",
  "follow-up",
  "makeup",
]);

/**
 * Everything Home shows, from what the API actually knows.
 *
 * `status` is null until the fold has been fetched for this profile; the
 * profile row alone still gives the name, the factor and the dose state.
 */
export function buildHomeData(
  profile: Profile,
  status: Status | null,
  now: Date,
  options: HomeDataOptions = {},
): HomeDashboardData {
  const prophylaxis = profile.clinical_profile?.prophylactic_medication ?? null;
  // Once a routine exists it is what a logged dose actually deducts, so it is
  // the amount Home shows. Before one is set up, the profile's recorded dose.
  const prescribedDose = status?.schedule
    ? vialLabel(status.schedule.vials)
    : doseLabel(prophylaxis);
  const medicationName = prophylaxis?.name.trim() || trackedProductLabel(profile);

  const nextDoseAt = status?.next_dose ? atStartOfSingaporeDay(status.next_dose.on) : undefined;
  // Ceiling, so a dose due at the start of the day after tomorrow reads as
  // "2 days" this afternoon; anything already due reads as 0.
  const protectionDays = nextDoseAt
    ? Math.max(0, Math.ceil((Date.parse(nextDoseAt) - now.getTime()) / DAY))
    : undefined;

  const treatmentStatus: TreatmentStatus = {
    dose: status?.dose_state ?? profile.dose_state,
    factorHalfLifeHours: DEMO_HALF_LIFE_HOURS,
    medicationName,
    ...(prescribedDose ? { prescribedDose } : {}),
    ...(status?.last_dose_on ? { lastDoseAt: atStartOfSingaporeDay(status.last_dose_on) } : {}),
    ...(nextDoseAt ? { nextDoseAt } : {}),
    ...(protectionDays !== undefined ? { estimatedProtectionDays: protectionDays } : {}),
    ...(status ? { hasSchedule: status.schedule !== null } : {}),
  };

  const lastBleedOn = status?.last_bleed_on ?? null;
  const activityStatus: ActivityStatus = {
    hasLoggedBleed:
      status !== null &&
      lastBleedOn !== null &&
      daysBetween(lastBleedOn, status.as_of) <= RECENT_BLEED_DAYS,
    ...(lastBleedOn ? { lastBleedAt: atStartOfSingaporeDay(lastBleedOn) } : {}),
  };

  const supplyStatus: SupplyStatus | null = status
    ? {
        vialsOnHand: status.vials_on_hand,
        daysCover: status.days_cover,
        stockState: status.stock_state,
        ...(status.order
          ? {
              order: {
                byOn: status.order.by_on,
                vials: status.order.vials,
                due: status.order.due,
                coversUntil: status.order.covers_until,
              },
            }
          : {}),
      }
    : null;

  // `recent_events` arrives oldest first; the overview reads newest first. The
  // days the fold found no dose for are rows too, with nothing charged.
  const recentEntries: LedgerEntrySummary[] = (status?.recent_events ?? [])
    .filter((event) => LEDGER_ROW_KINDS.has(event.kind))
    .map((event) => ({
      key: `event-${event.id}`,
      kind: event.kind as LedgerRowKind,
      occurredOn: event.occurred_on,
      appliedVials: event.applied_vials,
    }))
    .concat(
      (status?.missed_doses ?? []).map((occurredOn) => ({
        key: `missed-${occurredOn}`,
        kind: "missed" as LedgerRowKind,
        occurredOn,
        appliedVials: 0,
      })),
    )
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));

  return {
    user: { firstName: firstNameOf(profile.name) },
    treatmentStatus,
    activityStatus,
    supplyStatus,
    recentEntries,
    ...(options.fetchedAt ? { lastUpdatedAt: options.fetchedAt } : {}),
  };
}
