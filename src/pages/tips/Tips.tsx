import { PageHeader } from "@/components/layout/PageHeader";
import {
  BleedSteps,
  GuideList,
  MedicalIdSummary,
  WhoToCall,
} from "@/components/tips/ResourceSections";

/**
 * The phone's Resources tab. From `lg` these same sections close the one-page
 * layout instead, and this route redirects there.
 */
export function Tips() {
  return (
    <div className="px-4 pt-7 sm:px-1">
      <PageHeader title="Resources" />
      <div className="mt-5 flex flex-col gap-4">
        <MedicalIdSummary />
        <GuideList />
        <BleedSteps />
        <WhoToCall />
      </div>
    </div>
  );
}
