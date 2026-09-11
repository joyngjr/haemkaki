import { Link } from "react-router-dom";
import { useProfiles } from "@/state/profile-context";
import type { FactorType } from "@/lib/api";

function haemophiliaLabel(factorType: FactorType): string {
  return factorType === "VIII" ? "Haemophilia A" : "Haemophilia B";
}

function SectionCard({
  icon,
  iconBg,
  title,
  titleColor = "text-blue-700",
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  titleColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: iconBg }}
        >
          {icon}
        </span>
        <h3 className={"text-xs font-bold tracking-wide " + titleColor}>{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
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
        <Link
          to="/tips"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          No profile selected yet. Create a profile to see a Medical ID.
        </p>
      </div>
    );
  }

  const label = haemophiliaLabel(activeProfile.factor_type);

  return (
    <div className="px-4 pt-8 pb-8">
      <Link
        to="/tips"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>

      {/* Header */}
      <div className="mt-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold tracking-widest text-blue-700">MEDICAL ID</p>
        <h1 className="mt-1 text-4xl font-extrabold text-red-600">{label}</h1>
        <p className="mt-1 text-xs font-bold tracking-wide text-gray-500">
          BLEEDING DISORDER &nbsp;&#8226;&nbsp; HANDLE WITH CARE
        </p>
      </div>

      {/* Blue banner - moved above Patient Details */}
      <div className="mt-4 rounded-[20px] bg-blue-50 p-4">
        <p className="text-sm font-bold text-blue-900">This patient has {label}.</p>
        <p className="mt-1 text-sm text-blue-800">
          Please ensure appropriate treatment and avoid unnecessary procedures or injections.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Patient Details - real data: name. Placeholder: blood type, DOB */}
        <SectionCard
          title="PATIENT DETAILS"
          iconBg="#1e3a8a"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={activeProfile.name} />
            <Field label="Blood Type" value="O+" />
          </div>
          <Field label="DOB" value="12 Mar 2005" />
        </SectionCard>

        {/* Medical Information - real: haemophilia type. Placeholder: severity, medication */}
        <SectionCard
          title="MEDICAL INFORMATION"
          iconBg="#2563eb"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="3" width="6" height="18" rx="3" strokeLinecap="round" />
            </svg>
          }
        >
          <Field label="Haemophilia Type" value={label} />
          <Field label="Severity" value="Severe" />
          <Field
            label="Current Medication"
            value={
              "On-demand factor " +
              activeProfile.factor_type +
              " (recombinant), Tranexamic acid (as needed)"
            }
          />
        </SectionCard>

        {/* Allergies/Conditions - placeholder */}
        <SectionCard
          title="OTHER ALLERGIES / CONDITIONS"
          iconBg="#2563eb"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          }
        >
          <p className="text-sm text-gray-800">Allergic to penicillin (rash)</p>
          <p className="mt-1 text-sm text-gray-800">Mild asthma (uses inhaler as needed)</p>
        </SectionCard>

        {/* Emergency Contact - moved under Allergies. Placeholder */}
        <SectionCard
          title="EMERGENCY CONTACT"
          titleColor="text-red-600"
          iconBg="#fecaca"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
            >
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2.1z" />
            </svg>
          }
        >
          <Field label="Name" value="Tan Mei Ling (Mother)" />
          <Field label="Relationship" value="Mother" />
          <Field label="Phone" value="+65 9123 4567" />
          <a
            href="tel:+6591234567"
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white"
          >
            Call Emergency Contact
          </a>
        </SectionCard>

        {/* Primary Doctor - placeholder */}
        <SectionCard
          title="PRIMARY DOCTOR (ORGANISATION)"
          iconBg="#2563eb"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 3v6a3 3 0 0 0 6 0V3M6 12v3a6 6 0 0 0 12 0v-3" strokeLinecap="round" />
            </svg>
          }
        >
          <Field label="Name" value="Dr. Lim Wei Hong" />
          <Field label="Organisation" value="National University Hospital (NUH)" />
          <Field label="Phone" value="+65 6772 2222" />
          <a
            href="tel:+6567722222"
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white"
          >
            Call Doctor
          </a>
        </SectionCard>
      </div>
    </div>
  );
}
