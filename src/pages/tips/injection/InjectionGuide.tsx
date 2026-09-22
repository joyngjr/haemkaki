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
    description: "Into a vein. The usual route for factor replacement.",
    buttonLabel: "View IV Guide",
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    icon: <IntravenousIcon />,
  },
  {
    to: "/tips/injection-guide/subcutaneous",
    title: "Subcutaneous Injection",
    description: "Under the skin, such as emicizumab.",
    buttonLabel: "View SC Guide",
    bg: "bg-green-50",
    iconBg: "bg-green-600",
    icon: <SubcutaneousIcon />,
  },
  {
    to: "/tips/injection-guide/port-a-cath",
    title: "Port-a-Cath Injection",
    description: "Through a port implanted under the skin.",
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
      <PageHeader title="Injection Guides" className="mt-4" />

      <div className="mt-5 flex flex-col gap-4">
        {injectionTypes.map((type) => (
          <InjectionTypeCard key={type.to} type={type} />
        ))}
      </div>

      <Callout tone="muted" className="mt-5">
        Always follow your haemophilia care team&rsquo;s instructions.
      </Callout>
    </div>
  );
}
