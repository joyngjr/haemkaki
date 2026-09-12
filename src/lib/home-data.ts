/**
 * Home's data contracts and its demo data.
 *
 * Home is still driven by `createHomeMockData` — the API behind `@/lib/api`
 * has no columns for next-dose timing, half-life, supplies or a log ledger, so
 * wiring Home to a real profile would show a half-empty screen. Replace
 * `createHomeMockData` (and nothing else) when those land.
 */

import type { DoseState, StockState } from "@/components/platelet/Platelet";
import type { Profile } from "@/lib/api";

export type { DoseState, StockState };

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
 * these keys with the team's router in one place. Every key here is requested
 * by something on the screen; add one only alongside the call site that needs
 * it, or it becomes a button that navigates nowhere.
 */
export type HomeRouteKey = "tracker" | "inventory" | "activity" | "bleedRecord";

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

/** The greeting wants "Sam", not "Sam Tan". */
function firstNameOf(name: string): string {
  const [first] = name.trim().split(/\s+/);
  return first || name;
}

/**
 * Overlay the fields the API actually returns onto Home's demo data.
 *
 * `Profile` is the source of truth for who this is, how much factor is in them
 * and how many vials are at home — which between them is everything the hero
 * scene draws. Dose timings, supplies and the log ledger have no columns yet,
 * so those stay demo data until they do.
 *
 * This is an overlay rather than a replacement so a profile switch re-seeds the
 * screen without discarding anything the API cannot yet store.
 */
export function applyProfile(data: HomeDashboardData, profile: Profile): HomeDashboardData {
  const medicationName = `Factor ${profile.factor_type}`;
  return {
    ...data,
    user: { firstName: firstNameOf(profile.name) },
    treatmentStatus: data.treatmentStatus
      ? { ...data.treatmentStatus, dose: profile.dose_state, medicationName }
      : null,
    medicationStock: {
      ...data.medicationStock,
      label: medicationName,
      remaining: profile.vials_on_hand,
      state: profile.stock_state,
      estimatedSupplyDays: profile.days_cover,
    },
  };
}

/** Stock derivation — replaceable by the Inventory owner's real model. */
const STOCK_THRESHOLDS = { moderate: 5, low: 3 } as const;

export function deriveStockState(vialsOnHand: number): StockState {
  if (vialsOnHand <= STOCK_THRESHOLDS.low) return "low";
  if (vialsOnHand < STOCK_THRESHOLDS.moderate) return "moderate";
  return "wellStocked";
}

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
      {
        id: "log-1",
        type: "dose",
        title: "Prophylactic dose",
        detail: "2,000 IU",
        occurredAt: iso(-18),
      },
      { id: "log-2", type: "bleed", title: "Bleed recorded", occurredAt: iso(-62) },
      {
        id: "log-3",
        type: "stock",
        title: "Factor stock added",
        detail: "+6 vials",
        occurredAt: iso(-160),
      },
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
