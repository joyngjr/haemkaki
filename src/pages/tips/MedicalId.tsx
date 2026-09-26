import { Download, Languages, LoaderCircle, Pencil } from "lucide-react";
import { useState } from "react";

import { BackLink } from "@/components/layout/BackLink";
import { MedicalIdForm } from "@/components/profile/MedicalIdForm";
import { CallLink } from "@/components/tips/medical-id/CallLink";
import { Field, Section } from "@/components/tips/medical-id/Section";
import {
  CapsuleIcon,
  PersonIcon,
  PhoneIcon,
  PlusIcon,
  StethoscopeIcon,
} from "@/components/tips/medical-id/SectionIcons";
import { useMedicalIdTranslation } from "@/components/tips/medical-id/useMedicalIdTranslation";
import { downloadMedicalIdPdf } from "@/lib/medical-id-pdf";
import {
  bloodTypeLabel,
  diagnosisLabel,
  drugAllergiesLabel,
  drugAllergyNote,
  formatDob,
  medicalIdFreeText,
  medicationSummary,
  severityOf,
} from "@/lib/medical-id";
import {
  doseWordsFor,
  LANGUAGES,
  type LanguageCode,
  languageFor,
} from "@/lib/medical-id-translation";
import { useProfiles } from "@/state/profile-context";

export function MedicalId() {
  const { activeProfile, status } = useProfiles();
  const [editing, setEditing] = useState(false);
  const [languageCode, setLanguageCode] = useState<LanguageCode>("en");
  const {
    shown,
    t,
    status: translation,
  } = useMedicalIdTranslation(languageCode, medicalIdFreeText(activeProfile?.clinical_profile));
  const language = languageFor(shown);

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
        <p className="mt-4 text-sm text-gray-400">No profile yet.</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="px-4 pt-8">
        <BackLink to="/tips" />
        <div className="mt-4">
          <MedicalIdForm
            profile={activeProfile}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  const label = t(diagnosisLabel(activeProfile));
  const clinical = activeProfile.clinical_profile;
  const contact = clinical?.emergency_contact ?? null;
  const doctor = clinical?.primary_doctor ?? null;
  // A machine-translated allergy note keeps the original beside it: LibreTranslate
  // has turned "allergic to penicillin" into "immune disease", and a responder
  // who reads English should be able to catch that.
  const allergyNote = drugAllergyNote(clinical);
  const allergyTranslated = allergyNote !== null && t(allergyNote) !== allergyNote;

  return (
    <div className="px-4 pt-8 pb-8">
      <div className="flex items-center justify-between">
        <BackLink to="/tips" />
        {/* A native select under the pill: the phone's own picker, no custom menu. */}
        <label className="relative flex h-9 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700">
          {translation === "loading" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          {languageFor(languageCode).name}
          <select
            value={languageCode}
            onChange={(event) => setLanguageCode(event.target.value as LanguageCode)}
            aria-label="Language"
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {LANGUAGES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* One card, so the whole ID reads as a single document. The rules
          between sections come from Section itself. */}
      <div className="mt-4 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-4 md:px-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-700 uppercase">
              {t("Medical ID")}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-red-600 md:text-4xl">{label}</h1>
            <p className="mt-1 text-xs font-bold tracking-wide text-gray-500 uppercase">
              {t("Bleeding Disorder")} &nbsp;&#8226;&nbsp; {t("Handle with Care")}
            </p>
            {translation === "error" ? (
              <p className="mt-2 text-xs text-red-600">Couldn&apos;t translate. Showing English.</p>
            ) : shown !== "en" ? (
              <p className="mt-2 text-xs text-gray-400">{t("Machine-translated from English")}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => downloadMedicalIdPdf(activeProfile, { t, language })}
              disabled={translation === "loading"}
              aria-label="Download as PDF"
              title="Download as PDF"
              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 active:bg-gray-100 disabled:opacity-40"
            >
              <Download className="h-5 w-5" />
            </button>
            {/* The only editor for these fields: onboarding does not ask for them. */}
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={clinical ? "Edit medical ID" : "Fill in your Medical ID"}
              title={clinical ? "Edit medical ID" : "Fill in your Medical ID"}
              className="flex h-11 w-11 items-center justify-center rounded-full text-blue-700 active:bg-blue-50"
            >
              <Pencil className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Section title={t("Patient Details")} iconBg="#1e3a8a" icon={<PersonIcon />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Name")} value={activeProfile.name} />
            <Field label={t("Blood Type")} value={t(bloodTypeLabel(clinical))} />
          </div>
          <Field
            label={t("Date of Birth")}
            value={t(formatDob(clinical?.date_of_birth, language.locale))}
          />
        </Section>

        <Section title={t("Medical Information")} iconBg="#2563eb" icon={<CapsuleIcon />}>
          <Field label={t("Diagnosis")} value={label} />
          <Field label={t("Severity")} value={t(severityOf(clinical))} />
          <Field
            label={t("Current Medication")}
            value={t(medicationSummary(clinical, doseWordsFor(shown)))}
          />
        </Section>

        <Section title={t("Drug Allergies")} iconBg="#2563eb" icon={<PlusIcon />}>
          <p className="text-sm text-gray-800">{t(drugAllergiesLabel(clinical))}</p>
          {allergyTranslated ? (
            <p className="mt-1 text-xs text-gray-400">
              {t("Original (English)")}: {allergyNote}
            </p>
          ) : null}
        </Section>

        {/* Both contacts come from the profile's Emergency step. A section that
            shows "Not recorded" is honest; one that shows a placeholder
            stranger's number in an emergency is not. */}
        <Section
          title={t("Emergency Contact")}
          titleColor="text-red-600"
          iconBg="#fecaca"
          icon={<PhoneIcon />}
        >
          {contact ? (
            <>
              <Field label={t("Name")} value={contact.name} />
              {contact.relationship ? (
                <Field label={t("Relationship")} value={t(contact.relationship)} />
              ) : null}
              <Field label={t("Phone")} value={contact.phone} />
              <CallLink
                phone={contact.phone}
                label={t("Call Emergency Contact")}
                className="bg-red-600"
              />
            </>
          ) : (
            <p className="text-sm text-gray-800">{t("Not recorded")}</p>
          )}
        </Section>

        <Section
          title={t("Primary Doctor (Organisation)")}
          iconBg="#2563eb"
          icon={<StethoscopeIcon />}
        >
          {doctor ? (
            <>
              <Field label={t("Name")} value={doctor.name} />
              {doctor.organisation ? (
                <Field label={t("Organisation")} value={doctor.organisation} />
              ) : null}
              {doctor.phone ? (
                <>
                  <Field label={t("Phone")} value={doctor.phone} />
                  <CallLink phone={doctor.phone} label={t("Call Doctor")} className="bg-blue-600" />
                </>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-gray-800">{t("Not recorded")}</p>
          )}
        </Section>
      </div>
    </div>
  );
}
