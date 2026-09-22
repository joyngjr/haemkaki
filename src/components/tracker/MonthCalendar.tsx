import { useMemo } from "react";

import { Card } from "@/components/ui/Card";
import { MarkLegend } from "@/components/ui/StatusDot";
import { FOCUS_RING } from "@/lib/theme";
import { DAYS, monthGrid, toKey } from "@/lib/tracker-dates";
import type { EntryMap } from "@/lib/tracker-entries";
import { cn } from "@/lib/utils";

import type { OccurrenceMap } from "./useSchedule";

import { ChevronLeftIcon, ChevronRightIcon } from "./TrackerIcons";

type MonthCalendarProps = {
  month: Date;
  today: Date;
  selectedDate: Date | null;
  entries: EntryMap;
  /** The routine's planned doses for this grid, keyed by the day they sit on. */
  planned: OccurrenceMap;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  className?: string;
};

const NAV_BUTTON = cn(
  "grid h-10 w-11 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-soft hover:text-ink",
  "lg:border lg:border-sand-300 lg:bg-card lg:hover:bg-soft",
);

/** Sunday … Saturday, spelled out where the cells are wide enough. */
const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function MonthCalendar({
  month,
  today,
  selectedDate,
  entries,
  planned,
  onMonthChange,
  onSelectDate,
  className,
}: MonthCalendarProps) {
  const days = useMemo(() => monthGrid(month), [month]);
  const monthTitle = month.toLocaleDateString("en-SG", { month: "long", year: "numeric" });
  const shiftMonth = (amount: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + amount, 1));

  return (
    <Card className={cn("lg:p-6", className)}>
      <div className="flex items-center justify-between pb-3.5">
        <h2 className="text-[17px] font-semibold lg:text-[19px]">{monthTitle}</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onMonthChange(today);
              onSelectDate(today);
            }}
            className={cn(
              "h-10 rounded-xl px-3.5 text-sm font-medium text-ink-muted transition-colors hover:bg-soft",
              "lg:border lg:border-sand-300 lg:bg-card lg:text-ink-strong lg:hover:bg-soft",
              FOCUS_RING,
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className={cn(NAV_BUTTON, FOCUS_RING)}
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className={cn(NAV_BUTTON, FOCUS_RING)}
          >
            <ChevronRightIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
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
          const hasMissedDose = dayEntries.some((entry) => entry.kind === "missed");
          const hasBleed = dayEntries.some((entry) => entry.kind === "on-demand");
          // A planned dose shows until the day is settled by a logged dose or a
          // missed-dose record. A moved dose keeps a dashed ring.
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
              label: plannedDose?.moved
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
                    ? "bg-rail lg:border-line lg:bg-soft"
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
                        ? "text-ink lg:text-slate-600"
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
