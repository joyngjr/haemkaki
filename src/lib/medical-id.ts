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

/** "Factor VIII, 2000 IU" — what is being taken, as far as the profile records it. */
export function treatmentLabel(profile: Profile): string {
  const medication = profile.clinical_profile?.prophylactic_medication;
  const name = medication?.name?.trim() || `Factor ${profile.factor_type}`;
  return medication?.dose && medication.unit
    ? `${name}, ${medication.dose} ${medication.unit}`
    : name;
}

/** The medications actually on file, prophylaxis first. */
export function medicationSummary(clinical: ClinicalProfile | null): string {
  const named = [clinical?.prophylactic_medication, clinical?.on_demand_medication]
    .filter((medication) => medication?.name)
    .map((medication) =>
      medication!.dose && medication!.unit
        ? `${medication!.name} (${medication!.dose} ${medication!.unit})`
        : medication!.name,
    );
  return named.length ? named.join(", ") : "Not recorded";
}
