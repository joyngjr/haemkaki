import { useState } from "react";

import type { Occurrence } from "@/lib/api";
import { fromKey, shortDate } from "@/lib/tracker-dates";

import { DatePicker } from "./DatePicker";
import { Sheet, SheetOption } from "./Sheet";

/**
 * Move one planned dose to another day — a calendar exception on the series.
 * The cycle itself does not change; to shift it for good, change the routine.
 */
export function MoveDoseFlow({
  occurrence,
  today,
  onMove,
  onRestore,
  onBack,
  onClose,
}: {
  occurrence: Occurrence;
  today: Date;
  onMove: (date: Date) => Promise<void>;
  onRestore: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
}) {
  const planned = fromKey(occurrence.on);
  const [pickerMonth, setPickerMonth] = useState(planned);
  const [busy, setBusy] = useState(false);

  const run = (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    void action().finally(() => setBusy(false));
  };

  return (
    <Sheet
      tier="action"
      offset="top"
      eyebrow="Planned dose"
      title={`Move the dose planned for ${shortDate(planned)}`}
      onBack={onBack}
      backLabel="Back to date actions"
      onClose={onClose}
      closeLabel="Close all pop-ups"
    >
      <p className="mt-2 text-xs text-[#806d51]">
        Only this dose moves; the rest of your routine stays on its cycle.
      </p>
      {occurrence.moved ? (
        <div className="mt-3">
          <SheetOption
            title={`Move back to ${shortDate(fromKey(occurrence.original_on))}`}
            description="Return it to its usual day"
            onClick={() => run(onRestore)}
          />
        </div>
      ) : null}
      <DatePicker
        month={pickerMonth}
        selected={planned}
        min={today}
        onMonthChange={setPickerMonth}
        onSelect={(date) => run(() => onMove(date))}
      />
    </Sheet>
  );
}
