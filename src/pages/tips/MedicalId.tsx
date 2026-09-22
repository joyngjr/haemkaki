import { Download, Pencil } from "lucide-react";
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
import { downloadMedicalIdPdf } from "@/lib/medical-id-pdf";
import {
  bloodTypeLabel,
  diagnosisLabel,
  drugAllergiesLabel,
  formatDob,
  medicationSummary,
  severityOf,
} from "@/lib/medical-id";
import { useProfiles } from "@/state/profile-context";

export function MedicalId() {
  const { activeProfile, status } = useProfiles();
  const [editing, setEditing] = useState(false);

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

  const label = diagnosisLabel(activeProfile);
  const clinical = activeProfile.clinical_profile;
  const contact = clinical?.emergency_contact ?? null;
  const doctor = clinical?.primary_doctor ?? null;

  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips" />

      {/* One card, so the whole ID reads as a single document. The rules
          between sections come from Section itself. */}
      <div className="mt-4 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-4 md:px-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-700">MEDICAL ID</p>
            <h1 className="mt-1 text-3xl font-extrabold text-red-600 md:text-4xl">{label}</h1>
            <p className="mt-1 text-xs font-bold tracking-wide text-gray-500">
              BLEEDING DISORDER &nbsp;&#8226;&nbsp; HANDLE WITH CARE
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => downloadMedicalIdPdf(activeProfile)}
              aria-label="Download as PDF"
              title="Download as PDF"
              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
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

        <Section title="PATIENT DETAILS" iconBg="#1e3a8a" icon={<PersonIcon />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={activeProfile.name} />
            <Field label="Blood Type" value={bloodTypeLabel(clinical)} />
          </div>
          <Field label="DOB" value={formatDob(clinical?.date_of_birth)} />
        </Section>

        <Section title="MEDICAL INFORMATION" iconBg="#2563eb" icon={<CapsuleIcon />}>
          <Field label="Diagnosis" value={label} />
          <Field label="Severity" value={severityOf(clinical)} />
          <Field label="Current Medication" value={medicationSummary(clinical)} />
        </Section>

        <Section title="DRUG ALLERGIES" iconBg="#2563eb" icon={<PlusIcon />}>
          <p className="text-sm text-gray-800">{drugAllergiesLabel(clinical)}</p>
        </Section>

        {/* Both contacts come from the profile's Emergency step. A section that
            shows "Not recorded" is honest; one that shows a placeholder
            stranger's number in an emergency is not. */}
        <Section
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
            <p className="text-sm text-gray-800">Not recorded.</p>
          )}
        </Section>

        <Section title="PRIMARY DOCTOR (ORGANISATION)" iconBg="#2563eb" icon={<StethoscopeIcon />}>
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
            <p className="text-sm text-gray-800">Not recorded.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
