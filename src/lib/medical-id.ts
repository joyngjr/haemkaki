import { doseLabel } from "@/components/profile/clinical-profile";
import type { ClinicalProfile, Profile } from "@/lib/api";

/**
 * The labels the Medical ID and the Resources summary card both read off a
 * profile. Shared so the two can never disagree about a diagnosis.
 */

const DIAGNOSIS_LABELS: Record<string, string> = {
  haemophilia_a: "Haemophilia A",
  haemophilia_b: "Haemophilia B",
  factor_xi_deficiency: "Factor XI Deficiency",
  acquired_haemophilia: "Acquired Haemophilia",
  symptomatic_carrier_a: "Symptomatic Carrier (A)",
  symptomatic_carrier_b: "Symptomatic Carrier (B)",
  other_or_unknown: "Bleeding Disorder",
};

/**
 * What a responder needs to read first.
 *
 * The recorded diagnosis when there is one; otherwise the factor being
 * tracked. Mapping `factor_type` straight to A or B would label an FXI patient
 * "Haemophilia B" — wrong on a card meant for an emergency.
 */
export function diagnosisLabel(profile: Profile): string {
  const diagnosis = profile.clinical_profile?.diagnosis;
  if (diagnosis) return DIAGNOSIS_LABELS[diagnosis] ?? "Bleeding Disorder";
  if (profile.factor_type === "VIII") return "Haemophilia A";
  if (profile.factor_type === "IX") return "Haemophilia B";
  return "Bleeding Disorder";
}

const SEVERITY_LABELS: Record<string, string> = {
  severe: "Severe",
  moderate: "Moderate",
  mild: "Mild",
  not_known: "Not known",
  severe_deficiency: "Severe deficiency",
  partial_deficiency: "Partial deficiency",
  life_threatening_or_major: "Life-threatening / major bleeding",
  moderate_or_non_life_threatening: "Moderate / non-life-threatening",
  unknown: "Unknown",
};

/** Severity is recorded in a different field per diagnosis. */
export function severityOf(clinical: ClinicalProfile | null): string {
  const recorded =
    clinical?.congenital_severity ??
    clinical?.factor_xi_deficiency_level ??
    clinical?.acquired_bleeding_severity;
  if (!recorded) return "Not recorded";
  return SEVERITY_LABELS[recorded] ?? recorded;
}

/** "Haemophilia A, severe" — the diagnosis line with its severity folded in. */
export function diagnosisWithSeverity(profile: Profile): string {
  const severity = severityOf(profile.clinical_profile ?? null);
  const label = diagnosisLabel(profile);
  return severity === "Not recorded" ? label : `${label}, ${severity.toLowerCase()}`;
}

/** "Advate, 2 vials" — what is being taken, as far as the profile records it. */
export function treatmentLabel(profile: Profile): string {
  const medication = profile.clinical_profile?.prophylactic_medication;
  const name = medication?.name?.trim() || `Factor ${profile.factor_type}`;
  const dose = doseLabel(medication);
  return dose ? `${name}, ${dose}` : name;
}

/** The medications actually on file, prophylaxis first. */
export function medicationSummary(clinical: ClinicalProfile | null): string {
  const named = [clinical?.prophylactic_medication, clinical?.on_demand_medication]
    .filter((medication) => medication?.name)
    .map((medication) => {
      const dose = doseLabel(medication);
      return dose ? `${medication!.name} (${dose})` : medication!.name;
    });
  return named.length ? named.join(", ") : "Not recorded";
}

/** The date of birth as the card shows it, or "Not recorded". `locale` sets the month name. */
export function formatDob(iso: string | null | undefined, locale = "en-SG"): string {
  if (!iso) return "Not recorded";
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
        date,
      );
}

/** Blood type, distinguishing "never asked" from "asked, answered unknown". */
export function bloodTypeLabel(clinical: ClinicalProfile | null | undefined): string {
  const recorded = clinical?.blood_type;
  if (!recorded) return "Not recorded";
  return recorded === "unknown" ? "Not known" : recorded;
}

/** The allergies line: the details when there are any, else "None recorded". */
export function drugAllergiesLabel(clinical: ClinicalProfile | null | undefined): string {
  if (!clinical?.has_drug_allergies) return "None recorded";
  return clinical.drug_allergy_details ?? "Yes — details not recorded";
}

/**
 * Every fixed English string the Medical ID card and its PDF can show — what
 * gets sent for translation. It is the same list for everyone, so the person's
 * own details never leave for the translation service, and anything not in it
 * (a name, a phone number, a drug, an allergy note) is shown as entered.
 *
 * Titles are in title case and uppercased for display: a translator handles
 * "Patient Details" far better than "PATIENT DETAILS".
 */
export const MEDICAL_ID_COPY: string[] = [
  "Medical ID",
  "Bleeding Disorder",
  "Handle with Care",
  "Patient Details",
  "Name",
  "Blood Type",
  "Date of Birth",
  "Medical Information",
  "Diagnosis",
  "Severity",
  "Current Medication",
  "Drug Allergies",
  "Allergies",
  "Emergency Contact",
  "Relationship",
  "Phone",
  "Contact",
  "Call Emergency Contact",
  "Primary Doctor (Organisation)",
  "Organisation",
  "Doctor",
  "Call Doctor",
  "Not recorded",
  "Not known",
  "None recorded",
  "Yes — details not recorded",
  "Generated on",
  "Machine-translated from English",
  ...new Set([...Object.values(DIAGNOSIS_LABELS), ...Object.values(SEVERITY_LABELS)]),
];
