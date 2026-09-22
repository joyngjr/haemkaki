import { useMemo } from "react";

import { Card } from "@/components/ui/Card";
import { MarkLegend } from "@/components/ui/StatusDot";
import { FOCUS_RING } from "@/lib/theme";
import { DAYS, monthGrid, toKey } from "@/lib/tracker-dates";
import type { EntryMap } from "@/lib/tracker-entries";
import { cn } from "@/lib/utils";

import type { OccurrenceMap } from "./useSchedule";

import { MonthMenu } from "./MonthMenu";

type MonthCalendarProps = {
  month: Date;
  today: Date;
  selectedDate: Date | null;
  entries: EntryMap;
  /** The routine's planned doses for this grid, keyed by the day they sit on. */
  planned: OccurrenceMap;
  /** Planned days already past with no factor use on them — derived, not logged. */
  missed: string[];
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  className?: string;
};

/** Sunday … Saturday, spelled out where the cells are wide enough. */
const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function MonthCalendar({
  month,
  today,
  selectedDate,
  entries,
  planned,
  missed,
  onMonthChange,
  onSelectDate,
  className,
}: MonthCalendarProps) {
  const days = useMemo(() => monthGrid(month), [month]);
  const missedDays = useMemo(() => new Set(missed), [missed]);
  // Planned days whose dose was taken later. They are not missed, but the day
  // itself still holds nothing, so its ring says where the dose went.
  const madeUpDays = useMemo(
    () =>
      new Set(
        Object.values(entries)
          .flat()
          .flatMap((entry) => (entry.kind === "makeup" ? [entry.missedDateKey] : [])),
      ),
    [entries],
  );
  return (
    <Card className={cn("lg:p-6", className)}>
      <div className="flex items-center justify-between pb-3.5">
        <MonthMenu month={month} today={today} onMonthChange={onMonthChange} />
      </div>

      <div className="grid grid-cols-7 gap-0.5 pb-1 lg:gap-2">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className="text-center text-[12.5px] text-ink-faint lg:text-left lg:text-[13px]"
          >
            {/* "Su" under the thumb, "Sunday" where the column is wide. */}
            <span className="lg:hidden">{day.slice(0, 2)}</span>
            <span className="hidden lg:inline">{LONG_DAYS[index]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 lg:gap-2">
        {days.map((date) => {
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
          // A missed dose is not an entry: it is a planned day that has passed
          // with nothing logged on it, worked out in `Tracker.tsx` and passed in.
          const hasMissedDose = missedDays.has(key);
          const hasBleed = dayEntries.some((entry) => entry.kind === "on-demand");
          // A planned dose shows until the day is settled by a logged dose, and
          // after its day has passed it reads as missed instead. A moved dose
          // keeps a dashed ring.
          const plannedDose = planned[key];
          const isPlanned = !hasFactorUse && !hasMissedDose && Boolean(plannedDose);

          const marks: { key: string; className: string; label?: string }[] = [];
          if (hasFactorUse) {
            marks.push({
              key: "use",
              className: cn("rounded-full", isSelected ? "bg-white" : "bg-teal-600"),
            });
          }
          if (isPlanned) {
            marks.push({
              key: "plan",
              className: cn(
                "rounded-full border-2 bg-transparent",
                plannedDose?.moved && "border-dashed",
                isSelected ? "border-white" : "border-teal-600",
              ),
              label: madeUpDays.has(key)
                ? "Planned dose, taken late"
                : plannedDose?.moved
                  ? "Planned dose, moved here"
                  : plannedDose?.plan_id !== null
                    ? "Planned dose from a plan"
                    : "Planned prophylaxis dose",
            });
          }
          if (hasMissedDose) {
            marks.push({
              key: "missed",
              className: cn("rounded-full", isSelected ? "bg-white" : "bg-ochre-600"),
              label: "Dose missed",
            });
          }
          if (hasBleed) {
            marks.push({
              key: "bleed",
              className: cn("rounded-full", isSelected ? "bg-white" : "bg-brick-600"),
              label: "Bleed treated",
            });
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={isSelected}
              // The grid's leading and trailing cells belong to the months
              // either side, so each one is named from its own date.
              aria-label={`${date.toLocaleDateString("en-SG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}${isToday ? ", today" : ""}`}
              className={cn(
                "flex h-[50px] flex-col items-center justify-center gap-1.5 rounded-[13px] transition-colors",
                "lg:h-[86px] lg:items-start lg:justify-start lg:gap-2 lg:border lg:p-2.5",
                isSelected
                  ? "bg-slate-600 lg:border-slate-600 lg:bg-slate-50 lg:ring-1 lg:ring-inset lg:ring-slate-600"
                  : isToday
                    ? // Today is marked by its outline alone — a fill would read
                      // as the selected day.
                      "ring-1 ring-inset ring-slate-600 hover:bg-slate-50 lg:border-slate-600 lg:bg-card"
                    : "hover:bg-soft lg:border-line lg:bg-card",
                !inMonth && !isSelected && "lg:bg-paper",
                FOCUS_RING,
              )}
            >
              <span
                className={cn(
                  "font-mono text-[15px] lg:text-[17px]",
                  isToday || isSelected ? "font-semibold" : "font-medium",
                  !inMonth
                    ? "text-sand-400"
                    : isSelected
                      ? "text-white lg:text-slate-600"
                      : isToday
                        ? "text-slate-600"
                        : "text-ink",
                )}
              >
                {date.getDate()}
              </span>

              {marks.length ? (
                <span className="flex items-center gap-1">
                  {marks.map((mark) => (
                    <i
                      key={mark.key}
                      className={cn("block h-2 w-2 lg:h-2.5 lg:w-2.5", mark.className)}
                      {...(mark.label ? { "aria-label": mark.label } : { "aria-hidden": true })}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <MarkLegend className="mt-4 border-t border-line pt-4 lg:mt-5 lg:pt-4" />
    </Card>
  );
}
