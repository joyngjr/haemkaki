import type { ClinicalProfile, DiagnosisType, MedicationDetails } from "@/lib/api";

/**
 * A clinical profile with nothing recorded but the diagnosis.
 *
 * Three screens each own part of the profile — onboarding, the Medical ID
 * form, the tracker's routine — and the API replaces the whole JSON object on
 * every save. Each of them therefore starts from what is already stored and
 * overrides only its own fields; this is the starting point when nothing is.
 */
export function emptyClinicalProfile(diagnosis: DiagnosisType): ClinicalProfile {
  return {
    diagnosis,
    congenital_severity: null,
    factor_xi_deficiency_level: null,
    acquired_bleeding_severity: null,
    prophylactic_medication: null,
    on_demand_medication: null,
    minimum_buffer_days: null,
    date_of_birth: null,
    has_drug_allergies: false,
    drug_allergy_details: null,
    blood_type: null,
    emergency_contact: null,
    primary_doctor: null,
  };
}

/** What a form edits: one product and its size, without the storage-only keys. */
export type MedicationDraft = Pick<MedicationDetails, "name" | "dose" | "unit">;

export const emptyMedication = (): MedicationDraft => ({ name: "", dose: "", unit: "" });

/**
 * A stored medication section as a draft.
 *
 * Sections recorded before the forms were split could hold several
 * medications, the whole list in `items_json`. Only the first was ever shown,
 * so that is what is read back; saving writes the single medication and drops
 * the list.
 */
export function medicationFromStorage(stored: MedicationDetails | null): MedicationDraft {
  if (!stored) return emptyMedication();
  return { name: stored.name, dose: stored.dose, unit: stored.unit };
}

/** The draft as the API stores it, or null when no product was named. */
export function medicationForStorage(draft: MedicationDraft): MedicationDetails | null {
  return draft.name.trim() ? { ...draft, name: draft.name.trim() } : null;
}
