import { useState } from "react";

import {
  emptyClinicalProfile,
  medicationForStorage,
  medicationFromStorage,
  type MedicationDraft,
} from "@/components/profile/clinical-profile";
import { Choice, Field, inputClass } from "@/components/profile/form-fields";
import { MedicationFields } from "@/components/profile/MedicationFields";
import { type ClinicalProfile, type DiagnosisType, type FactorType, type Profile } from "@/lib/api";
import { useProfiles } from "@/state/profile-context";

const DIAGNOSIS_OPTIONS: { value: DiagnosisType; label: string; description?: string }[] = [
  { value: "haemophilia_a", label: "Haemophilia A", description: "Factor VIII deficiency" },
  { value: "haemophilia_b", label: "Haemophilia B", description: "Factor IX deficiency" },
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
];

/** The factor the tracker counts, from the diagnosis. Nothing asks for it directly. */
function trackingFactor(diagnosis: DiagnosisType): FactorType {
  if (diagnosis === "haemophilia_a" || diagnosis === "symptomatic_carrier_a") return "VIII";
  if (diagnosis === "haemophilia_b" || diagnosis === "symptomatic_carrier_b") return "IX";
  if (diagnosis === "factor_xi_deficiency") return "XI";
  return diagnosis === "acquired_haemophilia" ? "acquired" : "unknown";
}

function diagnosisFromProfile(profile?: Profile): DiagnosisType {
  if (profile?.clinical_profile) return profile.clinical_profile.diagnosis;
  if (profile?.factor_type === "VIII") return "haemophilia_a";
  if (profile?.factor_type === "IX") return "haemophilia_b";
  if (profile?.factor_type === "XI") return "factor_xi_deficiency";
  if (profile?.factor_type === "acquired") return "acquired_haemophilia";
  return "haemophilia_a";
}

/**
 * Onboarding: a name, a diagnosis, and the medication you take regularly.
 *
 * Deliberately short. Everything a responder reads — blood type, date of
 * birth, allergies, severity, who to call — is recorded on the Medical ID
 * page instead, and the supply buffer sits beside the routine on the tracker,
 * which is the only screen where it means anything. Each of those screens
 * saves the whole profile, so this one starts from what is already stored and
 * overrides only what it asks about.
 *
 * The same form edits an existing profile, from the switcher.
 */
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
  const clinical = profile?.clinical_profile ?? null;
  const editing = Boolean(profile);
  const [name, setName] = useState(profile?.name ?? "");
  const [diagnosis, setDiagnosis] = useState<DiagnosisType>(diagnosisFromProfile(profile));
  const [medication, setMedication] = useState<MedicationDraft>(
    medicationFromStorage(clinical?.prophylactic_medication ?? null),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = Boolean(name.trim()) && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    // Spread what is already stored: the Medical ID fields and the buffer are
    // recorded on other screens, and the API replaces the whole object on
    // every save. The backend clears a severity that no longer fits.
    const clinicalProfile: ClinicalProfile = {
      ...(clinical ?? emptyClinicalProfile(diagnosis)),
      diagnosis,
      prophylactic_medication: medicationForStorage(medication),
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
        <p className="mt-2 text-sm leading-6 text-sand-600">
          Three questions to start. This does not replace advice from your haemophilia care team.
        </p>
      </div>

      <div className="space-y-6">
        <Field label="Name">
          <input
            autoFocus
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            placeholder="How should we address you?"
          />
        </Field>

        <div>
          <p className="text-sm font-semibold text-sand-900">Diagnosis</p>
          <Choice value={diagnosis} onChange={setDiagnosis} options={DIAGNOSIS_OPTIONS} />
        </div>

        <div>
          <p className="text-sm font-semibold text-sand-900">
            Your regular medication <span className="font-normal text-sand-500">— optional</span>
          </p>
          <p className="mt-1 text-xs leading-5 text-sand-600">
            Pre-populates factor dosage for quicker logging.
          </p>
          <div className="mt-3">
            <MedicationFields
              medication={medication}
              onChange={setMedication}
              kind="prophylaxis"
              diagnosis={diagnosis}
            />
          </div>
        </div>
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
          {saving ? "Saving…" : editing ? "Save changes" : "Create profile"}
        </button>
      </div>
    </form>
  );
}
