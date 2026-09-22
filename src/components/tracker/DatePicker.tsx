import { useMemo } from "react";

import { DAYS, fixedMonthGrid, toKey } from "@/lib/tracker-dates";

import { ChevronLeftIcon, ChevronRightIcon } from "./TrackerIcons";

/** A compact five-week month grid for picking one day. Days before `min` cannot be picked. */
export function DatePicker({
  month,
  selected,
  min,
  onMonthChange,
  onSelect,
}: {
  month: Date;
  selected: Date | undefined;
  min?: Date;
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
          className="grid h-8 w-8 place-items-center rounded-lg text-[#806d51] transition hover:bg-[#f4ead8]"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-[#443229]">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#806d51] transition hover:bg-[#f4ead8]"
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
          const disabled = Boolean(min && date.getTime() < min.getTime());
          return (
            <button
              key={toKey(date)}
              onClick={() => onSelect(date)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`grid h-9 place-items-center rounded-lg text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${isSelected ? "bg-[#a98559] text-white" : inMonth ? "text-[#443229] hover:bg-[#f4ead8]" : "text-slate-300 hover:bg-[#f4ead8]"}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
}
