import { Link } from "react-router-dom";

import { TipCard, type TipCardData } from "@/components/tips/TipCard";
import {
  FindMedicalHelpIcon,
  ImportTrackerIcon,
  InjectionGuideIcon,
  MedicalIdIcon,
} from "@/components/tips/TipIcons";
import { diagnosisWithSeverity, treatmentLabel } from "@/lib/medical-id";
import { FOCUS_RING } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

/**
 * The two parts of Resources. The phone's Resources tab stacks them, and so
 * does the close of the one-page desktop layout.
 */

/** The guides. Adding one means adding a card here and a route in `App.tsx`. */
const tipCards: TipCardData[] = [
  {
    to: "/tips/injection-guide",
    title: "Injection guide",
    tile: "bg-slate-100 text-slate-500",
    icon: <InjectionGuideIcon className="h-5 w-5" />,
  },
  {
    to: "/tips/find-medical-help",
    title: "Treatment centres",
    tile: "bg-teal-50 text-teal-700",
    icon: <FindMedicalHelpIcon className="h-5 w-5" />,
  },
  {
    to: "/tips/medical-id",
    title: "Medical ID",
    tile: "bg-brick-100 text-brick-700",
    icon: <MedicalIdIcon className="h-5 w-5" />,
  },
  {
    to: "/tips/import-tracker",
    title: "Import from another tracker",
    tile: "bg-slate-50 text-slate-600",
    icon: <ImportTrackerIcon className="h-5 w-5" />,
  },
];

/** One label-and-value pair on the slate card. */
function IdField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-[13px] text-slate-300">{label}</dt>
      <dd className="text-[15px] font-semibold leading-snug lg:text-base">{value}</dd>
    </div>
  );
}

/** The medical ID, summarised. The full card is a tap away. */
export function MedicalIdSummary() {
  const { activeProfile } = useProfiles();
  const clinical = activeProfile?.clinical_profile ?? null;

  return (
    <section className="rounded-card bg-slate-600 p-5 text-white lg:p-7">
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
        <h2 className="text-[17px] font-semibold lg:text-xl">Medical ID</h2>
        <Link
          to="/tips/medical-id"
          className={cn(
            "hidden h-[46px] items-center rounded-xl bg-white px-5 text-[14.5px] font-semibold text-slate-600 hover:bg-slate-50 lg:flex",
            FOCUS_RING,
          )}
        >
          Show full card
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 lg:mt-6 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-5">
        {activeProfile ? (
          <>
            <IdField label="Name" value={activeProfile.name} />
            <IdField label="Diagnosis" value={diagnosisWithSeverity(activeProfile)} />
            <IdField label="Treatment" value={treatmentLabel(activeProfile)} />
            <IdField
              label="Drug allergies"
              value={
                clinical?.has_drug_allergies
                  ? (clinical.drug_allergy_details ?? "Yes — details not recorded")
                  : "None recorded"
              }
            />
            <IdField
              label="Treatment centre"
              value={clinical?.primary_doctor?.organisation ?? "Not recorded"}
            />
            <IdField
              label="Emergency contact"
              value={clinical?.emergency_contact?.name ?? "Not recorded"}
            />
          </>
        ) : (
          <p className="col-span-full text-[14.5px] text-slate-300">No profile yet.</p>
        )}
      </dl>

      <Link
        to="/tips/medical-id"
        className={cn(
          "mt-5 flex h-[50px] items-center justify-center rounded-control bg-white text-[15.5px] font-semibold text-slate-600 hover:bg-slate-50 lg:hidden",
          FOCUS_RING,
        )}
      >
        Show full card
      </Link>
    </section>
  );
}

/** Rows on a phone, a grid of tiles from `lg`. */
export function GuideList() {
  return (
    <div>
      <h2 className="px-1 pb-2.5 text-[15px] font-semibold text-ink-strong lg:hidden">Guides</h2>
      <div className="overflow-hidden rounded-card border border-line bg-card lg:grid lg:grid-cols-2 lg:gap-5 lg:border-0 lg:bg-transparent xl:grid-cols-4">
        {tipCards.map((card) => (
          <TipCard key={card.title} card={card} />
        ))}
      </div>
    </div>
  );
}
