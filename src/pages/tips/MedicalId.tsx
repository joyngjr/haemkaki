import { BackLink } from "@/components/layout/BackLink";
import { CallLink } from "@/components/medical-id/CallLink";
import { Field, SectionCard } from "@/components/medical-id/SectionCard";
import {
  CapsuleIcon,
  PersonIcon,
  PhoneIcon,
  PlusIcon,
  StethoscopeIcon,
} from "@/components/medical-id/SectionIcons";
import type { FactorType } from "@/lib/api";
import { useProfiles } from "@/state/profile-context";

function haemophiliaLabel(factorType: FactorType): string {
  return factorType === "VIII" ? "Haemophilia A" : "Haemophilia B";
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

  const label = haemophiliaLabel(activeProfile.factor_type);

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
        {/* Real data: name. Placeholder: blood type, DOB. */}
        <SectionCard title="PATIENT DETAILS" iconBg="#1e3a8a" icon={<PersonIcon />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={activeProfile.name} />
            <Field label="Blood Type" value="O+" />
          </div>
          <Field label="DOB" value="12 Mar 2005" />
        </SectionCard>

        {/* Real data: haemophilia type. Placeholder: severity, medication. */}
        <SectionCard title="MEDICAL INFORMATION" iconBg="#2563eb" icon={<CapsuleIcon />}>
          <Field label="Haemophilia Type" value={label} />
          <Field label="Severity" value="Severe" />
          <Field
            label="Current Medication"
            value={`On-demand factor ${activeProfile.factor_type} (recombinant), Tranexamic acid (as needed)`}
          />
        </SectionCard>

        {/* Placeholder. */}
        <SectionCard title="OTHER ALLERGIES / CONDITIONS" iconBg="#2563eb" icon={<PlusIcon />}>
          <p className="text-sm text-gray-800">Allergic to penicillin (rash)</p>
          <p className="mt-1 text-sm text-gray-800">Mild asthma (uses inhaler as needed)</p>
        </SectionCard>

        {/* Placeholder. */}
        <SectionCard
          title="EMERGENCY CONTACT"
          titleColor="text-red-600"
          iconBg="#fecaca"
          icon={<PhoneIcon />}
        >
          <Field label="Name" value="Tan Mei Ling (Mother)" />
          <Field label="Relationship" value="Mother" />
          <Field label="Phone" value="+65 9123 4567" />
          <CallLink phone="+65 9123 4567" label="Call Emergency Contact" className="bg-red-600" />
        </SectionCard>

        {/* Placeholder. */}
        <SectionCard
          title="PRIMARY DOCTOR (ORGANISATION)"
          iconBg="#2563eb"
          icon={<StethoscopeIcon />}
        >
          <Field label="Name" value="Dr. Lim Wei Hong" />
          <Field label="Organisation" value="National University Hospital (NUH)" />
          <Field label="Phone" value="+65 6772 2222" />
          <CallLink phone="+65 6772 2222" label="Call Doctor" className="bg-blue-600" />
        </SectionCard>
      </div>
    </div>
  );
}
