/**
 * Home's data contracts, and the one function that builds them.
 *
 * `buildHomeData` derives everything Home shows from the active profile and
 * the folded `/users/{id}/status`. Nothing is seeded and nothing is overlaid:
 * before the status arrives the timings are simply absent and the hero says
 * "not enough information", and with no profile at all Home shows nobody
 * rather than a demo person.
 *
 * Two things are still demo content because nothing collects or stores them,
 * and they are marked at their definitions rather than left to look real:
 * `factorHalfLifeHours` and `dailyTip`.
 */

import type { DoseState } from "@/components/platelet/Platelet";
import type { Profile, Status } from "@/lib/api";

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
   * IU and no half-life — so it is a textbook figure, not this patient's. It
   * only positions the marker on the Activity card's bar.
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

export interface CoverStatus {
  state: "estimated" | "approaching" | "needsReview" | "unavailable";
  displayValue?: string;
  source: "scheduleEstimate" | "validatedPK" | "unavailable";
  supportingText: string;
}

export interface ActivityStatus {
  /** An on-demand dose within {@link RECENT_BLEED_DAYS} of today. */
  hasLoggedBleed: boolean;
  /** ISO timestamp (start of day, Singapore) of the most recent on-demand dose. */
  lastBleedAt?: string;
}

/** DEMO DATA. There is no tip content source and no clinical review process. */
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
  treatmentStatus: TreatmentStatus;
  activityStatus: ActivityStatus;
  dailyTip: DailyTipData;
  /** When the folded status was last fetched. Absent until it has been. */
  lastUpdatedAt?: string;
}

export interface AdministerDosePayload {
  /** The Singapore calendar day the dose was taken, as `YYYY-MM-DD`. */
  takenOn: string;
}

export interface MoveDosePayload {
  /** The Singapore calendar day the next planned dose should move to, as `YYYY-MM-DD`. */
  movedTo: string;
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

/** DEMO DATA. One fixed tip until there is a reviewed content source. */
export const DAILY_TIP: DailyTipData = {
  id: "tip-keep-records-current",
  title: "Keep your records current",
  body: "Recording changes when they happen can make your next care conversation easier.",
  sourceLabel: "HaemKakis demo content",
  clinicalReviewStatus: "pending",
};

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
  const prescribedDose =
    prophylaxis?.dose && prophylaxis.unit ? `${prophylaxis.dose} ${prophylaxis.unit}` : undefined;
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

  return {
    user: { firstName: firstNameOf(profile.name) },
    treatmentStatus,
    activityStatus,
    dailyTip: DAILY_TIP,
    ...(options.fetchedAt ? { lastUpdatedAt: options.fetchedAt } : {}),
  };
}
