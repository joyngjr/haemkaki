import { BackLink } from "@/components/layout/BackLink";
import { InjectionHeader } from "@/components/injection/InjectionHeader";
import { InjectionSteps, type InjectionStep } from "@/components/injection/InjectionSteps";
import { SwabIcon, SyringeIcon, TwoVialsIcon, VialIcon } from "@/components/injection/StepIcons";
import { Callout } from "@/components/ui/Callout";

const steps: InjectionStep[] = [
  { icon: <VialIcon />, text: "Let the clotting factor vial warm to room temperature." },
  {
    icon: <TwoVialsIcon />,
    text: "Mix the factor powder with sterile water using a transfer needle or device.",
  },
  { icon: <SyringeIcon />, text: "Draw the solution into a syringe." },
  {
    icon: <SwabIcon />,
    text: "Use an alcohol swipe to clean the injection site and inject into vein.",
  },
];

export function Intravenous() {
  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips/injection-guide" />
      <InjectionHeader title="General Intravenously" subtitle="(IV Injection)" />

      <Callout className="mt-4">Wash your hands thoroughly before you begin.</Callout>

      <InjectionSteps steps={steps} />
    </div>
  );
}
