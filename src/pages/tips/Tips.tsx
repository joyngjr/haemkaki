import { PageHeader } from "@/components/layout/PageHeader";
import { TipCard, type TipCardData } from "@/components/tips/TipCard";
import { FindMedicalHelpIcon, InjectionGuideIcon, MedicalIdIcon } from "@/components/tips/TipIcons";

/** The entries in the grid. Adding a tip means adding a card and a route. */
const tipCards: TipCardData[] = [
  {
    to: "/tips/medical-id",
    title: "My Medical ID",
    description: "Keep your important information ready.",
    bg: "bg-red-100",
    iconBg: "bg-red-500",
    arrowBg: "bg-red-200",
    icon: <MedicalIdIcon />,
  },
  {
    to: "/tips/injection-guide",
    title: "Injection Guide",
    description: "Step-by-step routine and helpful tips.",
    bg: "bg-blue-100",
    iconBg: "bg-transparent",
    arrowBg: "bg-blue-200",
    icon: <InjectionGuideIcon />,
  },
  {
    to: "/tips/find-medical-help",
    title: "Find Medical Help",
    description: "Locate nearby hospitals and treatment centres.",
    bg: "bg-green-100",
    iconBg: "bg-transparent",
    arrowBg: "bg-green-200",
    icon: <FindMedicalHelpIcon />,
    // Three cards in two columns: the last one takes the full row.
    wide: true,
  },
];

export function Tips() {
  return (
    <div className="px-4 pt-8">
      <PageHeader title="Tips" subtitle="Living well with haemophilia." />

      <div className="mt-5 grid grid-cols-2 gap-4">
        {tipCards.map((card) => (
          <TipCard key={card.to} card={card} />
        ))}
      </div>
    </div>
  );
}
