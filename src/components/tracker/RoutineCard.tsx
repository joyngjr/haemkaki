import { useState } from "react";

import type { Schedule, ScheduleDraft } from "@/lib/api";
import { VIALS_DIGITS, vialLabel } from "@/lib/tracker-entries";
import { cn } from "@/lib/utils";
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
  /** Vials to keep at home. Null until it is set. */
  bufferVials: number | null;
  /** The day of the month the profile orders on. Null until it is set. */
  orderDayOfMonth: number | null;
  /** The regular dose recorded on the profile, in vials; seeds a new routine's dose. */
  usualVials: number | undefined;
  onReplace: (draft: RoutineDraft) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  /**
   * Stores the buffer and the order day, which live on the profile rather
   * than the series. Absent for a profile with nothing recorded to merge them
   * into, and the flow then skips the questions rather than asking for
   * numbers it would drop.
   */
  onSaveOrderPreferences?: (
    bufferVials: number | null,
    orderDay: number | null,
  ) => Promise<boolean>;
};

function longDate(key: string) {
  const date = fromKey(key);
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Your current routine": the recurring series and the two things you can do
 * to it. Like a calendar's recurring event it is never edited in place — a
 * change starts a new series in place of the old one, and moving a single
 * dose happens on the calendar, not here.
 *
 * On a phone the card stacks: title, the three fields, the order buffer, the
 * buttons. From `lg` it is one row — the title and buffer on the left, the
 * fields across the middle, the buttons on the right.
 */
export function RoutineCard({
  series,
  today,
  bufferVials,
  orderDayOfMonth,
  usualVials,
  onReplace,
  onRemove,
  onSaveOrderPreferences,
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
        <div className="lg:flex lg:items-center lg:gap-5 xl:gap-6">
          <div className="lg:w-[200px] lg:shrink-0 xl:w-[220px]">
            <h2 className="text-base font-semibold sm:text-[17px]">Your current routine</h2>
            {onSaveOrderPreferences ? (
              <OrderBufferNote
                bufferVials={bufferVials}
                orderDayOfMonth={orderDayOfMonth}
                className="mt-1.5 hidden lg:block"
              />
            ) : null}
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-3 gap-2 lg:mt-0 lg:flex-1 lg:gap-3">
            <RoutineField
              icon={<RepeatIcon className="h-5 w-5 text-[#274A63]" />}
              label="Frequency"
              value={frequency ? frequencyLabel(frequency) : "Not set"}
              detail={frequency?.unit === "week" ? weekdayList(frequency.weekdays) : undefined}
            />
            <RoutineField
              icon={<VialIcon className="h-5 w-5 text-[#274A63]" />}
              label="Dosage"
              value={series ? vialLabel(series.vials) : "Not set"}
            />
            <RoutineField
              icon={<PlayIcon className="h-5 w-5 text-[#274A63]" />}
              label={
                <>
                  Effective
                  <br className="lg:hidden" /> start date
                </>
              }
              value={series ? longDate(series.start_on) : "Not set"}
            />
          </div>
          {onSaveOrderPreferences ? (
            <OrderBufferNote
              bufferVials={bufferVials}
              orderDayOfMonth={orderDayOfMonth}
              className="mt-3 lg:hidden"
            />
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-0 lg:shrink-0 lg:flex-col lg:items-stretch lg:gap-1">
            <button
              onClick={() => setEditing(true)}
              className="h-11 flex-1 whitespace-nowrap rounded-xl bg-[#274A63] px-4 text-sm font-bold text-white transition hover:bg-[#274A63] lg:flex-none"
            >
              {series ? "Change routine" : "Set up routine"}
            </button>
            {series && !confirmingRemove ? (
              <button
                onClick={() => setConfirmingRemove(true)}
                className="h-11 whitespace-nowrap rounded-xl px-4 text-sm font-bold text-[#A63A2E] transition hover:bg-[#F7F6F3] lg:h-9"
              >
                Remove routine
              </button>
            ) : null}
          </div>
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
          bufferVials={bufferVials}
          orderDayOfMonth={orderDayOfMonth}
          usualVials={usualVials}
          asksForOrderPreferences={Boolean(onSaveOrderPreferences)}
          onSave={async (draft, buffer, orderDay) => {
            // The series first: the buffer and order day are only meaningful
            // against a routine, and a failed schedule write should not leave
            // them set.
            const ok = await onReplace(draft);
            if (!ok) return;
            if (onSaveOrderPreferences && (buffer !== null || orderDay !== null)) {
              await onSaveOrderPreferences(buffer, orderDay);
            }
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}

/** "Order buffer: 4 vials — order on day 5 of each month." */
function OrderBufferNote({
  bufferVials,
  orderDayOfMonth,
  className,
}: {
  bufferVials: number | null;
  orderDayOfMonth: number | null;
  className?: string;
}) {
  return (
    <p className={cn("text-xs leading-relaxed text-[#5C646C]", className)}>
      Order buffer:{" "}
      <span className="font-semibold text-[#242A2F]">
        {bufferVials === null ? "Not set" : vialLabel(bufferVials)}
      </span>{" "}
      — order on day {orderDayOfMonth ?? "not set"} of each month.
    </p>
  );
}

/** One of the three facts: a tile on a phone, a row with the icon at its left from `lg`. */
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
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl bg-[#F7F6F3] px-2 py-3 text-center",
        "lg:min-w-0 lg:flex-row lg:gap-3 lg:px-4 lg:py-2.5 lg:text-left",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="contents lg:flex lg:min-w-0 lg:flex-col">
        <span className="flex min-h-8 items-center text-xs leading-tight text-[#5C646C] lg:min-h-0">
          {label}
        </span>
        <span className="truncate text-sm font-bold text-[#242A2F]">{value}</span>
        {detail ? <span className="-mt-1 text-xs text-[#5C646C] lg:mt-0">{detail}</span> : null}
      </span>
    </div>
  );
}

type Step = "frequency" | "start" | "vials" | "buffer" | "orderDay";

/**
 * The questions a routine is made of, asked in order. An every-X-days routine
 * needs a start date to anchor its cycle; fixed weekdays do not, so that path
 * skips the calendar and starts today. Saving replaces the series outright: a
 * new start date is a permanent shift of the cycle.
 *
 * The buffer and the order day come last. They are not part of the series —
 * they are stored on the profile — but they are asked here because the order
 * advice they drive only means something once there is a routine to forecast
 * from.
 */
function RoutineFlow({
  series,
  today,
  bufferVials,
  orderDayOfMonth,
  usualVials,
  asksForOrderPreferences,
  onSave,
  onClose,
}: {
  series: Schedule | null;
  today: Date;
  bufferVials: number | null;
  orderDayOfMonth: number | null;
  usualVials: number | undefined;
  asksForOrderPreferences: boolean;
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
  const byInterval = frequency?.unit === "days";

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
            if (chosen.unit === "days") {
              setStep("start");
            } else {
              setStart(today);
              setStep("vials");
            }
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
        onBack={() => setStep(byInterval ? "start" : "frequency")}
        backLabel={byInterval ? "Back to start date" : "Back to frequency"}
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
    </Sheet>
  );
}
