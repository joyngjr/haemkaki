import { BackLink } from "@/components/layout/BackLink";
import { InjectionHeader } from "@/components/injection/InjectionHeader";
import { InjectionSteps, type InjectionStep } from "@/components/injection/InjectionSteps";
import {
  AngleNeedleIcon,
  FlushIcon,
  MedicationPushIcon,
  SalinePushIcon,
} from "@/components/injection/StepIcons";
import { Callout, WarningIcon } from "@/components/ui/Callout";

const steps: InjectionStep[] = [
  {
    icon: <AngleNeedleIcon />,
    text: "Hold the non-coring needle at a 90-degree angle perpendicular to the skin. Push the needle firmly straight down through the skin and the rubber septum until the tip firmly hits the metal or titanium floor of the port reservoir.",
  },
  {
    icon: <SalinePushIcon />,
    text: 'Push 3 to 10 mL of normal saline into the line using a "push-and-pause" method to clear any resting blood from the catheter.',
  },
  {
    icon: <MedicationPushIcon />,
    text: "Disconnect the saline syringe, connect the syringe containing the mixed haemophilia medication, and slowly push the medication into the port.",
  },
  {
    icon: <FlushIcon />,
    text: "Once the medicine is delivered, flush the line again with a fresh syringe of normal saline to ensure all medication is pushed into the bloodstream.",
  },
];

export function PortACath() {
  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips/injection-guide" />
      <InjectionHeader title="Port-a-Cath" />

      <Callout className="mt-4">Wash your hands thoroughly before you begin.</Callout>

      <Callout icon={<WarningIcon />} emphasis className="mt-3">
        Must be done by a trained adult + important to maintain a sterile field.
      </Callout>

      <InjectionSteps steps={steps} />
    </div>
  );
}
