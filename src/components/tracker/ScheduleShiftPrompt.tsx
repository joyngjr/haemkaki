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
      title="Shift future doses?"
      onClose={() => onAnswer(false)}
      closeLabel="Keep my current schedule"
    >
      <p className="mt-3 text-sm text-[#5C646C]">
        {frequency.unit === "days"
          ? `Every ${frequency.days} day${frequency.days === 1 ? "" : "s"}, counted from ${shortDate(doseDate)}.`
          : `${weekdayList(frequency.weekdays)}, from ${shortDate(doseDate)}.`}
      </p>
      <div className="mt-5 space-y-2">
        <button
          onClick={() => onAnswer(true)}
          className="h-11 w-full rounded-xl bg-[#274A63] px-4 text-sm font-bold text-white transition hover:bg-[#274A63]"
        >
          Yes, shift my doses
        </button>
        <button
          onClick={() => onAnswer(false)}
          className="h-11 w-full rounded-xl border border-[#E7E5E0] bg-[#F7F6F3] px-4 text-sm font-bold text-[#242A2F] transition hover:bg-[#F7F6F3]"
        >
          No, keep my schedule
        </button>
      </div>
    </Sheet>
  );
}
