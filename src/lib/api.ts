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
  group_chats: string[];
  medication_reminders: boolean;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: init?.body
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
    // HTTPExceptions and a list of field errors for 422s.
    const detail = await response.json().catch(() => null);
    const message =
      typeof detail?.detail === "string" ? detail.detail : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/** How often prophylaxis is due, as the backend stores it. Mirrors `Frequency` in tracker-dates. */
export type ApiFrequency = { unit: "days"; days: number } | { unit: "week"; weekdays: number[] };

/** A profile's usual routine. Every field is null until it has been set. */
export type ApiRoutine = {
  vials: number | null;
  frequency: ApiFrequency | null;
  /** `YYYY-MM-DD` */
  start_date: string | null;
};

/** A field left out is untouched; an explicit null clears it. */
export type ApiRoutineUpdate = Partial<ApiRoutine>;

export type ApiEntryKind =
  "refill" | "prophylaxis" | "on-demand" | "follow-up" | "makeup" | "missed";

/** One tracker entry. Which fields apply depends on `kind`; see `tracker-api.ts`. */
export type ApiEntryWrite = {
  id: number;
  kind: ApiEntryKind;
  vials?: number | null;
  missed_status?: "awaiting" | "skipped" | "taken" | null;
  taken_date?: string | null;
  missed_date?: string | null;
  amount_source?: "pending" | "routine" | "custom" | null;
  amount_vials?: number | null;
};

export type ApiEntry = ApiEntryWrite & {
  /** The day the entry is filed under, `YYYY-MM-DD`. */
  day: string;
};

/** The user's answers to "shift future doses?", by entry id. All null before any answer. */
export type ApiShift = {
  anchor_id: number | null;
  handled_id: number | null;
  weekday_offset: number;
};

export type ApiPlan = {
  id: number;
  /** `YYYY-MM-DD`, inclusive */
  start_date: string;
  end_date: string;
  frequency: ApiFrequency | null;
  vials: number | null;
};

export type ApiInventoryItem = { id: string; name: string; quantity: number };

export type ApiInventory = { visible: boolean; items: ApiInventoryItem[] };

export const api = {
  listProfiles: () => request<Profile[]>("/users"),
  createProfile: (draft: ProfileDraft) =>
    request<Profile>("/users", { method: "POST", body: JSON.stringify(draft) }),
  updateProfile: (id: number, patch: Partial<ProfileDraft>) =>
    request<Profile>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProfile: (id: number) => request<void>(`/users/${id}`, { method: "DELETE" }),

  getRoutine: (userId: number) => request<ApiRoutine>(`/users/${userId}/routine`),
  updateRoutine: (userId: number, patch: ApiRoutineUpdate) =>
    request<ApiRoutine>(`/users/${userId}/routine`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  listEntries: (userId: number) => request<ApiEntry[]>(`/users/${userId}/entries`),
  /** Make one day hold exactly these entries; an empty list clears it. */
  replaceDay: (userId: number, day: string, entries: ApiEntryWrite[]) =>
    request<ApiEntry[]>(`/users/${userId}/entries/${day}`, {
      method: "PUT",
      body: JSON.stringify(entries),
    }),

  getShift: (userId: number) => request<ApiShift>(`/users/${userId}/shift`),
  putShift: (userId: number, shift: ApiShift) =>
    request<ApiShift>(`/users/${userId}/shift`, { method: "PUT", body: JSON.stringify(shift) }),
  listPlans: (userId: number) => request<ApiPlan[]>(`/users/${userId}/plans`),
  /** Make the profile hold exactly these plans. */
  replacePlans: (userId: number, plans: ApiPlan[]) =>
    request<ApiPlan[]>(`/users/${userId}/plans`, { method: "PUT", body: JSON.stringify(plans) }),
  /** Null until the Inventory card has been changed for the first time. */
  getInventory: (userId: number) => request<ApiInventory | null>(`/users/${userId}/inventory`),
  putInventory: (userId: number, inventory: ApiInventory) =>
    request<ApiInventory>(`/users/${userId}/inventory`, {
      method: "PUT",
      body: JSON.stringify(inventory),
    }),
};
