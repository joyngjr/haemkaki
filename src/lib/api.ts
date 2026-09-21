import { type DoseState, type StockState } from "@/components/platelet/Platelet";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type FactorType = "VIII" | "IX" | "XI" | "acquired" | "unknown";

export type DiagnosisType =
  | "haemophilia_a"
  | "haemophilia_b"
  | "factor_xi_deficiency"
  | "acquired_haemophilia"
  | "symptomatic_carrier_a"
  | "symptomatic_carrier_b"
  | "other_or_unknown";

export type MedicationDetails = {
  name: string;
  dose: string;
  unit: string;
  frequency: string;
  administration: string;
  buffer_days: string;
  /** Backward-compatible storage for sections containing more than one medication. */
  items_json?: string;
};

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";

/** Who a responder should call first. Shown on the Medical ID card. */
export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

/** The treating clinician or centre. The phone is optional; the card only offers a call when there is one. */
export type CareTeamContact = {
  name: string;
  organisation: string;
  phone: string | null;
};

export type ClinicalProfile = {
  diagnosis: DiagnosisType;
  sex: string;
  weight_kg: number | null;
  date_of_birth: string | null;
  has_drug_allergies: boolean;
  drug_allergy_details: string | null;
  diagnosis_factor_activity_percent: number | null;
  diagnosis_test_date: string | null;
  congenital_severity: string | null;
  factor_xi_deficiency_level: string | null;
  acquired_inhibitor_titre_bu_ml: number | null;
  acquired_bleeding_severity: string | null;
  inhibitor_status: string | null;
  fix_allergy_or_anaphylaxis: string | null;
  treatment_approach: string | null;
  prophylactic_medication: MedicationDetails | null;
  minimum_buffer: string | null;
  on_demand_medication: MedicationDetails | null;
  other_medication: MedicationDetails | null;
  medication_reminders: boolean;
  /** Days of coverage to keep in reserve before ordering. The order date itself comes from the fold. */
  minimum_buffer_days: number | null;
  /** Medical ID. All optional — the card says "Not recorded" rather than inventing a contact. */
  blood_type: BloodType | null;
  emergency_contact: EmergencyContact | null;
  primary_doctor: CareTeamContact | null;
};

/** A person tracked on this device. No auth — a profile is just a name. */
export type Profile = {
  id: number;
  name: string;
  factor_type: FactorType;
  dose_state: DoseState;
  stock_state: StockState;
  vials_on_hand: number;
  days_cover: number;
  clinical_profile: ClinicalProfile | null;
  created_at: string;
  updated_at: string;
};

/** The fields a new profile is created with. The API defaults the rest. */
export type ProfileDraft = {
  name: string;
  factor_type: FactorType;
  dose_state?: DoseState;
  stock_state?: StockState;
  vials_on_hand?: number;
  days_cover?: number;
  clinical_profile?: ClinicalProfile | null;
};

/* ------------------------------------------------------------------ */
/* Tracking events — the tracker's ledger                              */
/* ------------------------------------------------------------------ */

export type EventKind = "refill" | "prophylaxis" | "on-demand" | "follow-up" | "makeup" | "missed";

export type AmountSource = "pending" | "routine" | "custom";
export type MissedStatus = "awaiting" | "skipped" | "taken";

/**
 * One row of the ledger, exactly as the API returns it.
 *
 * Flat rather than a discriminated union: the response carries a null for
 * every field that does not belong to its kind, which is what lets the
 * timeline be a plain `events.map(...)`. `fromApi` in `@/lib/tracker-entries`
 * narrows it back into a `TrackerEntry`.
 */
export type TrackingEvent = {
  id: number;
  kind: EventKind;
  /** `YYYY-MM-DD` — the same day key the calendar files entries under. */
  occurred_on: string;
  vials: number | null;
  missed_on: string | null;
  amount_source: AmountSource | null;
  amount_vials: number | null;
  status: MissedStatus | null;
  taken_on: string | null;
  /**
   * What the fold charged the cupboard for this event: positive for a refill,
   * negative for a dose, zero when the amount is not known. A prophylaxis
   * dose is sized by the schedule in force on its day, so this is the only
   * place the tracker learns how big one was.
   */
  applied_vials: number;
};

/** What the API accepts. The shape depends on `kind`, which is why this is a union. */
export type TrackingEventDraft =
  | { kind: "refill"; occurred_on: string; vials: number }
  | { kind: "prophylaxis"; occurred_on: string }
  | { kind: "on-demand"; occurred_on: string; vials: number }
  | { kind: "follow-up"; occurred_on: string; vials: number }
  | {
      kind: "makeup";
      occurred_on: string;
      missed_on: string;
      amount: { source: AmountSource; vials?: number };
    }
  | {
      kind: "missed";
      occurred_on: string;
      status: MissedStatus;
      taken_on?: string;
      amount?: { source: AmountSource; vials?: number };
    };

/* ------------------------------------------------------------------ */
/* Dose schedules — the routine as a calendar's recurring event         */
/* ------------------------------------------------------------------ */

/**
 * A recurring prophylaxis series: from `start_on`, every `interval_days` or
 * on the fixed `weekdays` (0 = Sunday … 6 = Saturday), `vials` per dose.
 * Exactly one of the two frequency fields is set.
 */
export type Schedule = {
  id: number;
  start_on: string;
  interval_days: number | null;
  weekdays: number[] | null;
  vials: number;
};

export type ScheduleDraft = {
  start_on: string;
  interval_days: number | null;
  weekdays: number[] | null;
  vials: number;
  /** Delete every other series in the same request — the tracker keeps one routine at a time. */
  replace?: boolean;
};

/**
 * One planned dose. `on` is where it sits; `original_on` is where the cycle
 * put it, and identifies it. A series' dose carries `schedule_id` and can be
 * moved; a plan's carries `plan_id` and follows the plan instead.
 */
export type Occurrence = {
  on: string;
  original_on: string;
  schedule_id: number | null;
  plan_id: number | null;
  vials: number;
  moved: boolean;
};

/**
 * A temporary change to the routine between two dates, inclusive — "Plan
 * Ahead". A null frequency or `vials` means "as the routine has it". The API
 * applies it inside the fold, so planned doses, the run-out date and the
 * order advice all follow it.
 */
export type Plan = {
  id: number;
  start_on: string;
  end_on: string;
  interval_days: number | null;
  weekdays: number[] | null;
  vials: number | null;
};

export type PlanDraft = Omit<Plan, "id">;

/**
 * When to order and how much, from stock and the schedule. `due` means the
 * date has already arrived. The rest is the working: the doses planned from
 * the run-out date through `covers_until` (a month plus the buffer), less
 * the vials still in the cupboard on the run-out date.
 */
export type OrderAdvice = {
  by_on: string;
  vials: number;
  due: boolean;
  covers_until: string;
  planned_doses: number;
  planned_vials: number;
  leftover_vials: number;
  buffer_days: number;
};

/** The folded view Home and the tracker read. */
export type Status = {
  as_of: string;
  vials_on_hand: number;
  unaccounted_vials: number;
  /** Calendar days until a planned dose cannot be supplied, capped at a year. Zero without a schedule. */
  days_cover: number;
  runs_out_on: string | null;
  last_dose_on: string | null;
  /** The most recent on-demand dose — the app's marker for a treated bleed. */
  last_bleed_on: string | null;
  /** The series in force today. */
  schedule: Schedule | null;
  /** The first planned dose after the last logged one that nothing has settled. In the past means overdue. */
  next_dose: Occurrence | null;
  order: OrderAdvice | null;
  dose_state: DoseState;
  stock_state: StockState;
  recent_events: TrackingEvent[];
};

/* ------------------------------------------------------------------ */
/* Supplies — the tracker's Inventory card                             */
/* ------------------------------------------------------------------ */

/** One counted, non-factor supply, as the API stores it. */
export type SupplyItem = {
  id: number;
  name: string;
  quantity: number;
};

/** What `PUT /supplies` takes: the whole list, in display order. */
export type SupplyItemDraft = Pick<SupplyItem, "name" | "quantity">;

/** An `occurred_on` window, both ends inclusive. */
export type EventRange = { since?: string; until?: string };

type FieldError = { loc?: unknown[]; msg?: string };

/** The human half of a FastAPI error body, if there is one. */
function validationMessage(body: unknown): string | null {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail) || !detail.length) return null;
  return detail
    .slice(0, 3)
    .map((error: FieldError) => {
      // `loc` is ["body", "vials"] or ["body", "refill", "vials"]; the last
      // segment is the field, and a plain index is not worth showing.
      const field = [...(error.loc ?? [])]
        .reverse()
        .find((part) => typeof part === "string" && part !== "body");
      const message = error.msg ?? "is invalid";
      return field ? `${field}: ${message}` : message;
    })
    .join("; ");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      // Uploads deliberately use multipart form data. Let the browser add its
      // boundary; setting application/json here would corrupt the file.
      headers:
        init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json", ...init?.headers }
          : init?.headers,
    });
  } catch {
    // A dead backend surfaces as a bare "Failed to fetch", which tells a
    // demo-day audience nothing. Name the likely cause instead.
    throw new Error("Could not reach the API. Is the backend running?");
  }

  if (!response.ok) {
    // FastAPI puts the reason in `detail`, which is a string for our own
    // HTTPExceptions and a list of field errors for 422s. A bare
    // "Request failed (422)" tells nobody which field was wrong, and the
    // validation lives entirely in the backend schemas, so this is the only
    // place those rules can surface.
    const body = await response.json().catch(() => null);
    throw new Error(validationMessage(body) ?? `Request failed (${response.status})`);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/** A server-produced candidate remains separate from an event until the user confirms it. */
export type ImportCandidate = {
  id: string;
  kind: "infusion" | "bleed";
  occurred_on: string | null;
  occurred_at: string | null;
  product: string | null;
  dose_iu: number | null;
  vials: number | null;
  reason: "prophylaxis" | "on-demand" | "follow-up" | null;
  bleed_location: string | null;
  notes: string | null;
  source: string;
  state: "ready" | "needs_review";
};

export type ImportReadResult = { candidates: ImportCandidate[] };
export type ImportRereadHint =
  "day_month_year" | "number_is_vials" | "rows_are_infusions" | "rows_are_bleeds";

export const api = {
  listProfiles: () => request<Profile[]>("/users"),
  createProfile: (draft: ProfileDraft) =>
    request<Profile>("/users", { method: "POST", body: JSON.stringify(draft) }),
  updateProfile: (id: number, patch: Partial<ProfileDraft>) =>
    request<Profile>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProfile: (id: number) => request<void>(`/users/${id}`, { method: "DELETE" }),

  listEvents: (userId: number, range: EventRange = {}) => {
    const query = new URLSearchParams();
    if (range.since) query.set("since", range.since);
    if (range.until) query.set("until", range.until);
    const suffix = query.size ? `?${query}` : "";
    return request<TrackingEvent[]>(`/users/${userId}/events${suffix}`);
  },
  createEvent: (userId: number, draft: TrackingEventDraft) =>
    request<TrackingEvent>(`/users/${userId}/events`, {
      method: "POST",
      body: JSON.stringify(draft),
    }),
  /** Whole-event replacement — the API has no PATCH, because editing a day replaces its entry. */
  replaceEvent: (userId: number, eventId: number, draft: TrackingEventDraft) =>
    request<TrackingEvent>(`/users/${userId}/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(draft),
    }),
  deleteEvent: (userId: number, eventId: number) =>
    request<void>(`/users/${userId}/events/${eventId}`, { method: "DELETE" }),

  /**
   * Secure import boundary. The server is responsible for document/OCR/AI
   * processing; no file content or credentials are sent to an AI from React.
   */
  readImport: (userId: number, files: File[], hints: ImportRereadHint[] = [], note = "") => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    hints.forEach((hint) => form.append("hints", hint));
    if (note.trim()) form.append("note", note.trim());
    return request<ImportReadResult>(`/users/${userId}/imports/read`, {
      method: "POST",
      body: form,
    });
  },

  getStatus: (userId: number) => request<Status>(`/users/${userId}/status`),

  listSchedules: (userId: number) => request<Schedule[]>(`/users/${userId}/schedules`),
  createSchedule: (userId: number, draft: ScheduleDraft) =>
    request<Schedule>(`/users/${userId}/schedules`, {
      method: "POST",
      body: JSON.stringify(draft),
    }),
  deleteSchedule: (userId: number, scheduleId: number) =>
    request<void>(`/users/${userId}/schedules/${scheduleId}`, { method: "DELETE" }),
  /** The planned doses in a window, both ends inclusive, moved ones on their new day. */
  listOccurrences: (userId: number, range: { since: string; until: string }) =>
    request<Occurrence[]>(`/users/${userId}/schedules/occurrences?${new URLSearchParams(range)}`),
  /** Move the dose the cycle put on `originalOn`. Moving it again replaces the earlier move. */
  moveOccurrence: (userId: number, scheduleId: number, originalOn: string, movedTo: string) =>
    request<Occurrence>(`/users/${userId}/schedules/${scheduleId}/exceptions/${originalOn}`, {
      method: "PUT",
      body: JSON.stringify({ moved_to: movedTo }),
    }),
  /** Put a moved dose back on its cycle day. */
  restoreOccurrence: (userId: number, scheduleId: number, originalOn: string) =>
    request<void>(`/users/${userId}/schedules/${scheduleId}/exceptions/${originalOn}`, {
      method: "DELETE",
    }),

  listPlans: (userId: number) => request<Plan[]>(`/users/${userId}/plans`),
  /** Rejected with a 422 when the dates overlap another plan. */
  createPlan: (userId: number, draft: PlanDraft) =>
    request<Plan>(`/users/${userId}/plans`, { method: "POST", body: JSON.stringify(draft) }),
  /** Whole-plan replacement, like an event: editing a plan re-answers all of it. */
  replacePlan: (userId: number, planId: number, draft: PlanDraft) =>
    request<Plan>(`/users/${userId}/plans/${planId}`, {
      method: "PUT",
      body: JSON.stringify(draft),
    }),
  deletePlan: (userId: number, planId: number) =>
    request<void>(`/users/${userId}/plans/${planId}`, { method: "DELETE" }),

  listSupplies: (userId: number) => request<SupplyItem[]>(`/users/${userId}/supplies`),
  /** Replaces the whole list — the API has no per-item routes, because the card edits the list as one. */
  replaceSupplies: (userId: number, items: SupplyItemDraft[]) =>
    request<SupplyItem[]>(`/users/${userId}/supplies`, {
      method: "PUT",
      body: JSON.stringify(items),
    }),
};
