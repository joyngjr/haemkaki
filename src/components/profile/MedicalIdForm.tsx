import { useState } from "react";

import {
  emptyClinicalProfile,
  medicationForStorage,
  medicationFromStorage,
  type MedicationDraft,
} from "@/components/profile/clinical-profile";
import { DrugAllergyField } from "@/components/profile/DrugAllergyField";
import { Choice, Field, FormSection, inputClass } from "@/components/profile/form-fields";
import { MedicationFields } from "@/components/profile/MedicationFields";
import { NumericField } from "@/components/profile/NumericField";
import { type BloodType, type ClinicalProfile, type Profile } from "@/lib/api";
import { getSingaporeTodayKey } from "@/lib/tracker-dates";
import { useProfiles } from "@/state/profile-context";

type YesNo = "yes" | "no";

const BLOOD_TYPE_OPTIONS: { value: BloodType; label: string }[] = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A−" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B−" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB−" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O−" },
  { value: "unknown", label: "Not known" },
];

const CONGENITAL_SEVERITY = [
  { value: "severe", label: "Severe", description: "Below 1% factor activity" },
  { value: "moderate", label: "Moderate", description: "1–5% factor activity" },
  { value: "mild", label: "Mild", description: "Above 5% and below 40% factor activity" },
  { value: "not_known", label: "Not known" },
];

const FACTOR_XI_LEVEL = [
  { value: "severe_deficiency", label: "Severe deficiency", description: "Below 15–20%" },
  { value: "partial_deficiency", label: "Partial / mild deficiency", description: "20–70%" },
  { value: "not_known", label: "Not known" },
];

const ACQUIRED_BLEEDING = [
  { value: "life_threatening_or_major", label: "Life-threatening / major" },
  { value: "moderate_or_non_life_threatening", label: "Moderate / non-life-threatening" },
  { value: "unknown", label: "Not known" },
];

const CONGENITAL: string[] = [
  "haemophilia_a",
  "haemophilia_b",
  "symptomatic_carrier_a",
  "symptomatic_carrier_b",
];

/** The API's own rule for a phone: something to dial, however it is spaced. */
function hasDigits(value: string): boolean {
  return value.replace(/\D/g, "").length >= 3;
}

function allergyDetailsForStorage(allergies: string[], notes: string): string {
  const drugNames = allergies.join(", ");
  return notes.trim() ? `${drugNames}. Reaction details: ${notes.trim()}` : drugNames;
}

function allergyDetailsFromStorage(details: string | null): { allergies: string[]; notes: string } {
  if (!details) return { allergies: [], notes: "" };
  const marker = ". Reaction details: ";
  const markerIndex = details.indexOf(marker);
  const drugNames = markerIndex >= 0 ? details.slice(0, markerIndex) : details;
  return {
    allergies: drugNames
      .split(",")
      .map((drug) => drug.trim())
      .filter(Boolean),
    notes: markerIndex >= 0 ? details.slice(markerIndex + marker.length) : "",
  };
}

/**
 * Everything the Medical ID card shows, edited in place on the card's own page.
 *
 * All of it is optional: the card prints "Not recorded" for anything missing,
 * which is honest, where a placeholder stranger's phone number would not be.
 * A contact is the one exception — it needs a name and a number before it is
 * worth showing a responder at all, so it is either complete or left off.
 *
 * Onboarding owns the name, diagnosis and regular medication, and the
 * tracker's routine owns the supply buffer; this form spreads what is stored
 * and overrides only its own fields.
 */
export function MedicalIdForm({
  profile,
  onDone,
  onCancel,
}: {
  profile: Profile;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { updateProfile } = useProfiles();
  const clinical = profile.clinical_profile;
  const diagnosis = clinical?.diagnosis ?? "other_or_unknown";
  const storedAllergies = allergyDetailsFromStorage(clinical?.drug_allergy_details ?? null);
  // Singapore, not UTC: before 08:00 local the browser's own UTC date is still
  // yesterday, which greys today out of the date picker.
  const today = getSingaporeTodayKey();

  const [dateOfBirth, setDateOfBirth] = useState(clinical?.date_of_birth ?? "");
  const [bloodType, setBloodType] = useState<BloodType | "">(clinical?.blood_type ?? "");
  const [severity, setSeverity] = useState(
    clinical?.congenital_severity ??
      clinical?.factor_xi_deficiency_level ??
      clinical?.acquired_bleeding_severity ??
      "",
  );
  const [hasAllergies, setHasAllergies] = useState<YesNo | "">(
    clinical ? (clinical.has_drug_allergies ? "yes" : "no") : "",
  );
  const [drugAllergies, setDrugAllergies] = useState<string[]>(storedAllergies.allergies);
  const [allergyNotes, setAllergyNotes] = useState(storedAllergies.notes);
  const [onDemand, setOnDemand] = useState<MedicationDraft>(
    medicationFromStorage(clinical?.on_demand_medication ?? null),
  );
  const [contactName, setContactName] = useState(clinical?.emergency_contact?.name ?? "");
  const [contactRelationship, setContactRelationship] = useState(
    clinical?.emergency_contact?.relationship ?? "",
  );
  const [contactPhone, setContactPhone] = useState(clinical?.emergency_contact?.phone ?? "");
  const [doctorName, setDoctorName] = useState(clinical?.primary_doctor?.name ?? "");
  const [doctorOrganisation, setDoctorOrganisation] = useState(
    clinical?.primary_doctor?.organisation ?? "",
  );
  const [doctorPhone, setDoctorPhone] = useState(clinical?.primary_doctor?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCongenital = CONGENITAL.includes(diagnosis);
  const severityOptions = isCongenital
    ? CONGENITAL_SEVERITY
    : diagnosis === "factor_xi_deficiency"
      ? FACTOR_XI_LEVEL
      : diagnosis === "acquired_haemophilia"
        ? ACQUIRED_BLEEDING
        : null;

  // A contact is either complete enough to call or left off entirely — never a
  // name with nothing to dial.
  const contactStarted = Boolean(
    contactName.trim() || contactRelationship.trim() || contactPhone.trim(),
  );
  const contactComplete = !contactStarted || Boolean(contactName.trim() && hasDigits(contactPhone));
  const doctorStarted = Boolean(
    doctorName.trim() || doctorOrganisation.trim() || doctorPhone.trim(),
  );
  const doctorComplete =
    !doctorStarted || Boolean(doctorName.trim() && (!doctorPhone.trim() || hasDigits(doctorPhone)));
  const datesValid = !dateOfBirth || dateOfBirth <= today;
  const canSave = contactComplete && doctorComplete && datesValid && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const clinicalProfile: ClinicalProfile = {
      ...(clinical ?? emptyClinicalProfile(diagnosis)),
      date_of_birth: dateOfBirth || null,
      blood_type: bloodType || null,
      congenital_severity: isCongenital ? severity || null : null,
      factor_xi_deficiency_level: diagnosis === "factor_xi_deficiency" ? severity || null : null,
      acquired_bleeding_severity: diagnosis === "acquired_haemophilia" ? severity || null : null,
      has_drug_allergies: hasAllergies === "yes",
      drug_allergy_details:
        hasAllergies === "yes" ? allergyDetailsForStorage(drugAllergies, allergyNotes) : null,
      on_demand_medication: medicationForStorage(onDemand),
      emergency_contact: contactName.trim()
        ? {
            name: contactName.trim(),
            relationship: contactRelationship.trim(),
            phone: contactPhone.trim(),
          }
        : null,
      primary_doctor: doctorName.trim()
        ? {
            name: doctorName.trim(),
            organisation: doctorOrganisation.trim(),
            phone: doctorPhone.trim() || null,
          }
        : null,
    };
    try {
      await updateProfile(profile.id, { clinical_profile: clinicalProfile });
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your Medical ID");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="pb-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brick-700">Medical ID</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-sand-900">
          What a responder should know
        </h1>
        <p className="mt-2 text-sm leading-6 text-sand-600">
          Everything here is optional and shows on your card. Leave out anything you would rather
          not record — the card says what is missing rather than guessing.
        </p>
      </div>

      <div className="space-y-5">
        <FormSection title="Patient details">
          <NumericField
            label="Date of birth"
            mode="date"
            max={today}
            value={dateOfBirth}
            onChange={setDateOfBirth}
          />
          <div>
            <p className="text-sm font-semibold text-sand-900">Blood type</p>
            <Choice
              columns
              value={bloodType}
              onChange={setBloodType}
              options={BLOOD_TYPE_OPTIONS}
            />
          </div>
        </FormSection>

        {severityOptions ? (
          <FormSection title="Severity at diagnosis">
            <p className="text-xs leading-5 text-sand-600">
              {diagnosis === "acquired_haemophilia"
                ? "How your care team described the bleeding."
                : "Use the severity recorded when you were diagnosed, before regular prophylaxis began — not a result measured after treatment."}
            </p>
            {diagnosis === "factor_xi_deficiency" ? (
              <p className="text-xs leading-5 text-sand-600">
                Factor XI activity does not reliably predict bleeding severity.
              </p>
            ) : null}
            <Choice value={severity} onChange={setSeverity} options={severityOptions} />
          </FormSection>
        ) : null}

        <FormSection title="Drug allergies">
          <div>
            <p className="text-sm font-semibold text-sand-900">Any drug allergies?</p>
            <Choice
              columns
              value={hasAllergies}
              onChange={setHasAllergies}
              options={[
                { value: "yes", label: "Yes — please indicate" },
                { value: "no", label: "No" },
              ]}
            />
            {hasAllergies === "yes" ? (
              <DrugAllergyField
                value={drugAllergies}
                onChange={setDrugAllergies}
                notes={allergyNotes}
                onNotesChange={setAllergyNotes}
              />
            ) : null}
          </div>
        </FormSection>

        <FormSection title="What you take for a bleed">
          <p className="text-xs leading-5 text-sand-600">
            Your on-demand medication, if you have one. It joins your regular medication on the
            card&rsquo;s current-medication line.
          </p>
          <MedicationFields
            medication={onDemand}
            onChange={setOnDemand}
            kind="onDemand"
            diagnosis={diagnosis}
          />
        </FormSection>

        <FormSection title="Emergency contact">
          <p className="text-xs leading-5 text-sand-600">
            A contact needs a name and a number before it appears on the card.
          </p>
          <Field label="Name">
            <input
              className={inputClass}
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              maxLength={80}
              placeholder="Who should be called first?"
            />
          </Field>
          <Field label="Relationship">
            <input
              className={inputClass}
              value={contactRelationship}
              onChange={(event) => setContactRelationship(event.target.value)}
              maxLength={40}
              placeholder="For example, mother or partner"
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              maxLength={32}
              placeholder="+65 9123 4567"
            />
          </Field>
        </FormSection>

        <FormSection title="Primary doctor or treatment centre">
          <Field label="Name">
            <input
              className={inputClass}
              value={doctorName}
              onChange={(event) => setDoctorName(event.target.value)}
              maxLength={80}
              placeholder="Doctor's name"
            />
          </Field>
          <Field label="Organisation">
            <input
              className={inputClass}
              value={doctorOrganisation}
              onChange={(event) => setDoctorOrganisation(event.target.value)}
              maxLength={120}
              placeholder="Hospital or clinic"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={doctorPhone}
              onChange={(event) => setDoctorPhone(event.target.value)}
              maxLength={32}
              placeholder="+65 6772 2222"
            />
          </Field>
        </FormSection>
      </div>

      {error ? (
        <p role="alert" className="mt-5 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-7 flex gap-3 border-t border-sand-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] flex-1 rounded-2xl border border-sand-300 bg-white px-4 text-sm font-bold text-sand-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSave}
          className="min-h-[48px] flex-1 rounded-2xl bg-teal-800 px-4 text-sm font-bold text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Medical ID"}
        </button>
      </div>
    </form>
  );
}
