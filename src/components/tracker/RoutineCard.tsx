import { useState } from "react";

import type { Schedule, ScheduleDraft } from "@/lib/api";
import {
  frequencyLabel,
  frequencyOf,
  frequencyToApi,
  fromKey,
  toKey,
  weekdayList,
  type Frequency,
} from "@/lib/tracker-dates";

import { DatePicker } from "./DatePicker";
import { FrequencyEditor } from "./FrequencyEditor";
import { NumberField } from "./NumberField";
import { Sheet } from "./Sheet";
import { PlayIcon, RepeatIcon, VialIcon } from "./TrackerIcons";

export type RoutineDraft = Omit<ScheduleDraft, "replace">;

type RoutineCardProps = {
  series: Schedule | null;
  today: Date;
  /** Days of cover to keep in reserve before ordering. Null until it is set. */
  bufferDays: number | null;
  onReplace: (draft: RoutineDraft) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  /**
   * Stores the buffer, which lives on the profile rather than the series.
   * Absent for a profile with nothing recorded to merge it into, and the flow
   * then skips the question rather than asking for a number it would drop.
   */
  onSaveBuffer?: (days: number) => Promise<boolean>;
};

function longDate(key: string) {
  const date = fromKey(key);
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Your Current Routine": the recurring series and the two things you can do
 * to it. Like a calendar's recurring event it is never edited in place — a
 * change starts a new series in place of the old one, and moving a single
 * dose happens on the calendar, not here.
 */
export function RoutineCard({
  series,
  today,
  bufferDays,
  onReplace,
  onRemove,
  onSaveBuffer,
}: RoutineCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const frequency = series ? frequencyOf(series) : undefined;

  async function remove() {
    setBusy(true);
    const ok = await onRemove();
    setBusy(false);
    if (ok) setConfirmingRemove(false);
  }

  return (
    <>
      <section className="overflow-hidden rounded-card border border-line bg-card p-4 sm:p-5 lg:p-6">
        <h2 className="text-base font-semibold sm:text-[17px]">Your Current Routine</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <RoutineField
            icon={<RepeatIcon className="h-5 w-5 text-[#274A63]" />}
            label="Frequency"
            value={frequency ? frequencyLabel(frequency) : "Not set"}
            detail={frequency?.unit === "week" ? weekdayList(frequency.weekdays) : undefined}
          />
          <RoutineField
            icon={<VialIcon className="h-5 w-5 text-[#274A63]" />}
            label="Dosage"
            value={series ? `${series.vials} vial${series.vials === 1 ? "" : "s"}` : "Not set"}
          />
          <RoutineField
            icon={<PlayIcon className="h-5 w-5 text-[#274A63]" />}
            label={
              <>
                Effective
                <br />
                start date
              </>
            }
            value={series ? longDate(series.start_on) : "Not set"}
          />
        </div>
        {onSaveBuffer ? (
          <p className="mt-3 text-xs leading-relaxed text-[#5C646C]">
            Order buffer:{" "}
            <span className="font-semibold text-[#242A2F]">
              {bufferDays === null ? "Not set" : `${bufferDays} day${bufferDays === 1 ? "" : "s"}`}
            </span>{" "}
            — the cover you want left when it is time to order.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="h-11 flex-1 whitespace-nowrap rounded-xl bg-[#274A63] px-4 text-sm font-bold text-white transition hover:bg-[#274A63]"
          >
            {series ? "Change routine" : "Set up routine"}
          </button>
          {series && !confirmingRemove ? (
            <button
              onClick={() => setConfirmingRemove(true)}
              className="h-11 whitespace-nowrap rounded-xl px-4 text-sm font-bold text-[#A63A2E] transition hover:bg-[#F7F6F3]"
            >
              Remove routine
            </button>
          ) : null}
        </div>
        {series && confirmingRemove ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EBD3CE] bg-[#FBF1EF] px-3 py-2">
            <p className="text-sm text-[#A63A2E]">
              Remove this routine? Doses you have logged stay.
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setConfirmingRemove(false)}
                disabled={busy}
                className="h-9 rounded-lg px-3 text-sm font-bold text-[#5C646C] hover:bg-[#F7F6F3] disabled:opacity-40"
              >
                Keep
              </button>
              <button
                onClick={() => void remove()}
                disabled={busy}
                className="h-9 rounded-lg bg-[#A63A2E] px-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {busy ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {editing ? (
        <RoutineFlow
          series={series}
          today={today}
          bufferDays={bufferDays}
          asksForBuffer={Boolean(onSaveBuffer)}
          onSave={async (draft, buffer) => {
            // The series first: the buffer is only meaningful against a
            // routine, and a failed schedule write should not leave one set.
            const ok = await onReplace(draft);
            if (!ok) return;
            if (buffer !== null && onSaveBuffer) await onSaveBuffer(buffer);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}

function RoutineField({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: string;
  /** A smaller line under the value, e.g. the weekdays of a weekly routine. */
  detail?: string | undefined;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-[#F7F6F3] px-2 py-3 text-center">
      {icon}
      <span className="flex min-h-8 items-center text-xs leading-tight text-[#5C646C]">
        {label}
      </span>
      <span className="text-sm font-bold text-[#242A2F]">{value}</span>
      {detail ? <span className="-mt-1 text-xs text-[#5C646C]">{detail}</span> : null}
    </div>
  );
}

type Step = "start" | "frequency" | "vials" | "buffer";

/**
 * The questions a routine is made of, asked in order. Saving replaces the
 * series outright: a new start date is a permanent shift of the cycle.
 *
 * The buffer is the last of them. It is not part of the series — it is stored
 * on the profile — but it is asked here because a number of days of cover only
 * means something once there is a routine to count doses from.
 */
function RoutineFlow({
  series,
  today,
  bufferDays,
  asksForBuffer,
  onSave,
  onClose,
}: {
  series: Schedule | null;
  today: Date;
  bufferDays: number | null;
  asksForBuffer: boolean;
  onSave: (draft: RoutineDraft, bufferDays: number | null) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("start");
  const [start, setStart] = useState<Date>(series ? fromKey(series.start_on) : today);
  const [pickerMonth, setPickerMonth] = useState(series ? fromKey(series.start_on) : today);
  const [frequency, setFrequency] = useState<Frequency | undefined>(() =>
    series ? frequencyOf(series) : undefined,
  );
  const [vials, setVials] = useState(series ? String(series.vials) : "");
  // Whole days: the fold rounds a fraction up anyway, and the pad is digits.
  const [buffer, setBuffer] = useState(bufferDays === null ? "" : String(Math.ceil(bufferDays)));
  const [saving, setSaving] = useState(false);
  const eyebrow = series ? "Change routine" : "Set up routine";

  function save(bufferToSave: number | null) {
    if (saving || !frequency) return;
    setSaving(true);
    void onSave(
      { start_on: toKey(start), ...frequencyToApi(frequency), vials: Number(vials) },
      bufferToSave,
    ).finally(() => setSaving(false));
  }

  if (step === "start") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="When does this routine start?"
        onClose={onClose}
      >
        <DatePicker
          month={pickerMonth}
          selected={start}
          onMonthChange={setPickerMonth}
          onSelect={(date) => {
            setStart(date);
            setStep("frequency");
          }}
        />
      </Sheet>
    );
  }

  if (step === "frequency") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How often is prophylaxis due?"
        onBack={() => setStep("start")}
        backLabel="Back to start date"
        onClose={onClose}
      >
        <FrequencyEditor
          initial={frequency}
          confirmLabel="Next"
          onConfirm={(chosen) => {
            setFrequency(chosen);
            setStep("vials");
          }}
        />
      </Sheet>
    );
  }

  if (step === "vials") {
    const last = !asksForBuffer;
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How many vials per dose?"
        onBack={() => setStep("frequency")}
        backLabel="Back to frequency"
        onClose={onClose}
      >
        <NumberField
          label="Vials per dose"
          value={vials}
          onChange={setVials}
          confirmLabel={
            last ? (saving ? "Saving…" : series ? "Start new routine" : "Start routine") : "Next"
          }
          onConfirm={() => (last ? save(null) : setStep("buffer"))}
        />
      </Sheet>
    );
  }

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
        label="Days of cover"
        value={buffer}
        onChange={setBuffer}
        suffix="days"
        hint="Your order-by date is this far ahead of the day your supply runs out. 7 means order with about a week of doses left."
        confirmLabel={saving ? "Saving…" : series ? "Start new routine" : "Start routine"}
        onConfirm={() => save(buffer === "" ? null : Number(buffer))}
      />
    </Sheet>
  );
}
