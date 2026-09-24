import { useState } from "react";

import type { Schedule } from "@/lib/api";
import { vialLabel } from "@/lib/tracker-entries";
import { cn } from "@/lib/utils";
import { frequencyLabel, frequencyOf, fromKey, weekdayList } from "@/lib/tracker-dates";

import { RoutineFlow, type RoutineDraft } from "./RoutineFlow";
import { PlayIcon, RepeatIcon, VialIcon } from "./TrackerIcons";

type RoutineCardProps = {
  series: Schedule | null;
  /**
   * Whether the card offers to set a first routine up. The phone's Tracker
   * tab does — Home sends you here for it. On the one-page desktop layout the
   * status card opens the flow itself, so there the card only reads "Not set"
   * until there is a series to change.
   */
  offersSetup: boolean;
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
 * dose happens on the calendar, not here. Setting the first one up is this
 * card's button on a phone and the status card's on the one-page layout
 * (`offersSetup`).
 *
 * On a phone the card stacks: title, the three fields, the order buffer, the
 * buttons. From `lg` it is one row — the title and buffer on the left, the
 * fields across the middle, the buttons on the right.
 */
export function RoutineCard({
  series,
  offersSetup,
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
          {series || offersSetup ? (
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
          ) : null}
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
