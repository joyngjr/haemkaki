import { shortDate, weekdayList, type Frequency } from "@/lib/tracker-dates";

import { Sheet } from "./Sheet";

/**
 * Asked when a dose lands off the planned prophylaxis schedule (a make-up for a
 * missed dose, or a routine dose taken early or late). Nothing moves until the
 * user answers; closing the sheet counts as keeping the current schedule.
 */
export function ScheduleShiftPrompt({
  doseDate,
  frequency,
  onAnswer,
}: {
  /** The off-schedule dose a shifted schedule would count forward from. */
  doseDate: Date;
  /** The schedule as it would be after shifting. */
  frequency: Frequency;
  onAnswer: (shift: boolean) => void;
}) {
  return (
    <Sheet
      tier="picker"
      title="Your current prophylaxis routine seems to have been disrupted. Would you like to shift all future doses accordingly?"
      onClose={() => onAnswer(false)}
      closeLabel="Keep my current schedule"
    >
      <p className="mt-3 text-sm text-[#806d51]">
        {frequency.unit === "days"
          ? `Shifting plans your next doses every ${frequency.days} day${frequency.days === 1 ? "" : "s"} from ${shortDate(doseDate)}.`
          : `Shifting moves your weekly doses to ${weekdayList(frequency.weekdays)}, after ${shortDate(doseDate)}.`}
      </p>
      <div className="mt-5 space-y-2">
        <button
          onClick={() => onAnswer(true)}
          className="h-11 w-full rounded-xl bg-[#a98559] px-4 text-sm font-bold text-white transition hover:bg-[#80633e]"
        >
          Yes, shift my doses
        </button>
        <button
          onClick={() => onAnswer(false)}
          className="h-11 w-full rounded-xl border border-[#eee5d5] bg-[#f8f0e2] px-4 text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]"
        >
          No, keep my schedule
        </button>
      </div>
    </Sheet>
  );
}
