import { BackLink } from "@/components/layout/BackLink";
import { CallLink } from "@/components/tips/medical-id/CallLink";
import { Field, SectionCard } from "@/components/tips/medical-id/SectionCard";
import {
  CapsuleIcon,
  PersonIcon,
  PhoneIcon,
  PlusIcon,
  StethoscopeIcon,
} from "@/components/tips/medical-id/SectionIcons";
import type { ClinicalProfile, Profile } from "@/lib/api";
import { useProfiles } from "@/state/profile-context";

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
 * The recorded diagnosis when there is one; otherwise the factor being tracked.
 * The old version mapped `factor_type` straight to A or B, which labelled an
 * FXI patient "Haemophilia B" — wrong on a card meant for an emergency.
 */
function diagnosisLabel(profile: Profile): string {
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
function severityOf(clinical: ClinicalProfile | null): string {
  const recorded =
    clinical?.congenital_severity ??
    clinical?.factor_xi_deficiency_level ??
    clinical?.acquired_bleeding_severity;
  if (!recorded) return "Not recorded";
  return SEVERITY_LABELS[recorded] ?? recorded;
}

function formatDob(iso: string | null | undefined): string {
  if (!iso) return "Not recorded";
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" }).format(
        date,
      );
}

function bloodTypeLabel(clinical: ClinicalProfile | null): string {
  const recorded = clinical?.blood_type;
  if (!recorded) return "Not recorded";
  return recorded === "unknown" ? "Not known" : recorded;
}

/** The medications actually on file, prophylaxis first. */
function medicationSummary(clinical: ClinicalProfile | null): string {
  const named = [clinical?.prophylactic_medication, clinical?.on_demand_medication]
    .filter((medication) => medication?.name)
    .map((medication) =>
      medication!.dose && medication!.unit
        ? `${medication!.name} (${medication!.dose} ${medication!.unit})`
        : medication!.name,
    );
  return named.length ? named.join(", ") : "Not recorded";
}

export function MedicalId() {
  const { activeProfile, status } = useProfiles();

  if (status === "loading") {
    return (
      <div className="px-4 pt-8">
        <p className="text-sm text-gray-400">Loading medical ID...</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="px-4 pt-8">
        <BackLink to="/tips" />
        <p className="mt-4 text-sm text-gray-400">
          No profile selected yet. Create a profile to see a Medical ID.
        </p>
      </div>
    );
  }

  const label = diagnosisLabel(activeProfile);
  const clinical = activeProfile.clinical_profile;
  const contact = clinical?.emergency_contact ?? null;
  const doctor = clinical?.primary_doctor ?? null;

  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips" />

      <div className="mt-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold tracking-widest text-blue-700">MEDICAL ID</p>
        <h1 className="mt-1 text-4xl font-extrabold text-red-600">{label}</h1>
        <p className="mt-1 text-xs font-bold tracking-wide text-gray-500">
          BLEEDING DISORDER &nbsp;&#8226;&nbsp; HANDLE WITH CARE
        </p>
      </div>

      {/* The line a responder should read first, so it sits above the details. */}
      <div className="mt-4 rounded-[20px] bg-blue-50 p-4">
        <p className="text-sm font-bold text-blue-900">This patient has {label}.</p>
        <p className="mt-1 text-sm text-blue-800">
          Please ensure appropriate treatment and avoid unnecessary procedures or injections.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <SectionCard title="PATIENT DETAILS" iconBg="#1e3a8a" icon={<PersonIcon />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={activeProfile.name} />
            <Field label="Blood Type" value={bloodTypeLabel(clinical)} />
          </div>
          <Field label="DOB" value={formatDob(clinical?.date_of_birth)} />
        </SectionCard>

        <SectionCard title="MEDICAL INFORMATION" iconBg="#2563eb" icon={<CapsuleIcon />}>
          <Field label="Diagnosis" value={label} />
          <Field label="Severity" value={severityOf(clinical)} />
          <Field label="Current Medication" value={medicationSummary(clinical)} />
        </SectionCard>

        <SectionCard title="DRUG ALLERGIES" iconBg="#2563eb" icon={<PlusIcon />}>
          <p className="text-sm text-gray-800">
            {clinical?.has_drug_allergies
              ? (clinical.drug_allergy_details ?? "Yes — details not recorded")
              : "None recorded"}
          </p>
        </SectionCard>

        {/* Both contacts come from the profile's Emergency step. A card that
            shows "Not recorded" is honest; one that shows a placeholder
            stranger's number in an emergency is not. */}
        <SectionCard
          title="EMERGENCY CONTACT"
          titleColor="text-red-600"
          iconBg="#fecaca"
          icon={<PhoneIcon />}
        >
          {contact ? (
            <>
              <Field label="Name" value={contact.name} />
              {contact.relationship ? (
                <Field label="Relationship" value={contact.relationship} />
              ) : null}
              <Field label="Phone" value={contact.phone} />
              <CallLink
                phone={contact.phone}
                label="Call Emergency Contact"
                className="bg-red-600"
              />
            </>
          ) : (
            <p className="text-sm text-gray-800">
              Not recorded. Add one under Emergency when editing this profile.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="PRIMARY DOCTOR (ORGANISATION)"
          iconBg="#2563eb"
          icon={<StethoscopeIcon />}
        >
          {doctor ? (
            <>
              <Field label="Name" value={doctor.name} />
              {doctor.organisation ? (
                <Field label="Organisation" value={doctor.organisation} />
              ) : null}
              {doctor.phone ? (
                <>
                  <Field label="Phone" value={doctor.phone} />
                  <CallLink phone={doctor.phone} label="Call Doctor" className="bg-blue-600" />
                </>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-gray-800">
              Not recorded. Add one under Emergency when editing this profile.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
