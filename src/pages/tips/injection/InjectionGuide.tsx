import { BackLink } from "@/components/layout/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  InjectionTypeCard,
  type InjectionType,
} from "@/components/tips/injection/InjectionTypeCard";
import {
  IntravenousIcon,
  PortACathIcon,
  SubcutaneousIcon,
} from "@/components/tips/injection/InjectionTypeIcons";
import { Callout } from "@/components/ui/Callout";

const injectionTypes: InjectionType[] = [
  {
    to: "/tips/injection-guide/intravenous",
    title: "Intravenous Injection",
    description:
      "Medication is injected directly into a vein, allowing clotting factor to enter the bloodstream quickly. Commonly used for factor replacement therapy.",
    buttonLabel: "View IV Guide",
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    icon: <IntravenousIcon />,
  },
  {
    to: "/tips/injection-guide/subcutaneous",
    title: "Subcutaneous Injection",
    description:
      "Medication is injected into the fatty tissue just beneath the skin, commonly around the abdomen or thigh. Some haemophilia treatments, such as emicizumab, are given this way.",
    buttonLabel: "View SC Guide",
    bg: "bg-green-50",
    iconBg: "bg-green-600",
    icon: <SubcutaneousIcon />,
  },
  {
    to: "/tips/injection-guide/port-a-cath",
    title: "Port-a-Cath Injection",
    description:
      "Medication is given through an implanted port placed beneath the skin and connected to a vein. Ports may be used when regular access to a vein is difficult.",
    buttonLabel: "View Port Guide",
    bg: "bg-red-50",
    iconBg: "bg-red-400",
    icon: <PortACathIcon />,
  },
];

export function InjectionGuide() {
  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips" />
      <PageHeader
        title="Injection Guides"
        subtitle="Learn about the different ways haemophilia medication may be given."
      />

      <div className="mt-5 flex flex-col gap-4">
        {injectionTypes.map((type) => (
          <InjectionTypeCard key={type.to} type={type} />
        ))}
      </div>

      <Callout tone="muted" className="mt-5">
        Always follow the injection instructions provided by your haemophilia care team. This
        information is for educational purposes and does not replace professional medical advice.
      </Callout>
    </div>
  );
}
