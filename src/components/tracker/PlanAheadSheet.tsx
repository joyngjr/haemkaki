import { useMemo, useState } from "react";

import {
  DAYS,
  fixedMonthGrid,
  fromKey,
  shortDate,
  toKey,
  type Frequency,
} from "@/lib/tracker-dates";
import { plansOverlap, type PlanAhead, type PlanAheadDraft } from "@/lib/tracker-plans";

import { FrequencyEditor } from "./FrequencyEditor";
import { NumberPad } from "./NumberPad";
import { Sheet, SheetOption } from "./Sheet";
import { ChevronLeftIcon, ChevronRightIcon } from "./TrackerIcons";

type Step = "dates" | "what" | "frequency" | "dosage";

const NEXT_BUTTON =
  "mt-4 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Adding a plan, one question at a time: which dates, what changes, then the
 * details of each change. Frequency covers both "every N days" and "on these
 * weekdays", since the editor offers both.
 *
 * `onSave` is the API write; the sheet stays open until it resolves, and the
 * card closes it only if the write landed, so a refused plan (overlapping
 * dates, say) leaves the answers on screen to fix.
 */
export function PlanAheadSheet({
  today,
  plans,
  initial,
  routineFrequency,
  routineVials,
  onSave,
  onClose,
}: {
  today: Date;
  plans: PlanAhead[];
  /** The plan being edited. Omitted when adding a new one. */
  initial?: PlanAhead;
  routineFrequency: Frequency | undefined;
  routineVials: number | undefined;
  onSave: (plan: PlanAheadDraft) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("dates");
  const [startKey, setStartKey] = useState<string | null>(initial?.startKey ?? null);
  const [endKey, setEndKey] = useState<string | null>(initial?.endKey ?? null);
  const [month, setMonth] = useState(initial ? fromKey(initial.startKey) : today);
  const [changesFrequency, setChangesFrequency] = useState(Boolean(initial?.frequency));
  const [changesDosage, setChangesDosage] = useState(Boolean(initial?.vials));
  const [frequency, setFrequency] = useState<Frequency | undefined>(initial?.frequency);
  const [count, setCount] = useState(initial?.vials ? String(initial.vials) : "");
  const [busy, setBusy] = useState(false);

  const overlaps = Boolean(
    startKey && endKey && plansOverlap(plans, startKey, endKey, initial?.id),
  );

  function finish(nextFrequency: Frequency | undefined, vials: number | undefined) {
    if (!startKey || !endKey || busy) return;
    setBusy(true);
    void onSave({
      startKey,
      endKey,
      ...(nextFrequency ? { frequency: nextFrequency } : {}),
      ...(vials ? { vials } : {}),
    }).finally(() => setBusy(false));
  }

  const eyebrow = initial ? "Edit plan" : "Plan Ahead";
  const closeLabel = "Close all pop-ups";
  const saveLabel = busy ? "Saving…" : "Save plan";

  if (step === "frequency") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How often will you take it?"
        onBack={() => setStep("what")}
        backLabel="Back to what changes"
        onClose={onClose}
        closeLabel={closeLabel}
      >
        <FrequencyEditor
          initial={frequency ?? routineFrequency}
          confirmLabel={changesDosage ? "Next" : saveLabel}
          onConfirm={(chosen) => {
            setFrequency(chosen);
            if (changesDosage) setStep("dosage");
            else finish(chosen, undefined);
          }}
        />
      </Sheet>
    );
  }

  if (step === "dosage") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How many vials per dose?"
        onBack={() => setStep(changesFrequency ? "frequency" : "what")}
        backLabel="Back"
        onClose={onClose}
        closeLabel={closeLabel}
      >
        <NumberPad
          value={count}
          onChange={setCount}
          hint={
            routineVials
              ? `Your usual dosage is ${routineVials} vial${routineVials === 1 ? "" : "s"}.`
              : "Enter the number of vials per dose for this plan."
          }
          confirmLabel={saveLabel}
          onConfirm={() => finish(changesFrequency ? frequency : undefined, Number(count))}
        />
      </Sheet>
    );
  }

  if (step === "what") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="What will be different?"
        onBack={() => setStep("dates")}
        backLabel="Back to dates"
        onClose={onClose}
        closeLabel={closeLabel}
      >
        <p className="mt-2 text-xs text-[#806d51]">
          Choose everything that changes. Anything else stays as usual.
        </p>
        <div className="mt-4 space-y-3">
          <SheetOption
            title="Frequency or days"
            description="Take doses every few days, or on different days of the week"
            pressed={changesFrequency}
            onClick={() => setChangesFrequency((current) => !current)}
          />
          <SheetOption
            title="Dosage"
            description="Take a different number of vials per dose"
            pressed={changesDosage}
            onClick={() => setChangesDosage((current) => !current)}
          />
        </div>
        <button
          disabled={!changesFrequency && !changesDosage}
          onClick={() => setStep(changesFrequency ? "frequency" : "dosage")}
          className={NEXT_BUTTON}
        >
          Next
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet
      tier="action"
      eyebrow={eyebrow}
      title="When will your routine be different?"
      onClose={onClose}
      closeLabel={closeLabel}
    >
      <RangePicker
        today={today}
        month={month}
        startKey={startKey}
        endKey={endKey}
        onMonthChange={setMonth}
        onChange={(start, end) => {
          setStartKey(start);
          setEndKey(end);
        }}
      />
      <p
        className={`mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-sm font-bold ${overlaps ? "text-[#cd5952]" : "text-[#3b281c]"}`}
      >
        {overlaps
          ? "These dates overlap with another plan."
          : startKey && endKey
            ? startKey === endKey
              ? shortDate(fromKey(startKey))
              : `${shortDate(fromKey(startKey))} – ${shortDate(fromKey(endKey))}`
            : "Pick a start date"}
      </p>
      <button
        disabled={!startKey || overlaps}
        onClick={() => setStep("what")}
        className={NEXT_BUTTON}
      >
        Next
      </button>
    </Sheet>
  );
}

/** A month grid where the first tap sets the start and the second sets the end. */
function RangePicker({
  today,
  month,
  startKey,
  endKey,
  onMonthChange,
  onChange,
}: {
  today: Date;
  month: Date;
  startKey: string | null;
  endKey: string | null;
  onMonthChange: (month: Date) => void;
  onChange: (start: string, end: string) => void;
}) {
  const days = useMemo(() => fixedMonthGrid(month), [month]);
  const todayKey = toKey(today);
  // Once a start is set and the end hasn't been chosen separately, the next tap is the end.
  const choosingEnd = Boolean(startKey && startKey === endKey);
  const shiftMonth = (amount: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + amount, 1));

  function pick(key: string) {
    if (choosingEnd && startKey && key > startKey) onChange(startKey, key);
    else onChange(key, key);
  }

  return (
    <>
      <p className="mt-2 text-xs text-[#806d51]">
        {choosingEnd
          ? "Now tap the last day, or tap Next for a single day."
          : "Tap the first day, then the last day."}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="grid h-11 w-11 place-items-center rounded-lg text-[#806d51] transition hover:bg-slate-100"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-[#443229]">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="grid h-11 w-11 place-items-center rounded-lg text-[#806d51] transition hover:bg-slate-100"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-bold uppercase text-[#806d51]">
            {day[0]}
          </div>
        ))}
        {days.map((date) => {
          const key = toKey(date);
          const inMonth = date.getMonth() === month.getMonth();
          const isPast = key < todayKey;
          const isEnd = key === startKey || key === endKey;
          const inRange = Boolean(startKey && endKey && key > startKey && key < endKey);
          return (
            <button
              key={key}
              disabled={isPast}
              onClick={() => pick(key)}
              className={`grid h-9 place-items-center rounded-lg text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${isEnd ? "bg-[#a98559] text-white" : inRange ? "bg-[#ecdcbf] text-[#443229]" : inMonth ? "text-[#443229] hover:bg-[#f4ead8]" : "text-slate-300 hover:bg-[#f4ead8]"}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
}
