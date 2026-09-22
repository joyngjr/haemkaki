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
import { NumberPad } from "./NumberPad";
import { Sheet } from "./Sheet";
import { PlayIcon, RepeatIcon, VialIcon } from "./TrackerIcons";

export type RoutineDraft = Omit<ScheduleDraft, "replace">;

type RoutineCardProps = {
  series: Schedule | null;
  today: Date;
  /** Prefills the interval for a first routine, from the onboarding form's "times per week". */
  defaultIntervalDays?: number;
  onReplace: (draft: RoutineDraft) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
};

function longDate(key: string) {
  const date = fromKey(key);
  return `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getDate()}, ${date.getFullYear()}`;
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
  defaultIntervalDays,
  onReplace,
  onRemove,
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
      <section className="mt-4 overflow-hidden rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-4 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:mt-6 sm:rounded-3xl sm:p-7">
        <h2 className="ml-1 text-xl font-bold tracking-tight text-[#6b3817] sm:ml-2 sm:text-2xl">
          Your Current Routine
        </h2>
        <p className="ml-1 mt-1 text-sm text-[#a8977c] sm:ml-2">
          {series
            ? "Planned doses follow this cycle. Move a single dose from its day on the calendar."
            : "Set one up to plan your doses and see when to order."}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <RoutineField
            icon={<RepeatIcon className="h-5 w-5 text-[#80633e]" />}
            label="Frequency"
            value={frequency ? frequencyLabel(frequency) : "Not set"}
            detail={frequency?.unit === "week" ? weekdayList(frequency.weekdays) : undefined}
          />
          <RoutineField
            icon={<VialIcon className="h-5 w-5 text-[#80633e]" />}
            label="Dosage"
            value={series ? `${series.vials} vial${series.vials === 1 ? "" : "s"}` : "Not set"}
          />
          <RoutineField
            icon={<PlayIcon className="h-5 w-5 text-[#80633e]" />}
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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="h-11 flex-1 rounded-xl bg-[#a98559] px-4 text-sm font-bold text-white transition hover:bg-[#80633e]"
          >
            {series ? "Change routine" : "Set up routine"}
          </button>
          {series && !confirmingRemove ? (
            <button
              onClick={() => setConfirmingRemove(true)}
              className="h-11 rounded-xl px-4 text-sm font-bold text-[#cd5952] transition hover:bg-[#f4ead8]"
            >
              Remove routine
            </button>
          ) : null}
        </div>
        {series && confirmingRemove ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e7c3bf] bg-[#fdeceb] px-3 py-2">
            <p className="text-sm text-[#9c3b34]">
              Remove this routine? Doses you have logged stay.
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setConfirmingRemove(false)}
                disabled={busy}
                className="h-9 rounded-lg px-3 text-sm font-bold text-[#806d51] hover:bg-[#f4ead8] disabled:opacity-40"
              >
                Keep
              </button>
              <button
                onClick={() => void remove()}
                disabled={busy}
                className="h-9 rounded-lg bg-[#cd5952] px-3 text-sm font-bold text-white disabled:opacity-40"
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
          defaultIntervalDays={defaultIntervalDays}
          onSave={async (draft) => {
            const ok = await onReplace(draft);
            if (ok) setEditing(false);
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
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-[#f8f0e2] px-2 py-3 text-center">
      {icon}
      <span className="flex min-h-8 items-center text-xs leading-tight text-[#806d51]">
        {label}
      </span>
      <span className="text-sm font-bold text-[#443229]">{value}</span>
      {detail ? <span className="-mt-1 text-xs text-[#806d51]">{detail}</span> : null}
    </div>
  );
}

type Step = "start" | "frequency" | "vials";

/**
 * The three questions a routine is made of, asked in order. Saving replaces
 * the series outright: a new start date is a permanent shift of the cycle.
 */
function RoutineFlow({
  series,
  today,
  defaultIntervalDays,
  onSave,
  onClose,
}: {
  series: Schedule | null;
  today: Date;
  defaultIntervalDays?: number;
  onSave: (draft: RoutineDraft) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("start");
  const [start, setStart] = useState<Date>(series ? fromKey(series.start_on) : today);
  const [pickerMonth, setPickerMonth] = useState(series ? fromKey(series.start_on) : today);
  const [frequency, setFrequency] = useState<Frequency | undefined>(() => {
    if (series) return frequencyOf(series);
    return defaultIntervalDays ? { unit: "days", days: defaultIntervalDays } : undefined;
  });
  const [vials, setVials] = useState(series ? String(series.vials) : "");
  const [saving, setSaving] = useState(false);
  const eyebrow = series ? "Change routine" : "Set up routine";

  if (step === "start") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="When does this routine start?"
        onClose={onClose}
      >
        <p className="mt-2 text-xs text-[#806d51]">
          Doses are planned from this day on. Doses you have already logged stay as they are.
        </p>
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

  return (
    <Sheet
      tier="action"
      eyebrow={eyebrow}
      title="How many vials per dose?"
      onBack={() => setStep("frequency")}
      backLabel="Back to frequency"
      onClose={onClose}
    >
      <NumberPad
        value={vials}
        onChange={setVials}
        hint={
          series
            ? "Saving starts a new routine in place of the current one."
            : "Enter your usual dosage in vials."
        }
        confirmLabel={saving ? "Saving…" : series ? "Start new routine" : "Start routine"}
        onConfirm={() => {
          if (saving || !frequency) return;
          setSaving(true);
          void onSave({
            start_on: toKey(start),
            ...frequencyToApi(frequency),
            vials: Number(vials),
          }).finally(() => setSaving(false));
        }}
      />
    </Sheet>
  );
}
