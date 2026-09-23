import type { ClinicalProfile, DiagnosisType, MedicationDetails } from "@/lib/api";
import { vialLabel } from "@/lib/tracker-entries";

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
    minimum_buffer_vials: null,
    order_day_of_month: null,
    date_of_birth: null,
    has_drug_allergies: false,
    drug_allergy_details: null,
    blood_type: null,
    emergency_contact: null,
    primary_doctor: null,
  };
}

/**
 * What a form edits: one product and its dose. The unit is not a field — the
 * forms only take vials, so storage always says so — and the storage-only keys
 * stay out.
 */
export type MedicationDraft = Pick<MedicationDetails, "name" | "dose">;

/** The one unit the medication forms accept, and the one the tracker counts in. */
export const MEDICATION_UNIT = "vials";

export const emptyMedication = (): MedicationDraft => ({ name: "", dose: "" });

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
  return { name: stored.name, dose: stored.dose };
}

/** The draft as the API stores it, or null when no product was named. Always in vials. */
export function medicationForStorage(draft: MedicationDraft): MedicationDetails | null {
  return draft.name.trim() ? { ...draft, name: draft.name.trim(), unit: MEDICATION_UNIT } : null;
}

/**
 * The regular dose recorded at onboarding, when it is a whole number of vials —
 * what the tracker seeds a new routine's dose with, and the size a dose logged
 * without a routine goes in as. A section saved before the forms were locked
 * to vials may carry another unit, and then says nothing here.
 */
export function usualDoseVials(profile: ClinicalProfile | null): number | undefined {
  const medication = profile?.prophylactic_medication;
  if (!medication || medication.unit !== MEDICATION_UNIT) return undefined;
  const vials = Number(medication.dose);
  return Number.isInteger(vials) && vials > 0 ? vials : undefined;
}

/**
 * "2 vials", "1 vial" — a recorded dose with its unit, for the Medical ID and
 * Home. Undefined when no dose is recorded. A section saved with another unit
 * prints as typed.
 */
export function doseLabel(
  medication: Pick<MedicationDetails, "dose" | "unit"> | null | undefined,
): string | undefined {
  if (!medication?.dose || !medication.unit) return undefined;
  const count = Number(medication.dose);
  if (medication.unit === MEDICATION_UNIT && Number.isInteger(count) && count > 0) {
    return vialLabel(count);
  }
  return `${medication.dose} ${medication.unit}`;
}
