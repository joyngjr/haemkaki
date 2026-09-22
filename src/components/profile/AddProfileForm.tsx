import { useState, type ReactNode } from "react";

import {
  type BloodType,
  type ClinicalProfile,
  type DiagnosisType,
  type FactorType,
  type MedicationDetails,
  type Profile,
} from "@/lib/api";
import { NumpadField } from "@/components/profile/NumpadField";
import { DrugAllergyField } from "@/components/profile/DrugAllergyField";
import {
  ALL_ROUTES,
  ALL_UNITS,
  matchedMedication,
  medicationSuggestions,
  type MedicationKind,
  type MedicationProduct,
} from "@/lib/medication-catalog";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

type YesNo = "yes" | "no";
type Sex = "male" | "female" | "other";
type Medication = MedicationDetails;

const STEPS = ["About you", "Diagnosis", "Treatment", "Emergency", "Preferences"];
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
const A_OR_B: DiagnosisType[] = [
  "haemophilia_a",
  "haemophilia_b",
  "symptomatic_carrier_a",
  "symptomatic_carrier_b",
];
const B_DIAGNOSES: DiagnosisType[] = ["haemophilia_b", "symptomatic_carrier_b"];
const inputClass =
  "mt-2 min-h-[48px] w-full rounded-2xl border border-sand-300 bg-white px-4 text-base text-sand-900 outline-none placeholder:text-sand-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

function Choice<T extends string>({
  options,
  value,
  onChange,
  columns = false,
}: {
  options: { value: T; label: string; description?: string }[];
  value: T | "";
  onChange: (value: T) => void;
  columns?: boolean;
}) {
  return (
    <div className={cn("mt-3 grid gap-2", columns ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-[48px] rounded-2xl border px-4 py-3 text-left transition-colors",
            value === option.value
              ? "border-teal-700 bg-teal-50 text-teal-950 ring-1 ring-teal-700"
              : "border-sand-300 bg-white text-sand-800 active:bg-sand-100",
          )}
        >
          <span className="block text-sm font-semibold">{option.label}</span>
          {option.description ? (
            <span className="mt-0.5 block text-xs leading-5 text-sand-600">
              {option.description}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function MultipleChoice<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: { value: T; label: string; description?: string }[];
  values: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2">
      {options.map((option) => {
        const selected = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(option.value)}
            className={cn(
              "min-h-[48px] rounded-2xl border px-4 py-3 text-left transition-colors",
              selected
                ? "border-teal-700 bg-teal-50 text-teal-950 ring-1 ring-teal-700"
                : "border-sand-300 bg-white text-sand-800 active:bg-sand-100",
            )}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            {option.description ? (
              <span className="mt-0.5 block text-xs leading-5 text-sand-600">
                {option.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-sand-900">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-sand-600">{hint}</span> : null}
      {children}
    </label>
  );
}

function MedicationFields({
  title,
  medication,
  onChange,
  kind,
  diagnosis,
  onRemove,
}: {
  title: string;
  medication: Medication;
  onChange: (next: Medication) => void;
  kind: MedicationKind;
  diagnosis: DiagnosisType;
  onRemove?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const update = (patch: Partial<Medication>) => onChange({ ...medication, ...patch });
  const product = matchedMedication(medication.name);
  const suggestions = medicationSuggestions(medication.name, kind, diagnosis);
  const units = product?.units ?? ALL_UNITS;
  const routes = product?.routes ?? ALL_ROUTES;

  function selectProduct(selected: MedicationProduct) {
    update({
      name: selected.name,
      unit: selected.units[0],
      administration: selected.routes[0],
    });
    setFocused(false);
  }

  return (
    <section className="space-y-4 rounded-3xl border border-sand-200 bg-sand-100/60 p-4">
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-sand-900">{title}</h3>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${medication.name || title}`}
            className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-red-700 active:bg-red-50"
          >
            Remove
          </button>
        ) : null}
      </div>
      <Field label="Prescribed medication or product name">
        <div className="relative">
          <input
            className={inputClass}
            value={medication.name}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            onChange={(event) => {
              const name = event.target.value;
              const exact = matchedMedication(name);
              update({
                name,
                unit: exact?.units[0] ?? "",
                administration: exact?.routes[0] ?? "",
              });
            }}
            autoComplete="off"
            placeholder="Type a product or medicine"
          />
          {focused && suggestions.length > 0 ? (
            <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-sand-200 bg-white shadow-xl">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectProduct(suggestion)}
                  className="flex min-h-[48px] w-full items-center justify-between border-b border-sand-100 px-4 py-2 text-left last:border-0 active:bg-teal-50"
                >
                  <span className="text-sm font-semibold text-sand-900">{suggestion.name}</span>
                  <span className="ml-3 text-right text-xs text-sand-500">
                    {suggestion.aliases[0]}
                    {suggestion.status ? (
                      <span className="block text-amber-700">{suggestion.status}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Field>
      <div className="grid grid-cols-[1fr_128px] gap-3">
        <NumpadField
          label="Dose"
          mode="decimal"
          value={medication.dose}
          onChange={(dose) => update({ dose })}
          placeholder="Enter dose"
        />
        <Field label="Unit">
          <select
            className={inputClass}
            value={medication.unit}
            onChange={(e) => update({ unit: e.target.value })}
            disabled={!medication.name}
          >
            {!medication.unit ? <option value="">Select</option> : null}
            {units.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </Field>
      </div>
      <NumpadField
        label="Frequency"
        mode="integer"
        value={medication.frequency}
        onChange={(frequency) => update({ frequency })}
        placeholder="Times per week"
        suffix="times/week"
        max={99}
      />
      <div>
        <p className="text-sm font-semibold text-sand-900">Route of administration</p>
        <Choice
          columns
          value={medication.administration}
          onChange={(administration) => update({ administration })}
          options={routes.map((route) => ({ value: route, label: route }))}
        />
      </div>
      <NumpadField
        label="Order when cover drops to"
        mode="decimal"
        value={medication.buffer_days}
        onChange={(buffer_days) => update({ buffer_days })}
        placeholder="Days left"
        suffix="days"
        max={365}
      />
    </section>
  );
}

function MedicationListFields({
  title,
  addLabel,
  medications,
  onChange,
  kind,
  diagnosis,
}: {
  title: string;
  addLabel: string;
  medications: Medication[];
  onChange: (next: Medication[]) => void;
  kind: MedicationKind;
  diagnosis: DiagnosisType;
}) {
  return (
    <div className="space-y-3">
      {medications.map((medication, index) => (
        <MedicationFields
          key={`${kind}-${index}`}
          title={`${title} ${index + 1}`}
          medication={medication}
          onChange={(next) =>
            onChange(medications.map((item, itemIndex) => (itemIndex === index ? next : item)))
          }
          kind={kind}
          diagnosis={diagnosis}
          onRemove={() => onChange(medications.filter((_, itemIndex) => itemIndex !== index))}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...medications, emptyMedication()])}
        className="min-h-[48px] w-full rounded-2xl border border-dashed border-teal-500 bg-teal-50 px-4 text-sm font-bold text-teal-900 active:bg-teal-100"
      >
        + {addLabel}
      </button>
    </div>
  );
}

function trackingFactor(diagnosis: DiagnosisType): FactorType {
  if (diagnosis === "haemophilia_a" || diagnosis === "symptomatic_carrier_a") return "VIII";
  if (diagnosis === "haemophilia_b" || diagnosis === "symptomatic_carrier_b") return "IX";
  if (diagnosis === "factor_xi_deficiency") return "XI";
  return diagnosis === "acquired_haemophilia" ? "acquired" : "unknown";
}

type TreatmentOption = { value: string; label: string; description?: string };

function treatmentOptions(diagnosis: DiagnosisType): TreatmentOption[] {
  if (diagnosis === "haemophilia_a" || diagnosis === "symptomatic_carrier_a")
    return [
      {
        value: "factor_replacement",
        label: "Factor replacement",
        description:
          "Examples: FVIII concentrates such as octocog alfa, efmoroctocog alfa or efanesoctocog alfa.",
      },
      {
        value: "non_factor_therapy",
        label: "Non-factor therapy",
        description:
          "Examples: emicizumab, fitusiran or marstacimab, depending on your prescribed plan.",
      },
      {
        value: "bypassing_therapy",
        label: "Bypassing therapy",
        description: "Examples: recombinant factor VIIa (NovoSeven) or aPCC (FEIBA).",
      },
      {
        value: "none",
        label: "No regular preventative treatment",
      },
    ];
  if (diagnosis === "haemophilia_b" || diagnosis === "symptomatic_carrier_b")
    return [
      {
        value: "factor_replacement",
        label: "Factor replacement",
        description:
          "Examples: FIX concentrates such as nonacog alfa, eftrenonacog alfa or albutrepenonacog alfa.",
      },
      {
        value: "non_factor_therapy",
        label: "Non-factor therapy",
        description:
          "Examples may include fitusiran, concizumab or marstacimab when locally approved and prescribed.",
      },
      {
        value: "bypassing_therapy",
        label: "Bypassing therapy",
        description:
          "Example: recombinant factor VIIa; aPCC requires special caution with FIX allergy.",
      },
      {
        value: "none",
        label: "No regular preventative treatment",
      },
    ];
  if (diagnosis === "factor_xi_deficiency")
    return [
      {
        value: "specialist_plan",
        label: "A prescribed treatment plan",
        description:
          "Examples for procedures may include tranexamic acid, FXI concentrate or plasma—only as directed by your care team.",
      },
      {
        value: "none",
        label: "No regular preventative treatment",
      },
    ];
  if (diagnosis === "acquired_haemophilia")
    return [
      {
        value: "specialist_plan",
        label: "A specialist-prescribed treatment plan",
        description: "Examples: recombinant factor VIIa, aPCC or recombinant porcine FVIII.",
      },
      {
        value: "none",
        label: "No regular preventative treatment",
      },
    ];
  return [
    {
      value: "specialist_plan",
      label: "A prescribed treatment plan",
    },
    {
      value: "none",
      label: "No regular preventative treatment",
    },
  ];
}

const emptyMedication = (): Medication => ({
  name: "",
  dose: "",
  unit: "",
  frequency: "",
  administration: "",
  buffer_days: "",
});

function medicationForStorage(medication: Medication): Medication {
  return {
    ...medication,
    frequency: medication.frequency ? `${medication.frequency} times per week` : "",
    buffer_days: medication.buffer_days ? `${medication.buffer_days} days` : "",
  };
}

function medicationsForStorage(medications: Medication[]): Medication | null {
  const populated = medications.filter((medication) => medication.name.trim());
  if (!populated.length) return null;

  const stored = populated.map(medicationForStorage);
  if (stored.length === 1) return stored[0];
  return { ...stored[0], items_json: JSON.stringify(stored) };
}

function allergyDetailsForStorage(allergies: string[], notes: string) {
  const drugNames = allergies.join(", ");
  return notes.trim() ? `${drugNames}. Reaction details: ${notes.trim()}` : drugNames;
}

function medicationsFromStorage(medication: Medication | null): Medication[] {
  if (!medication) return [emptyMedication()];

  let stored = [medication];
  if (medication.items_json) {
    try {
      const parsed = JSON.parse(medication.items_json) as Medication[];
      if (Array.isArray(parsed) && parsed.length > 0) stored = parsed;
    } catch {
      // Fall back to the first medication if older stored data cannot be parsed.
    }
  }

  return stored.map((item) => ({
    ...emptyMedication(),
    ...item,
    frequency: (item.frequency ?? "").replace(/\s*times per week$/i, ""),
    buffer_days: (item.buffer_days ?? "").replace(/\s*days?$/i, ""),
  }));
}

const LEGACY_TREATMENTS: Record<string, string> = {
  "Factor replacement": "factor_replacement",
  "Non-factor therapy": "non_factor_therapy",
  "Bypassing therapy": "bypassing_therapy",
  "A prescribed treatment plan": "specialist_plan",
  "A specialist-prescribed treatment plan": "specialist_plan",
  "No regular preventative treatment": "none",
};

function treatmentsFromStorage(value: string | null | undefined): string[] {
  if (!value) return ["factor_replacement"];
  return value
    .split(",")
    .map((treatment) => treatment.trim())
    .filter(Boolean)
    .map((treatment) => LEGACY_TREATMENTS[treatment] ?? treatment);
}

function allergyDetailsFromStorage(details: string | null): {
  allergies: string[];
  notes: string;
} {
  if (!details) return { allergies: [], notes: "" };
  const marker = ". Reaction details: ";
  const markerIndex = details.indexOf(marker);
  const drugNames = markerIndex >= 0 ? details.slice(0, markerIndex) : details;
  return {
    allergies: drugNames
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
    notes: markerIndex >= 0 ? details.slice(markerIndex + marker.length) : "",
  };
}

/** The API's own rule for a phone: something to dial, however it is spaced. */
function hasDigits(value: string): boolean {
  return value.replace(/\D/g, "").length >= 3;
}

function diagnosisFromProfile(profile?: Profile): DiagnosisType {
  if (profile?.clinical_profile) return profile.clinical_profile.diagnosis;
  if (profile?.factor_type === "VIII") return "haemophilia_a";
  if (profile?.factor_type === "IX") return "haemophilia_b";
  if (profile?.factor_type === "XI") return "factor_xi_deficiency";
  if (profile?.factor_type === "acquired") return "acquired_haemophilia";
  return "haemophilia_a";
}

export function AddProfileForm({
  onDone,
  onCancel,
  profile,
}: {
  onDone: () => void;
  onCancel: () => void;
  profile?: Profile;
}) {
  const { createProfile, updateProfile } = useProfiles();
  const clinical = profile?.clinical_profile;
  const allergyDetails = allergyDetailsFromStorage(clinical?.drug_allergy_details ?? null);
  const editing = Boolean(profile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name ?? "");
  const [sex, setSex] = useState<Sex | "">(
    clinical && ["male", "female", "other"].includes(clinical.sex) ? (clinical.sex as Sex) : "",
  );
  const [weightKg, setWeightKg] = useState(clinical?.weight_kg?.toString() ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(clinical?.date_of_birth ?? "");
  const [hasAllergies, setHasAllergies] = useState<YesNo | "">(
    clinical ? (clinical.has_drug_allergies ? "yes" : "no") : "",
  );
  const [drugAllergies, setDrugAllergies] = useState<string[]>(allergyDetails.allergies);
  const [allergyNotes, setAllergyNotes] = useState(allergyDetails.notes);
  const [diagnosis, setDiagnosis] = useState<DiagnosisType>(diagnosisFromProfile(profile));
  const [congenitalSeverity, setCongenitalSeverity] = useState(clinical?.congenital_severity ?? "");
  const [xiLevel, setXiLevel] = useState(clinical?.factor_xi_deficiency_level ?? "");
  const [diagnosisTestDate, setDiagnosisTestDate] = useState(clinical?.diagnosis_test_date ?? "");
  const [inhibitorStatus, setInhibitorStatus] = useState(clinical?.inhibitor_status ?? "unknown");
  const [fixAllergy, setFixAllergy] = useState(clinical?.fix_allergy_or_anaphylaxis ?? "unknown");
  const [acquiredTitre, setAcquiredTitre] = useState(
    clinical?.acquired_inhibitor_titre_bu_ml?.toString() ?? "",
  );
  const [acquiredBleeding, setAcquiredBleeding] = useState(
    clinical?.acquired_bleeding_severity ?? "unknown",
  );
  const [treatments, setTreatments] = useState<string[]>(
    treatmentsFromStorage(clinical?.treatment_approach),
  );
  const [prophylacticMedications, setProphylacticMedications] = useState<Medication[]>(
    medicationsFromStorage(clinical?.prophylactic_medication ?? null),
  );
  const [takesOnDemand, setTakesOnDemand] = useState<YesNo>(
    clinical?.on_demand_medication ? "yes" : "no",
  );
  const [onDemandMedications, setOnDemandMedications] = useState<Medication[]>(
    medicationsFromStorage(clinical?.on_demand_medication ?? null),
  );
  const [takesOther, setTakesOther] = useState<YesNo>(clinical?.other_medication ? "yes" : "no");
  const [otherMedications, setOtherMedications] = useState<Medication[]>(
    medicationsFromStorage(clinical?.other_medication ?? null),
  );
  const [reminders, setReminders] = useState<YesNo>(
    clinical ? (clinical.medication_reminders ? "yes" : "no") : "yes",
  );
  const [bloodType, setBloodType] = useState<BloodType | "">(clinical?.blood_type ?? "");
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

  const isCongenital = A_OR_B.includes(diagnosis);
  const isB = B_DIAGNOSES.includes(diagnosis);
  const treatmentChoices = treatmentOptions(diagnosis);
  const hasPreventativeTreatment = treatments.some((treatment) => treatment !== "none");
  // Every "About you" field is required. The date input's max stops future dates
  // in the picker, but typed values bypass it, so check again here.
  const today = new Date().toISOString().slice(0, 10);
  const aboutYouComplete =
    Boolean(name.trim()) &&
    sex !== "" &&
    weightKg !== "" &&
    Number.isFinite(Number(weightKg)) &&
    Number(weightKg) > 0 &&
    Number(weightKg) <= 500 &&
    dateOfBirth !== "" &&
    dateOfBirth <= today &&
    hasAllergies !== "" &&
    (hasAllergies === "no" || drugAllergies.length > 0);
  const diagnosisComplete =
    (!isCongenital && diagnosis !== "factor_xi_deficiency") ||
    (isCongenital ? congenitalSeverity !== "" : xiLevel !== "");
  // The Medical ID card is for a responder, so a contact is either complete
  // enough to call or left off entirely — never a name with nothing to dial.
  const contactStarted = Boolean(
    contactName.trim() || contactRelationship.trim() || contactPhone.trim(),
  );
  const contactComplete = !contactStarted || Boolean(contactName.trim() && hasDigits(contactPhone));
  const doctorStarted = Boolean(
    doctorName.trim() || doctorOrganisation.trim() || doctorPhone.trim(),
  );
  const doctorComplete =
    !doctorStarted || Boolean(doctorName.trim() && (!doctorPhone.trim() || hasDigits(doctorPhone)));
  const emergencyComplete = contactComplete && doctorComplete;
  const canContinue =
    step === 0
      ? aboutYouComplete
      : step === 1
        ? diagnosisComplete
        : step === 3
          ? emergencyComplete
          : true;

  function toggleTreatment(treatment: string) {
    setTreatments((current) => {
      if (treatment === "none") return ["none"];

      const selected = current.filter((item) => item !== "none");
      if (!selected.includes(treatment)) return [...selected, treatment];
      return selected.length > 1 ? selected.filter((item) => item !== treatment) : selected;
    });
  }

  function selectDiagnosis(next: DiagnosisType) {
    setDiagnosis(next);
    setCongenitalSeverity("");
    setXiLevel("");
    setDiagnosisTestDate("");
    setTreatments([treatmentOptions(next)[0].value]);
    setProphylacticMedications([emptyMedication()]);
    setTakesOnDemand("no");
    setOnDemandMedications([emptyMedication()]);
    setTakesOther("no");
    setOtherMedications([emptyMedication()]);
  }

  async function saveCompletedProfile() {
    // Profile saving is intentionally available only through the explicit
    // button on Preferences. Enter/Done from an earlier text field must never
    // submit the multi-step form or skip a page.
    if (step !== STEPS.length - 1 || !aboutYouComplete || saving) return;

    setSaving(true);
    setError(null);
    const minimumBufferDays =
      prophylacticMedications.find((item) => item.buffer_days)?.buffer_days ||
      onDemandMedications.find((item) => item.buffer_days)?.buffer_days;
    const clinicalProfile: ClinicalProfile = {
      diagnosis,
      sex,
      weight_kg: Number(weightKg),
      date_of_birth: dateOfBirth,
      has_drug_allergies: hasAllergies === "yes",
      drug_allergy_details:
        hasAllergies === "yes" ? allergyDetailsForStorage(drugAllergies, allergyNotes) : null,
      diagnosis_factor_activity_percent: clinical?.diagnosis_factor_activity_percent ?? null,
      diagnosis_test_date:
        isCongenital || diagnosis === "factor_xi_deficiency" ? diagnosisTestDate || null : null,
      congenital_severity: isCongenital ? congenitalSeverity || null : null,
      factor_xi_deficiency_level: diagnosis === "factor_xi_deficiency" ? xiLevel || null : null,
      acquired_inhibitor_titre_bu_ml:
        diagnosis === "acquired_haemophilia" && acquiredTitre ? Number(acquiredTitre) : null,
      acquired_bleeding_severity: diagnosis === "acquired_haemophilia" ? acquiredBleeding : null,
      inhibitor_status: isCongenital ? inhibitorStatus : null,
      fix_allergy_or_anaphylaxis: isB ? fixAllergy : null,
      treatment_approach: treatments.join(",") || null,
      prophylactic_medication: hasPreventativeTreatment
        ? medicationsForStorage(prophylacticMedications)
        : null,
      minimum_buffer: minimumBufferDays ? `${minimumBufferDays} days` : null,
      minimum_buffer_days: minimumBufferDays ? Number(minimumBufferDays) : null,
      on_demand_medication:
        takesOnDemand === "yes" ? medicationsForStorage(onDemandMedications) : null,
      other_medication: takesOther === "yes" ? medicationsForStorage(otherMedications) : null,
      medication_reminders: reminders === "yes",
      blood_type: bloodType || null,
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
      const draft = {
        name: name.trim(),
        factor_type: trackingFactor(diagnosis),
        clinical_profile: clinicalProfile,
      };
      if (profile) await updateProfile(profile.id, draft);
      else await createProfile(draft);
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the profile");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="pb-1">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">
          {editing ? "Edit profile" : "New profile"}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-sand-900">
          {editing ? "Update your care details" : "Let’s tailor your care space"}
        </h2>
      </div>
      <ol aria-label="Profile creation progress" className="mb-7 grid grid-cols-5 gap-1">
        {STEPS.map((label, index) => (
          <li key={label} className="min-w-0">
            <div
              className={cn("h-1.5 rounded-full", index <= step ? "bg-teal-700" : "bg-sand-200")}
            />
            <span
              className={cn(
                "mt-2 block truncate text-[10px] font-semibold",
                index === step ? "text-teal-800" : "text-sand-500",
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      <div className="space-y-5">
        {step === 0 ? (
          <>
            <Field label="Name">
              <input
                autoFocus
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="How should we address you?"
              />
            </Field>
            <div>
              <p className="text-sm font-semibold text-sand-900">Biological sex</p>
              <Choice
                columns
                value={sex}
                onChange={setSex}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Others" },
                ]}
              />
            </div>
            <NumpadField
              label="Date of birth"
              mode="date"
              required
              max={today}
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="DD / MM / YYYY"
            />
            <NumpadField
              label="Weight"
              mode="decimal"
              required
              max={500}
              value={weightKg}
              onChange={setWeightKg}
              placeholder="Enter weight"
              suffix="kg"
            />
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
          </>
        ) : null}
        {step === 1 ? (
          <>
            <div>
              <p className="text-sm font-semibold text-sand-900">Diagnosis</p>
              <Choice
                value={diagnosis}
                onChange={selectDiagnosis}
                options={[
                  {
                    value: "haemophilia_a",
                    label: "Haemophilia A",
                    description: "Factor VIII deficiency",
                  },
                  {
                    value: "haemophilia_b",
                    label: "Haemophilia B",
                    description: "Factor IX deficiency",
                  },
                  {
                    value: "factor_xi_deficiency",
                    label: "Factor XI deficiency",
                    description: "Sometimes called haemophilia C",
                  },
                  {
                    value: "acquired_haemophilia",
                    label: "Acquired haemophilia",
                    description: "Usually acquired haemophilia A",
                  },
                  {
                    value: "symptomatic_carrier_a",
                    label: "Symptomatic carrier — A",
                    description: "A carrier with reduced FVIII activity",
                  },
                  {
                    value: "symptomatic_carrier_b",
                    label: "Symptomatic carrier — B",
                    description: "A carrier with reduced FIX activity",
                  },
                  { value: "other_or_unknown", label: "Another diagnosis or not sure" },
                ]}
              />
            </div>
            {isCongenital || diagnosis === "factor_xi_deficiency" ? (
              <div className="space-y-4 rounded-3xl bg-teal-50 p-4">
                <p className="text-sm font-bold text-teal-950">Severity at diagnosis</p>
                {isCongenital ? (
                  <Choice
                    value={congenitalSeverity}
                    onChange={setCongenitalSeverity}
                    options={[
                      { value: "severe", label: "Severe", description: "Below 1% factor activity" },
                      { value: "moderate", label: "Moderate", description: "1–5% factor activity" },
                      {
                        value: "mild",
                        label: "Mild",
                        description: "Above 5% and below 40% factor activity",
                      },
                      { value: "not_known", label: "Not known" },
                    ]}
                  />
                ) : (
                  <>
                    <Choice
                      value={xiLevel}
                      onChange={setXiLevel}
                      options={[
                        {
                          value: "severe_deficiency",
                          label: "Severe deficiency",
                          description: "Below 15–20%",
                        },
                        {
                          value: "partial_deficiency",
                          label: "Partial / mild deficiency",
                          description: "20–70%",
                        },
                        { value: "not_known", label: "Not known" },
                      ]}
                    />
                  </>
                )}
                <NumpadField
                  label="Date of diagnostic blood test (optional)"
                  mode="date"
                  max={today}
                  value={diagnosisTestDate}
                  onChange={setDiagnosisTestDate}
                  placeholder="DD / MM / YYYY"
                />
              </div>
            ) : null}
            {diagnosis === "acquired_haemophilia" ? (
              <>
                <Field label="Inhibitor titre (Bethesda units/mL)">
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={acquiredTitre}
                    onChange={(e) => setAcquiredTitre(e.target.value)}
                    placeholder="If known"
                  />
                </Field>
                <div>
                  <p className="text-sm font-semibold text-sand-900">Clinical bleeding severity</p>
                  <Choice
                    value={acquiredBleeding}
                    onChange={setAcquiredBleeding}
                    options={[
                      { value: "life_threatening_or_major", label: "Life-threatening / major" },
                      {
                        value: "moderate_or_non_life_threatening",
                        label: "Moderate / non-life-threatening",
                      },
                      { value: "unknown", label: "Not known" },
                    ]}
                  />
                </div>
              </>
            ) : null}
            {isCongenital ? (
              <div>
                <p className="text-sm font-semibold text-sand-900">Inhibitor status</p>
                <Choice
                  value={inhibitorStatus}
                  onChange={setInhibitorStatus}
                  options={[
                    {
                      value: "current",
                      label: "Current inhibitor",
                    },
                    {
                      value: "previous",
                      label: "Previous inhibitor",
                    },
                    {
                      value: "none_known",
                      label: "No known inhibitor",
                    },
                    {
                      value: "unknown",
                      label: "Not sure",
                    },
                  ]}
                />
              </div>
            ) : null}
            {isB ? (
              <div>
                <p className="text-sm font-semibold text-sand-900">
                  History of FIX allergy or anaphylaxis?
                </p>
                <Choice
                  columns
                  value={fixAllergy}
                  onChange={setFixAllergy}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "unknown", label: "Not sure" },
                  ]}
                />
              </div>
            ) : null}
          </>
        ) : null}
        {step === 2 ? (
          <>
            <div>
              <p className="text-sm font-semibold text-sand-900">Current treatment approach</p>
              <p className="mt-1 text-xs leading-5 text-sand-600">Select all that apply.</p>
              <MultipleChoice
                values={treatments}
                onToggle={toggleTreatment}
                options={treatmentChoices}
              />
            </div>
            {hasPreventativeTreatment ? (
              <>
                <MedicationListFields
                  title="Regular preventative medication"
                  addLabel="Add another regular medication"
                  medications={prophylacticMedications}
                  onChange={setProphylacticMedications}
                  kind="prophylaxis"
                  diagnosis={diagnosis}
                />
              </>
            ) : null}
            <div>
              <p className="text-sm font-semibold text-sand-900">
                Do you take on-demand medication?
              </p>
              <Choice
                columns
                value={takesOnDemand}
                onChange={setTakesOnDemand}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            </div>
            {takesOnDemand === "yes" ? (
              <MedicationListFields
                title="On-demand medication"
                addLabel="Add another on-demand medication"
                medications={onDemandMedications}
                onChange={setOnDemandMedications}
                kind="onDemand"
                diagnosis={diagnosis}
              />
            ) : null}
            <div>
              <p className="text-sm font-semibold text-sand-900">Any other medications?</p>
              <Choice
                columns
                value={takesOther}
                onChange={setTakesOther}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            </div>
            {takesOther === "yes" ? (
              <MedicationListFields
                title="Other medication"
                addLabel="Add another medication"
                medications={otherMedications}
                onChange={setOtherMedications}
                kind="other"
                diagnosis={diagnosis}
              />
            ) : null}
          </>
        ) : null}
        {step === 3 ? (
          <>
            <div>
              <p className="text-sm font-semibold text-sand-900">Blood type</p>
              <Choice
                columns
                value={bloodType}
                onChange={setBloodType}
                options={BLOOD_TYPE_OPTIONS}
              />
            </div>
            <section className="space-y-4 rounded-3xl border border-sand-200 bg-sand-100/60 p-4">
              <h3 className="text-sm font-bold text-sand-900">Emergency contact (optional)</h3>
              <Field label="Name">
                <input
                  className={inputClass}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  maxLength={80}
                  placeholder="Who should be called first?"
                />
              </Field>
              <Field label="Relationship (optional)">
                <input
                  className={inputClass}
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
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
                  onChange={(e) => setContactPhone(e.target.value)}
                  maxLength={32}
                  placeholder="+65 9123 4567"
                />
              </Field>
            </section>
            <section className="space-y-4 rounded-3xl border border-sand-200 bg-sand-100/60 p-4">
              <h3 className="text-sm font-bold text-sand-900">
                Primary doctor or treatment centre (optional)
              </h3>
              <Field label="Name">
                <input
                  className={inputClass}
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  maxLength={80}
                  placeholder="Doctor's name"
                />
              </Field>
              <Field label="Organisation (optional)">
                <input
                  className={inputClass}
                  value={doctorOrganisation}
                  onChange={(e) => setDoctorOrganisation(e.target.value)}
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
                  onChange={(e) => setDoctorPhone(e.target.value)}
                  maxLength={32}
                  placeholder="+65 6772 2222"
                />
              </Field>
            </section>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <div>
              <p className="text-sm font-semibold text-sand-900">
                Would you like reminders to order and take medication?
              </p>
              <Choice
                columns
                value={reminders}
                onChange={setReminders}
                options={[
                  { value: "yes", label: "Yes, remind me" },
                  { value: "no", label: "No thanks" },
                ]}
              />
            </div>
          </>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-5 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="mt-7 flex gap-3 border-t border-sand-200 pt-5">
        <button
          type="button"
          onClick={step === 0 ? onCancel : () => setStep((current) => current - 1)}
          className="min-h-[48px] flex-1 rounded-2xl border border-sand-300 bg-white px-4 text-sm font-bold text-sand-700"
        >
          {step === 0 ? "Cancel" : "Back"}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((current) => current + 1)}
            className="min-h-[48px] flex-1 rounded-2xl bg-teal-800 px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void saveCompletedProfile()}
            disabled={!aboutYouComplete || saving}
            className="min-h-[48px] flex-1 rounded-2xl bg-teal-800 px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create profile"}
          </button>
        )}
      </div>
    </form>
  );
}
