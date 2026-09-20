import { useMemo, useState } from "react";

import {
  DAYS,
  fixedMonthGrid,
  frequencyLabel,
  toKey,
  weekdayList,
  type Frequency,
} from "@/lib/tracker-dates";

import { FrequencyEditor } from "./FrequencyEditor";
import { NumberPad } from "./NumberPad";
import { Sheet } from "./Sheet";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, RepeatIcon, VialIcon } from "./TrackerIcons";
import type { Routine } from "./useRoutine";

type EditableField = "frequency" | "dosage" | "start";

type RoutineCardProps = {
  routine: Routine;
  today: Date;
  onFrequencyChange: (frequency: Frequency) => void;
  onVialsChange: (vials: number) => void;
  onStartDateChange: (date: Date) => void;
};

/**
 * "Your Current Routine" and the three pickers behind it.
 *
 * The card owns which field is being edited and its draft value, so the page
 * only ever hears about committed changes.
 */
export function RoutineCard({
  routine,
  today,
  onFrequencyChange,
  onVialsChange,
  onStartDateChange,
}: RoutineCardProps) {
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState("");
  const [pickerMonth, setPickerMonth] = useState(routine.startDate ?? today);

  function startEditing(field: EditableField) {
    if (field === "dosage") setDraft(routine.vials ? String(routine.vials) : "");
    if (field === "start") setPickerMonth(routine.startDate ?? today);
    setEditing(field);
  }

  return (
    <>
      <section className="mt-4 overflow-hidden rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-4 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:mt-6 sm:rounded-3xl sm:p-7">
        <h2 className="ml-1 text-xl font-bold tracking-tight text-[#6b3817] sm:ml-2 sm:text-2xl">
          Your Current Routine
        </h2>
        <p className="ml-1 mt-1 text-sm text-[#a8977c] sm:ml-2">Tap any value to edit</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <RoutineField
            icon={<RepeatIcon className="h-5 w-5 text-[#80633e]" />}
            label="Frequency"
            wrap={routine.frequency?.unit === "week"}
            value={routine.frequency ? frequencyLabel(routine.frequency) : "Not set"}
            detail={
              routine.frequency?.unit === "week"
                ? weekdayList(routine.frequency.weekdays)
                : undefined
            }
            onClick={() => startEditing("frequency")}
          />
          <RoutineField
            icon={<VialIcon className="h-5 w-5 text-[#80633e]" />}
            label="Dosage"
            wrap
            value={
              routine.vials ? `${routine.vials} vial${routine.vials === 1 ? "" : "s"}` : "Not set"
            }
            onClick={() => startEditing("dosage")}
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
            value={
              routine.startDate
                ? `${routine.startDate.toLocaleDateString("en-US", { month: "short" })} ${routine.startDate.getDate()}, ${routine.startDate.getFullYear()}`
                : "Not set"
            }
            onClick={() => startEditing("start")}
          />
        </div>
      </section>

      {editing === "frequency" && (
        <Sheet
          tier="action"
          eyebrow="Your Current Routine"
          title="How often is prophylaxis due?"
          onClose={() => setEditing(null)}
        >
          <FrequencyEditor
            initial={routine.frequency}
            confirmLabel="Save"
            onConfirm={(frequency) => {
              onFrequencyChange(frequency);
              setEditing(null);
            }}
          />
        </Sheet>
      )}

      {editing === "dosage" && (
        <Sheet
          tier="action"
          eyebrow="Your Current Routine"
          title="How many vials per dose?"
          onClose={() => setEditing(null)}
        >
          <NumberPad
            value={draft}
            onChange={setDraft}
            hint="Enter your usual dosage in vials"
            confirmLabel="Save"
            onConfirm={() => {
              onVialsChange(Number(draft));
              setEditing(null);
            }}
          />
        </Sheet>
      )}

      {editing === "start" && (
        <Sheet
          tier="action"
          eyebrow="Your Current Routine"
          title="When did this routine start?"
          onClose={() => setEditing(null)}
        >
          <StartDatePicker
            month={pickerMonth}
            selected={routine.startDate}
            onMonthChange={setPickerMonth}
            onSelect={(date) => {
              onStartDateChange(date);
              setEditing(null);
            }}
          />
        </Sheet>
      )}
    </>
  );
}

function RoutineField({
  icon,
  label,
  value,
  detail,
  wrap,
  onClick,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: string;
  /** A smaller line under the value, e.g. the weekdays of a weekly routine. */
  detail?: string;
  wrap?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl bg-[#f8f0e2] px-2 py-3 text-center transition hover:bg-[#f4ead8]"
    >
      {icon}
      <span className="flex min-h-8 items-center text-xs leading-tight text-[#806d51]">
        {label}
      </span>
      <span className={`text-sm font-bold text-[#443229] ${wrap ? "" : "whitespace-nowrap"}`}>
        {value}
      </span>
      {detail ? <span className="-mt-1 text-xs text-[#806d51]">{detail}</span> : null}
    </button>
  );
}

function StartDatePicker({
  month,
  selected,
  onMonthChange,
  onSelect,
}: {
  month: Date;
  selected: Date | undefined;
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date) => void;
}) {
  const days = useMemo(() => fixedMonthGrid(month), [month]);
  const shiftMonth = (amount: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + amount, 1));

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#806d51] transition hover:bg-slate-100"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-[#443229]">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#806d51] transition hover:bg-slate-100"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-bold uppercase text-[#806d51]">
            {day[0]}
          </div>
        ))}
        {days.map((date) => {
          const inMonth = date.getMonth() === month.getMonth();
          const isSelected = selected ? toKey(date) === toKey(selected) : false;
          return (
            <button
              key={toKey(date)}
              onClick={() => onSelect(date)}
              className={`grid h-9 place-items-center rounded-lg text-xs font-semibold transition ${isSelected ? "bg-[#a98559] text-white" : inMonth ? "text-[#443229] hover:bg-[#f4ead8]" : "text-slate-300 hover:bg-[#f4ead8]"}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
}
