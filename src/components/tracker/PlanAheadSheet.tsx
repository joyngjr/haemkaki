import { useMemo, useState } from "react";

import { DAYS, fromKey, monthGrid, shortDate, toKey } from "@/lib/tracker-dates";
import { VIALS_DIGITS, vialLabel } from "@/lib/tracker-entries";
import { plansOverlap, type PlanAhead, type PlanAheadDraft } from "@/lib/tracker-plans";

import { NumberField } from "./NumberField";
import { Sheet, SheetOption } from "./Sheet";
import { ChevronLeftIcon, ChevronRightIcon } from "./TrackerIcons";

type Step = "dates" | "what" | "days" | "dosage";

const NEXT_BUTTON =
  "mt-4 w-full rounded-xl bg-[#274A63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#274A63] disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Adding a plan, one question at a time: which dates, what changes, then the
 * details of each change. Dose days are tapped on the calendar one by one,
 * inside the plan's dates, rather than set as a repeating rule.
 *
 * `onSave` is the API write; the sheet stays open until it resolves, and the
 * card closes it only if the write landed, so a refused plan (overlapping
 * dates, say) leaves the answers on screen to fix.
 */
export function PlanAheadSheet({
  today,
  plans,
  initial,
  routineVials,
  onSave,
  onClose,
}: {
  today: Date;
  plans: PlanAhead[];
  /** The plan being edited. Omitted when adding a new one. */
  initial?: PlanAhead;
  routineVials: number | undefined;
  onSave: (plan: PlanAheadDraft) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("dates");
  const [startKey, setStartKey] = useState<string | null>(initial?.startKey ?? null);
  const [endKey, setEndKey] = useState<string | null>(initial?.endKey ?? null);
  const [month, setMonth] = useState(initial ? fromKey(initial.startKey) : today);
  const [changesDays, setChangesDays] = useState(Boolean(initial?.doseKeys));
  const [changesDosage, setChangesDosage] = useState(Boolean(initial?.vials));
  const [doseKeys, setDoseKeys] = useState<string[]>(initial?.doseKeys ?? []);
  const [daysMonth, setDaysMonth] = useState(month);
  const [count, setCount] = useState(initial?.vials ? String(initial.vials) : "");
  const [busy, setBusy] = useState(false);

  const overlaps = Boolean(
    startKey && endKey && plansOverlap(plans, startKey, endKey, initial?.id),
  );

  // Narrowing the dates after picking days drops the days now outside them.
  const pickedKeys = doseKeys.filter(
    (key) => startKey && endKey && key >= startKey && key <= endKey,
  );

  function finish(vials: number | undefined) {
    if (!startKey || !endKey || busy) return;
    setBusy(true);
    void onSave({
      startKey,
      endKey,
      ...(changesDays && pickedKeys.length ? { doseKeys: pickedKeys } : {}),
      ...(vials ? { vials } : {}),
    }).finally(() => setBusy(false));
  }

  function toggleDay(key: string) {
    setDoseKeys((current) =>
      current.includes(key) ? current.filter((picked) => picked !== key) : [...current, key].sort(),
    );
  }

  const eyebrow = initial ? "Edit plan" : "Plan ahead";
  const closeLabel = "Close all pop-ups";
  const saveLabel = busy ? "Saving…" : "Save plan";

  if (step === "days" && startKey && endKey) {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="Which days will you take a dose?"
        onBack={() => setStep("what")}
        backLabel="Back to what changes"
        onClose={onClose}
        closeLabel={closeLabel}
      >
        <MonthGrid
          month={daysMonth}
          onMonthChange={setDaysMonth}
          earliest={startKey}
          latest={endKey}
          tone={(key) => (pickedKeys.includes(key) ? "picked" : "plain")}
          onPick={toggleDay}
          multiple
        />
        <p className="mt-3 rounded-xl bg-[#F7F6F3] px-3 py-2 text-center text-sm font-bold text-[#242A2F]">
          {pickedKeys.length
            ? `${pickedKeys.length} dose ${pickedKeys.length === 1 ? "day" : "days"}`
            : "Pick your dose days"}
        </p>
        <button
          disabled={!pickedKeys.length || busy}
          onClick={() => (changesDosage ? setStep("dosage") : finish(undefined))}
          className={NEXT_BUTTON}
        >
          {changesDosage ? "Next" : saveLabel}
        </button>
      </Sheet>
    );
  }

  if (step === "dosage") {
    return (
      <Sheet
        tier="action"
        eyebrow={eyebrow}
        title="How much factor per dose?"
        onBack={() => setStep(changesDays ? "days" : "what")}
        backLabel="Back"
        onClose={onClose}
        closeLabel={closeLabel}
      >
        <NumberField
          label="Vials per dose"
          value={count}
          onChange={setCount}
          maxLength={VIALS_DIGITS}
          suffix="vials"
          hint={routineVials ? `Your usual dosage is ${vialLabel(routineVials)}.` : undefined}
          confirmLabel={saveLabel}
          onConfirm={() => finish(Number(count))}
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
        <div className="mt-4 space-y-3">
          <SheetOption
            title="Dose days"
            pressed={changesDays}
            onClick={() => setChangesDays((current) => !current)}
          />
          <SheetOption
            title="Dosage"
            pressed={changesDosage}
            onClick={() => setChangesDosage((current) => !current)}
          />
        </div>
        <button
          disabled={!changesDays && !changesDosage}
          onClick={() => {
            if (!changesDays) return setStep("dosage");
            if (startKey) setDaysMonth(fromKey(startKey));
            setStep("days");
          }}
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
      title="Select plan period"
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
        className={`mt-3 rounded-xl bg-[#F7F6F3] px-3 py-2 text-center text-sm font-bold ${overlaps ? "text-[#A63A2E]" : "text-[#242A2F]"}`}
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

/** The first tap sets the start and the second, if later, sets the end. */
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
  // Once a start is set and the end hasn't been chosen separately, the next tap is the end.
  const choosingEnd = Boolean(startKey && startKey === endKey);

  function pick(key: string) {
    if (choosingEnd && startKey && key > startKey) onChange(startKey, key);
    else onChange(key, key);
  }

  return (
    <MonthGrid
      month={month}
      onMonthChange={onMonthChange}
      earliest={toKey(today)}
      tone={(key) =>
        key === startKey || key === endKey
          ? "picked"
          : startKey && endKey && key > startKey && key < endKey
            ? "between"
            : "plain"
      }
      onPick={pick}
    />
  );
}

type DayTone = "picked" | "between" | "plain";

/**
 * One month of days with arrows to the next and previous. Days outside
 * `earliest`–`latest` cannot be tapped, and the arrows stop at their months.
 * `multiple` marks each day as a toggle, for pickers that collect several.
 */
function MonthGrid({
  month,
  onMonthChange,
  earliest,
  latest,
  tone,
  onPick,
  multiple = false,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  earliest: string;
  latest?: string;
  tone: (key: string) => DayTone;
  onPick: (key: string) => void;
  multiple?: boolean;
}) {
  const days = useMemo(() => monthGrid(month), [month]);
  const monthKey = toKey(month).slice(0, 7);
  const shiftMonth = (amount: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + amount, 1));

  return (
    <>
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          disabled={monthKey <= earliest.slice(0, 7)}
          aria-label="Previous month"
          className="grid h-11 w-11 place-items-center rounded-lg text-[#5C646C] transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-[#242A2F]">
          {month.toLocaleDateString("en-SG", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => shiftMonth(1)}
          disabled={Boolean(latest && monthKey >= latest.slice(0, 7))}
          aria-label="Next month"
          className="grid h-11 w-11 place-items-center rounded-lg text-[#5C646C] transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-bold uppercase text-[#5C646C]">
            {day[0]}
          </div>
        ))}
        {days.map((date) => {
          const key = toKey(date);
          const inMonth = date.getMonth() === month.getMonth();
          const outside = key < earliest || Boolean(latest && key > latest);
          const dayTone = tone(key);
          return (
            <button
              key={key}
              disabled={outside}
              onClick={() => onPick(key)}
              aria-label={shortDate(date)}
              aria-pressed={multiple ? dayTone === "picked" : undefined}
              className={`grid h-9 place-items-center rounded-lg text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${dayTone === "picked" ? "bg-[#274A63] text-white" : dayTone === "between" ? "bg-[#EDEBE6] text-[#242A2F]" : inMonth ? "text-[#242A2F] hover:bg-[#F7F6F3]" : "text-sand-400 hover:bg-[#F7F6F3]"}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
}
