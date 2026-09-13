import { useState, type ReactNode } from "react";

import {
  type ClinicalProfile,
  type DiagnosisType,
  type FactorType,
  type MedicationDetails,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

type YesNo = "yes" | "no";
type Sex = "male" | "female" | "other" | "prefer_not_to_say";
type Unit = "mg" | "ml" | "IU" | "mcg" | "IU/kg" | "mcg/kg";
type Medication = MedicationDetails & { unit: Unit };

const STEPS = ["About you", "Diagnosis", "Treatment", "Preferences"];
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
  value: T;
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
            <span className="mt-0.5 block text-xs leading-5 text-sand-600">{option.description}</span>
          ) : null}
        </button>
      ))}
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
  showMode = true,
}: {
  title: string;
  medication: Medication;
  onChange: (next: Medication) => void;
  showMode?: boolean;
}) {
  const update = (patch: Partial<Medication>) => onChange({ ...medication, ...patch });
  return (
    <section className="space-y-4 rounded-3xl border border-sand-200 bg-sand-100/60 p-4">
      <h3 className="text-sm font-bold text-sand-900">{title}</h3>
      <Field label="Prescribed medication or product name">
        <input className={inputClass} value={medication.name} onChange={(e) => update({ name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-[1fr_112px] gap-3">
        <Field label="Dose">
          <input className={inputClass} inputMode="decimal" value={medication.dose} onChange={(e) => update({ dose: e.target.value })} placeholder="e.g. 500" />
        </Field>
        <Field label="Unit">
          <select className={inputClass} value={medication.unit} onChange={(e) => update({ unit: e.target.value as Unit })}>
            {(["mg", "ml", "IU", "mcg", "IU/kg", "mcg/kg"] as Unit[]).map((unit) => <option key={unit}>{unit}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Frequency">
        <input className={inputClass} value={medication.frequency} onChange={(e) => update({ frequency: e.target.value })} placeholder="e.g. Monday, Wednesday, Friday" />
      </Field>
      {showMode ? <div><p className="text-sm font-semibold text-sand-900">Route of administration</p><Choice columns value={medication.administration} onChange={(administration) => update({ administration })} options={["IV infusion", "Subcutaneous", "Pill", "IM injection", "Syrup", "Other"].map((label) => ({ value: label, label }))} /></div> : null}
    </section>
  );
}

function trackingFactor(diagnosis: DiagnosisType): FactorType {
  if (diagnosis === "haemophilia_a" || diagnosis === "symptomatic_carrier_a") return "VIII";
  if (diagnosis === "haemophilia_b" || diagnosis === "symptomatic_carrier_b") return "IX";
  if (diagnosis === "factor_xi_deficiency") return "XI";
  return diagnosis === "acquired_haemophilia" ? "acquired" : "unknown";
}

function treatmentOptions(diagnosis: DiagnosisType) {
  if (diagnosis === "haemophilia_a" || diagnosis === "symptomatic_carrier_a") return ["Factor replacement", "Non-factor therapy", "Bypassing therapy", "No regular preventative treatment"];
  if (diagnosis === "haemophilia_b" || diagnosis === "symptomatic_carrier_b") return ["Factor replacement", "Bypassing therapy", "No regular preventative treatment"];
  if (diagnosis === "factor_xi_deficiency") return ["A prescribed treatment plan", "No regular preventative treatment"];
  if (diagnosis === "acquired_haemophilia") return ["A specialist-prescribed treatment plan", "No regular preventative treatment"];
  return ["A prescribed treatment plan", "No regular preventative treatment"];
}

const emptyMedication = (unit: Unit = "IU"): Medication => ({ name: "", dose: "", unit, frequency: "", administration: "" });

export function AddProfileForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { createProfile } = useProfiles();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex>("prefer_not_to_say");
  const [age, setAge] = useState("");
  const [hasAllergies, setHasAllergies] = useState<YesNo>("no");
  const [allergyDetails, setAllergyDetails] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisType>("haemophilia_a");
  const [activity, setActivity] = useState("");
  const [diagnosisTestDate, setDiagnosisTestDate] = useState("");
  const [congenitalSeverity, setCongenitalSeverity] = useState("severe");
  const [xiLevel, setXiLevel] = useState("not_known");
  const [inhibitorStatus, setInhibitorStatus] = useState("unknown");
  const [fixAllergy, setFixAllergy] = useState("unknown");
  const [acquiredTitre, setAcquiredTitre] = useState("");
  const [acquiredBleeding, setAcquiredBleeding] = useState("unknown");
  const [treatment, setTreatment] = useState("Factor replacement");
  const [prophylactic, setProphylactic] = useState<Medication>(emptyMedication());
  const [minimumBuffer, setMinimumBuffer] = useState("");
  const [takesOnDemand, setTakesOnDemand] = useState<YesNo>("no");
  const [onDemand, setOnDemand] = useState<Medication>(emptyMedication());
  const [takesOther, setTakesOther] = useState<YesNo>("no");
  const [otherMedication, setOtherMedication] = useState<Medication>(emptyMedication("mg"));
  const [groups, setGroups] = useState<string[]>([]);
  const [reminders, setReminders] = useState<YesNo>("yes");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCongenital = A_OR_B.includes(diagnosis);
  const isB = B_DIAGNOSES.includes(diagnosis);
  const treatmentChoices = treatmentOptions(diagnosis);
  const hasPreventativeTreatment = treatment !== "No regular preventative treatment";
  const canContinue = step !== 0 || Boolean(name.trim());
  const toggleGroup = (group: string) => setGroups((current) => current.includes(group) ? current.filter((item) => item !== group) : [...current, group]);

  function selectDiagnosis(next: DiagnosisType) {
    setDiagnosis(next);
    setTreatment(treatmentOptions(next)[0]);
  }

  async function createCompletedProfile() {
    // Profile creation is intentionally available only through the explicit
    // button on Preferences. Enter/Done from an earlier text field must never
    // submit the multi-step form or skip a page.
    if (step !== STEPS.length - 1 || !name.trim() || saving) return;

    setSaving(true);
    setError(null);
    const clinicalProfile: ClinicalProfile = {
      diagnosis,
      sex,
      age: age ? Number(age) : null,
      has_drug_allergies: hasAllergies === "yes",
      drug_allergy_details: hasAllergies === "yes" ? allergyDetails || null : null,
      diagnosis_factor_activity_percent: isCongenital || diagnosis === "factor_xi_deficiency" ? (activity ? Number(activity) : null) : null,
      diagnosis_test_date: isCongenital || diagnosis === "factor_xi_deficiency" ? diagnosisTestDate || null : null,
      congenital_severity: isCongenital ? congenitalSeverity : null,
      factor_xi_deficiency_level: diagnosis === "factor_xi_deficiency" ? xiLevel : null,
      acquired_inhibitor_titre_bu_ml: diagnosis === "acquired_haemophilia" && acquiredTitre ? Number(acquiredTitre) : null,
      acquired_bleeding_severity: diagnosis === "acquired_haemophilia" ? acquiredBleeding : null,
      inhibitor_status: isCongenital ? inhibitorStatus : null,
      fix_allergy_or_anaphylaxis: isB ? fixAllergy : null,
      treatment_approach: treatment,
      prophylactic_medication: hasPreventativeTreatment ? prophylactic : null,
      minimum_buffer: hasPreventativeTreatment || takesOnDemand === "yes" ? minimumBuffer || null : null,
      on_demand_medication: takesOnDemand === "yes" ? onDemand : null,
      other_medication: takesOther === "yes" ? otherMedication : null,
      group_chats: groups,
      medication_reminders: reminders === "yes",
    };
    try {
      await createProfile({ name: name.trim(), factor_type: trackingFactor(diagnosis), clinical_profile: clinicalProfile });
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the profile");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="pb-1">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">New profile</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-sand-900">Let&rsquo;s tailor your care space</h2><p className="mt-2 text-sm leading-6 text-sand-600">Record your diagnosis and existing care plan. This does not replace advice from your haemophilia care team.</p></div>
      <ol aria-label="Profile creation progress" className="mb-7 grid grid-cols-4 gap-1">{STEPS.map((label, index) => <li key={label} className="min-w-0"><div className={cn("h-1.5 rounded-full", index <= step ? "bg-teal-700" : "bg-sand-200")} /><span className={cn("mt-2 block truncate text-[10px] font-semibold", index === step ? "text-teal-800" : "text-sand-500")}>{label}</span></li>)}</ol>
      <div className="space-y-5">
        {step === 0 ? <><Field label="Name"><input autoFocus className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="How should we address you?" /></Field><div><p className="text-sm font-semibold text-sand-900">Biological sex</p><Choice columns value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Others" }, { value: "prefer_not_to_say", label: "Prefer not to say" }]} /></div><Field label="Age"><input className={inputClass} type="number" min="0" max="130" value={age} onChange={(e) => setAge(e.target.value)} /></Field><div><p className="text-sm font-semibold text-sand-900">Any drug allergies?</p><Choice columns value={hasAllergies} onChange={setHasAllergies} options={[{ value: "yes", label: "Yes — please indicate" }, { value: "no", label: "No" }]} />{hasAllergies === "yes" ? <textarea className={cn(inputClass, "min-h-24 py-3")} value={allergyDetails} onChange={(e) => setAllergyDetails(e.target.value)} placeholder="Drug(s) and reaction, if known" /> : null}</div></> : null}
        {step === 1 ? <><div><p className="text-sm font-semibold text-sand-900">Diagnosis</p><Choice value={diagnosis} onChange={selectDiagnosis} options={[{ value: "haemophilia_a", label: "Haemophilia A", description: "Factor VIII deficiency" }, { value: "haemophilia_b", label: "Haemophilia B", description: "Factor IX deficiency" }, { value: "factor_xi_deficiency", label: "Factor XI deficiency", description: "Sometimes called haemophilia C" }, { value: "acquired_haemophilia", label: "Acquired haemophilia", description: "Usually acquired haemophilia A" }, { value: "symptomatic_carrier_a", label: "Symptomatic carrier — A", description: "A carrier with reduced FVIII activity" }, { value: "symptomatic_carrier_b", label: "Symptomatic carrier — B", description: "A carrier with reduced FIX activity" }, { value: "other_or_unknown", label: "Another diagnosis or not sure" }]} /></div>{isCongenital || diagnosis === "factor_xi_deficiency" ? <div className="space-y-4 rounded-3xl bg-teal-50 p-4"><p className="text-sm font-bold text-teal-950">Diagnostic blood test</p><p className="text-xs leading-5 text-teal-900">Use the factor-activity result from when you were diagnosed, before regular prophylaxis began — not your most recent result, which treatment may have changed.</p><Field label={diagnosis === "factor_xi_deficiency" ? "FXI activity at diagnosis (%)" : "Factor activity at diagnosis (%)"}><input className={inputClass} inputMode="decimal" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="If known" /></Field><Field label="Date of diagnostic blood test (optional)"><input className={inputClass} type="date" value={diagnosisTestDate} onChange={(e) => setDiagnosisTestDate(e.target.value)} /></Field></div> : null}{isCongenital ? <div><p className="text-sm font-semibold text-sand-900">Severity at diagnosis</p><Choice value={congenitalSeverity} onChange={setCongenitalSeverity} options={[{ value: "severe", label: "Severe", description: "<1% factor activity" }, { value: "moderate", label: "Moderate", description: "1–5%" }, { value: "mild", label: "Mild", description: "5–<40%" }, { value: "not_known", label: "Not known" }]} /></div> : null}{diagnosis === "factor_xi_deficiency" ? <div><p className="text-sm font-semibold text-sand-900">Factor XI deficiency level</p><p className="mt-1 text-xs leading-5 text-sand-600">FXI activity does not reliably predict bleeding, so this is recorded with—not instead of—your care plan.</p><Choice value={xiLevel} onChange={setXiLevel} options={[{ value: "severe_deficiency", label: "Severe deficiency", description: "<15–20%" }, { value: "partial_deficiency", label: "Partial / mild deficiency", description: "20–70%" }, { value: "not_known", label: "Not known" }]} /></div> : null}{diagnosis === "acquired_haemophilia" ? <><Field label="Inhibitor titre (Bethesda units/mL)" hint="Enter the result from your care team, if known."><input className={inputClass} inputMode="decimal" value={acquiredTitre} onChange={(e) => setAcquiredTitre(e.target.value)} placeholder="If known" /></Field><div><p className="text-sm font-semibold text-sand-900">Clinical bleeding severity</p><Choice value={acquiredBleeding} onChange={setAcquiredBleeding} options={[{ value: "life_threatening_or_major", label: "Life-threatening / major" }, { value: "moderate_or_non_life_threatening", label: "Moderate / non-life-threatening" }, { value: "unknown", label: "Not known" }]} /></div></> : null}{isCongenital ? <div><p className="text-sm font-semibold text-sand-900">Inhibitor status</p><Choice columns value={inhibitorStatus} onChange={setInhibitorStatus} options={[{ value: "current", label: "Current" }, { value: "previous", label: "Previous" }, { value: "none_known", label: "None known" }, { value: "unknown", label: "Not sure" }]} /></div> : null}{isB ? <div><p className="text-sm font-semibold text-sand-900">History of FIX allergy or anaphylaxis?</p><Choice columns value={fixAllergy} onChange={setFixAllergy} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unknown", label: "Not sure" }]} /></div> : null}</> : null}
        {step === 2 ? <><div><p className="text-sm font-semibold text-sand-900">Current treatment approach</p><Choice value={treatment} onChange={setTreatment} options={treatmentChoices.map((label) => ({ value: label, label }))} /></div>{hasPreventativeTreatment ? <><div className="rounded-3xl bg-teal-50 p-4"><p className="text-sm font-bold text-teal-950">Record your prescription</p><p className="mt-1 text-xs leading-5 text-teal-900">Enter the product and regimen prescribed by your care team. This app does not recommend a product or dose.</p></div><MedicationFields title="Regular preventative medication" medication={prophylactic} onChange={setProphylactic} /><Field label="Minimum buffer medication available" hint="Your own target amount to have on hand for a bleed."><input className={inputClass} value={minimumBuffer} onChange={(e) => setMinimumBuffer(e.target.value)} placeholder="e.g. 1000 IU of your prescribed product" /></Field></> : null}<div><p className="text-sm font-semibold text-sand-900">Do you take on-demand medication?</p><Choice columns value={takesOnDemand} onChange={setTakesOnDemand} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} /></div>{takesOnDemand === "yes" ? <><MedicationFields title="On-demand medication" medication={onDemand} onChange={setOnDemand} showMode={false} />{!hasPreventativeTreatment ? <Field label="Minimum buffer medication available"><input className={inputClass} value={minimumBuffer} onChange={(e) => setMinimumBuffer(e.target.value)} placeholder="Your own target amount" /></Field> : null}</> : null}<div><p className="text-sm font-semibold text-sand-900">Any other medications?</p><Choice columns value={takesOther} onChange={setTakesOther} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} /></div>{takesOther === "yes" ? <MedicationFields title="Other medication" medication={otherMedication} onChange={setOtherMedication} showMode={false} /> : null}</> : null}
        {step === 3 ? <><div><p className="text-sm font-semibold text-sand-900">Would you like to join any group chats?</p><div className="mt-3 space-y-2">{["Haemophilia Support Group", "Community Page", "Touchpoints"].map((group) => <button type="button" key={group} onClick={() => toggleGroup(group)} aria-pressed={groups.includes(group)} className={cn("flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold", groups.includes(group) ? "border-teal-700 bg-teal-50 text-teal-950" : "border-sand-300 bg-white text-sand-800")}><span>{group}</span><span aria-hidden="true">{groups.includes(group) ? "✓" : "+"}</span></button>)}</div></div><div><p className="text-sm font-semibold text-sand-900">Would you like reminders to order and take medication?</p><Choice columns value={reminders} onChange={setReminders} options={[{ value: "yes", label: "Yes, remind me" }, { value: "no", label: "No thanks" }]} /></div><div className="rounded-3xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">Safety note</p><p className="mt-1">Follow your care team&rsquo;s individual treatment and emergency plan. This profile is for organising that plan, not replacing it.</p></div></> : null}
      </div>
      {error ? <p role="alert" className="mt-5 text-sm font-medium text-rose-700">{error}</p> : null}
      <div className="mt-7 flex gap-3 border-t border-sand-200 pt-5"><button type="button" onClick={step === 0 ? onCancel : () => setStep((current) => current - 1)} className="min-h-[48px] flex-1 rounded-2xl border border-sand-300 bg-white px-4 text-sm font-bold text-sand-700">{step === 0 ? "Cancel" : "Back"}</button>{step < STEPS.length - 1 ? <button type="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)} className="min-h-[48px] flex-1 rounded-2xl bg-teal-800 px-4 text-sm font-bold text-white disabled:opacity-40">Continue</button> : <button type="button" onClick={() => void createCompletedProfile()} disabled={!name.trim() || saving} className="min-h-[48px] flex-1 rounded-2xl bg-teal-800 px-4 text-sm font-bold text-white disabled:opacity-40">{saving ? "Creating…" : "Create profile"}</button>}</div>
    </form>
  );
}
