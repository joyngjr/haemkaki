import { useState } from "react";

import type { Schedule, ScheduleDraft } from "@/lib/api";
import { VIALS_DIGITS } from "@/lib/tracker-entries";
import { frequencyOf, frequencyToApi, fromKey, toKey, type Frequency } from "@/lib/tracker-dates";

import { DatePicker } from "./DatePicker";
import { FrequencyEditor } from "./FrequencyEditor";
import { NumberField } from "./NumberField";
import { Sheet } from "./Sheet";

export type RoutineDraft = Omit<ScheduleDraft, "replace">;

type Step = "frequency" | "start" | "vials" | "buffer" | "orderDay";

/** A save that did not land, under the field it was tried from. */
function SaveError({ message }: { message: string | null | undefined }) {
  return message ? (
    <p role="alert" className="mt-3 text-sm font-medium text-[#A63A2E]">
      {message}
    </p>
  ) : null;
}

/**
 * The questions a routine is made of, asked in order. Both kinds of routine
 * ask for a start date: it anchors an every-X-days cycle, and it is the first
 * day a weekday routine counts from. Saving replaces the series outright: a
 * new start date is a permanent shift of the cycle.
 *
 * The buffer and the order day come last. They are not part of the series —
 * they are stored on the profile — but they are asked here because the order
 * advice they drive only means something once there is a routine to forecast
 * from.
 *
 * Two places open it: the status card, to set a first routine up, and the
 * tracker's routine card, to change one. Both own the sheet's open state and
 * the save; the flow only collects the answers.
 */
export function RoutineFlow({
  series,
  today,
  bufferVials,
  orderDayOfMonth,
  usualVials,
  asksForOrderPreferences,
  error,
  onSave,
  onClose,
}: {
  series: Schedule | null;
  today: Date;
  bufferVials: number | null;
  orderDayOfMonth: number | null;
  usualVials: number | undefined;
  asksForOrderPreferences: boolean;
  /** Why the last save failed, when the owner has nowhere else to say so. */
  error?: string | null;
  onSave: (
    draft: RoutineDraft,
    bufferVials: number | null,
    orderDay: number | null,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("frequency");
  const [start, setStart] = useState<Date>(series ? fromKey(series.start_on) : today);
  const [pickerMonth, setPickerMonth] = useState(series ? fromKey(series.start_on) : today);
  const [frequency, setFrequency] = useState<Frequency | undefined>(() =>
    series ? frequencyOf(series) : undefined,
  );
  // A new routine starts from the dose recorded on the profile, if there is one.
  const [vials, setVials] = useState(
    series ? String(series.vials) : usualVials ? String(usualVials) : "",
  );
  const [buffer, setBuffer] = useState(bufferVials === null ? "" : String(bufferVials));
  const [orderDay, setOrderDay] = useState(String(orderDayOfMonth ?? today.getDate()));
  const [saving, setSaving] = useState(false);
  const eyebrow = series ? "Change routine" : "Set up routine";
  const confirmLabel = saving ? "Saving…" : series ? "Start new routine" : "Start routine";

  function save(bufferToSave: number | null, orderDayToSave: number | null) {
    if (saving || !frequency) return;
    setSaving(true);
    void onSave(
      { start_on: toKey(start), ...frequencyToApi(frequency), vials: Number(vials) },
      bufferToSave,
      orderDayToSave,
    ).finally(() => setSaving(false));
  }

  if (step === "frequency") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How often is prophylaxis due?"
        onClose={onClose}
      >
        <FrequencyEditor
          initial={frequency}
          confirmLabel="Next"
          onConfirm={(chosen) => {
            setFrequency(chosen);
            setStep("start");
          }}
        />
      </Sheet>
    );
  }

  if (step === "start") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="When does this routine start?"
        onBack={() => setStep("frequency")}
        backLabel="Back to frequency"
        onClose={onClose}
      >
        <DatePicker
          month={pickerMonth}
          selected={start}
          onMonthChange={setPickerMonth}
          onSelect={(date) => {
            setStart(date);
            setStep("vials");
          }}
        />
      </Sheet>
    );
  }

  if (step === "vials") {
    const last = !asksForOrderPreferences;
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How much factor per dose?"
        onBack={() => setStep("start")}
        backLabel="Back to start date"
        onClose={onClose}
      >
        <NumberField
          label="Vials per dose"
          value={vials}
          onChange={setVials}
          maxLength={VIALS_DIGITS}
          suffix="vials"
          confirmLabel={last ? confirmLabel : "Next"}
          onConfirm={() => (last ? save(null, null) : setStep("buffer"))}
        />
        {last ? <SaveError message={error} /> : null}
      </Sheet>
    );
  }

  if (step === "buffer") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How much cover do you want left when you order?"
        onBack={() => setStep("vials")}
        backLabel="Back to dosage"
        onClose={onClose}
      >
        <NumberField
          label="Vials in reserve"
          value={buffer}
          onChange={setBuffer}
          maxLength={VIALS_DIGITS}
          suffix="vials"
          hint="We’ll warn you if your stock falls below this reserve."
          confirmLabel="Next"
          onConfirm={() => setStep("orderDay")}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      tier="action"
      eyebrow={eyebrow}
      title="Which day do you order each month?"
      onBack={() => setStep("buffer")}
      backLabel="Back to vial reserve"
      onClose={onClose}
    >
      <NumberField
        label="Day of month"
        value={orderDay}
        onChange={setOrderDay}
        max={31}
        hint="For shorter months, we’ll use the final day of the month."
        confirmLabel={confirmLabel}
        onConfirm={() =>
          save(buffer === "" ? null : Number(buffer), orderDay === "" ? null : Number(orderDay))
        }
      />
      <SaveError message={error} />
    </Sheet>
  );
}
