import { BackLink } from "@/components/layout/BackLink";
import { InjectionHeader } from "@/components/tips/injection/InjectionHeader";
import { InjectionSteps, type InjectionStep } from "@/components/tips/injection/InjectionSteps";
import {
  AngleSyringeIcon,
  CleanVialIcon,
  FilterSyringeIcon,
  PinchSkinIcon,
  SyringeSwapIcon,
  VialIcon,
} from "@/components/tips/injection/StepIcons";
import { Callout, NoteIcon } from "@/components/ui/Callout";

const steps: InjectionStep[] = [
  {
    icon: <VialIcon />,
    text: "Allow the medication vial, pen, or pre-filled syringe to reach room temperature.",
  },
  {
    icon: <CleanVialIcon />,
    text: "Wash hands and clean the rubber vial stopper with an alcohol wipe.",
  },
  {
    icon: <FilterSyringeIcon />,
    text: "Use a specialized transfer needle with a filter attached to a syringe to withdraw the exact prescribed dose.",
  },
  {
    icon: <SyringeSwapIcon />,
    text: "Replace the transfer needle with a fresh subcutaneous injection needle before administering.",
  },
  { icon: <PinchSkinIcon />, text: "Gently pinch a fold of skin." },
  {
    icon: <AngleSyringeIcon />,
    text: "Push the needle fully into the skin at a 45-degree to 90-degree angle using a quick, firm motion.",
  },
];

export function Subcutaneous() {
  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips/injection-guide" />
      <InjectionHeader title="General Subcutaneously" subtitle="(Subcutaneous Injection)" />

      <Callout className="mt-4">Wash your hands thoroughly before you begin.</Callout>

      <InjectionSteps steps={steps} />

      <Callout icon={<NoteIcon />} className="mt-4">
        For pre-filled pens, no mixing is required.
      </Callout>
    </div>
  );
}
