import { useState } from "react";

import { DAYS, frequencyLabel, type Frequency } from "@/lib/tracker-dates";

import { NumberPad } from "./NumberPad";

const UNITS = [
  ["days", "Every X days"],
  ["week", "X times a week"],
] as const;

/**
 * Pick how often prophylaxis is due: a dose every N days, or on chosen days of
 * the week. The routine card and the Plan Ahead flow both use it.
 *
 * Mounted only while its sheet is open, so `initial` seeds the drafts on mount.
 */
export function FrequencyEditor({
  initial,
  confirmLabel,
  onConfirm,
}: {
  initial: Frequency | undefined;
  confirmLabel: string;
  onConfirm: (frequency: Frequency) => void;
}) {
  const [unit, setUnit] = useState<Frequency["unit"]>(initial?.unit ?? "days");
  const [days, setDays] = useState(initial?.unit === "days" ? String(initial.days) : "");
  const [weekdays, setWeekdays] = useState<number[]>(
    initial?.unit === "week" ? initial.weekdays : [],
  );

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Frequency unit"
        className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#f8f0e2] p-1"
      >
        {UNITS.map(([value, label]) => (
          <button
            key={value}
            role="radio"
            aria-checked={unit === value}
            onClick={() => setUnit(value)}
            className={`h-11 rounded-lg text-sm font-bold transition ${unit === value ? "bg-[#a98559] text-white" : "text-[#806d51] hover:bg-[#f4ead8]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {unit === "days" ? (
        <NumberPad
          value={days}
          onChange={setDays}
          maxLength={2}
          suffix="days"
          hint="For example, enter 3 for a dose every 3 days."
          confirmLabel={confirmLabel}
          onConfirm={() => onConfirm({ unit: "days", days: Number(days) })}
        />
      ) : (
        <>
          <p className="mt-3 text-xs text-[#806d51]">Choose the days you usually take your dose.</p>
          <div role="group" aria-label="Days of the week" className="mt-3 grid grid-cols-7 gap-1">
            {DAYS.map((day, index) => {
              const checked = weekdays.includes(index);
              return (
                <button
                  key={day}
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() =>
                    setWeekdays((current) =>
                      checked
                        ? current.filter((item) => item !== index)
                        : [...current, index].sort((a, b) => a - b),
                    )
                  }
                  className={`h-11 rounded-lg text-xs font-bold transition ${checked ? "bg-[#a98559] text-white" : "bg-[#f8f0e2] text-[#443229] hover:bg-[#f4ead8]"}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-sm font-bold text-[#3b281c]">
            {weekdays.length ? frequencyLabel({ unit: "week", weekdays }) : "Pick at least one day"}
          </p>
          <button
            disabled={weekdays.length === 0}
            onClick={() => onConfirm({ unit: "week", weekdays })}
            className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </>
      )}
    </>
  );
}
