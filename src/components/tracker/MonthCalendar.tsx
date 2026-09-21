import { useMemo } from "react";

import { Platelet } from "@/components/platelet/Platelet";
import { DAYS, monthGrid, toKey } from "@/lib/tracker-dates";
import type { EntryMap } from "@/lib/tracker-entries";

import type { OccurrenceMap } from "./useSchedule";

import { BleedDropIcon, ChevronLeftIcon, ChevronRightIcon } from "./TrackerIcons";

type MonthCalendarProps = {
  month: Date;
  today: Date;
  selectedDate: Date | null;
  entries: EntryMap;
  /** The routine's planned doses for this grid, keyed by the day they sit on. */
  planned: OccurrenceMap;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
};

const NAV_BUTTON =
  "grid h-9 w-9 place-items-center rounded-lg text-[#806d51] transition hover:bg-slate-100 hover:text-[#443229] focus:outline-none focus:ring-2 focus:ring-violet-300";

export function MonthCalendar({
  month,
  today,
  selectedDate,
  entries,
  planned,
  onMonthChange,
  onSelectDate,
}: MonthCalendarProps) {
  const days = useMemo(() => monthGrid(month), [month]);
  const monthTitle = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shiftMonth = (amount: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + amount, 1));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-3 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:rounded-3xl sm:p-7">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.10]" aria-hidden="true">
        <Platelet
          state="covered"
          className="absolute -right-14 -top-16 h-60 w-60 rotate-12 sm:h-80 sm:w-80"
        />
        <Platelet
          state="covered"
          className="absolute -bottom-16 -left-16 h-52 w-52 -rotate-6 sm:h-72 sm:w-72"
        />
      </div>
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="ml-2 text-xl font-bold tracking-tight text-[#6b3817] sm:text-2xl">
            {monthTitle}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className={NAV_BUTTON}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                onMonthChange(today);
                onSelectDate(today);
              }}
              className="rounded-lg px-3 py-2 text-xs font-bold text-[#80633e] transition hover:bg-[#f4ead8]"
            >
              Today
            </button>
            <button onClick={() => shiftMonth(1)} aria-label="Next month" className={NAV_BUTTON}>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-[#eee5d5] pb-3">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#806d51]"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 pt-2">
          {days.map((date, index) => {
            const key = toKey(date);
            const dayEntries = entries[key] ?? [];
            const inMonth = date.getMonth() === month.getMonth();
            const isToday = key === toKey(today);
            const isSelected = selectedDate ? key === toKey(selectedDate) : false;
            const hasFactorUse = dayEntries.some(
              (entry) =>
                entry.kind === "prophylaxis" ||
                entry.kind === "on-demand" ||
                entry.kind === "follow-up" ||
                entry.kind === "makeup",
            );
            const hasMissedDose = dayEntries.some((entry) => entry.kind === "missed");
            const hasBleed = dayEntries.some((entry) => entry.kind === "on-demand");
            // A planned dose shows until the day is settled by a logged dose
            // or a missed-dose record. A moved dose gets a dashed ring.
            const plannedDose = planned[key];
            const isPlanned = !hasFactorUse && !hasMissedDose && Boolean(plannedDose);
            // The trailing week is shorter so the card doesn't end on empty space.
            const isLastRow = index >= days.length - 7;
            return (
              <button
                key={key}
                onClick={() => onSelectDate(date)}
                aria-pressed={isSelected}
                className={`group relative flex ${isLastRow ? "aspect-[.95] sm:aspect-[1.05]" : "aspect-[.75] sm:aspect-[.85]"} flex-col items-center rounded-xl pt-2 transition focus:z-10 focus:outline-none focus:ring-2 focus:ring-violet-300 sm:pt-3 ${isSelected ? "bg-[#a98559] text-white shadow-md shadow-[#d8c3a0]" : "hover:bg-[#f4ead8]"}`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${!inMonth ? "text-slate-300" : isSelected ? "text-white" : isToday ? "bg-violet-100 text-[#80633e]" : "text-[#443229]"}`}
                >
                  {date.getDate()}
                </span>
                {(hasFactorUse || hasMissedDose || hasBleed || isPlanned) && (
                  <span className="mt-0.5 flex items-center gap-1">
                    {hasFactorUse && (
                      <i
                        className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-white" : "bg-[#8df5c0]"}`}
                      />
                    )}
                    {isPlanned && (
                      <i
                        className={`h-2.5 w-2.5 rounded-full border-2 bg-transparent ${plannedDose?.moved ? "border-dashed" : ""} ${isSelected ? "border-white" : "border-[#8df5c0]"}`}
                        aria-label={
                          plannedDose?.moved
                            ? "Planned dose, moved here"
                            : plannedDose?.plan_id !== null
                              ? "Planned dose from a plan"
                              : "Planned prophylaxis dose"
                        }
                      />
                    )}
                    {hasMissedDose && (
                      <i
                        className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-white" : "bg-[#ffcc4d]"}`}
                      />
                    )}
                    {hasBleed && (
                      <BleedDropIcon
                        className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-[#cd5952]"}`}
                        label="Bleed indicator"
                      />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <CalendarLegend />
      </div>
    </section>
  );
}

function CalendarLegend() {
  return (
    <div className="mt-4 flex flex-col items-center border-t border-[#eee5d5] pt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#806d51]">Legend</p>
      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2 text-xs text-[#806d51]">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#8df5c0] bg-transparent" />
          Planned Prophylaxis
        </span>
        <span className="flex items-center gap-1.5">
          <i className="ml-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#8df5c0]" />
          Factor Use
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ffcc4d]" />
          Missed Dose
        </span>
        <span className="flex items-center gap-1.5">
          <BleedDropIcon className="h-3.5 w-3.5 shrink-0 text-[#cd5952]" />
          Bleed Event
        </span>
      </div>
    </div>
  );
}
