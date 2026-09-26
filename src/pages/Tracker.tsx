import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Occurrence } from "@/lib/api";

import { PageHeader } from "@/components/layout/PageHeader";
import { DayActionsSheet, type DayFlow } from "@/components/tracker/DayActionsSheet";
import { DeviceCard } from "@/components/tracker/DeviceCard";
import { FactorSupplyCard, SupplyHistorySheet } from "@/components/tracker/FactorSupplyCard";
import { FactorUseFlow, type FactorUse, type SavedUse } from "@/components/tracker/FactorUseFlow";
import { InventoryCard } from "@/components/tracker/InventoryCard";
import { MonthCalendar } from "@/components/tracker/MonthCalendar";
import { MoveDoseFlow } from "@/components/tracker/MoveDoseFlow";
import { PlanAheadCard } from "@/components/tracker/PlanAheadCard";
import { RefillSheet } from "@/components/tracker/RefillSheet";
import { RoutineCard } from "@/components/tracker/RoutineCard";
import { SavedEntriesPanel } from "@/components/tracker/SavedEntriesPanel";
import { ScheduleShiftPrompt } from "@/components/tracker/ScheduleShiftPrompt";
import { StockCountSheet } from "@/components/tracker/StockCountSheet";
import { useDevice } from "@/components/tracker/useDevice";
import { useLedger } from "@/components/tracker/useLedger";
import { usePlans } from "@/components/tracker/usePlans";
import { useSchedule } from "@/components/tracker/useSchedule";
import { formatDeviceDate } from "@/lib/arduino";
import {
  frequencyOf,
  frequencyToApi,
  fromKey,
  getSingaporeToday,
  monthGridRange,
  shiftedFrequency,
  toKey,
} from "@/lib/tracker-dates";
import {
  FACTOR_USE_KINDS,
  recordCount,
  recordProphylaxis,
  supplyHistory,
  withEntry,
  type EntryMap,
  type TrackerEntry,
} from "@/lib/tracker-entries";
import { useScrollToHash } from "@/lib/scroll";
import { useHomeData } from "@/state/home-context";
import { usualDoseVials } from "@/components/profile/clinical-profile";
import { useProfiles } from "@/state/profile-context";

/**
 * The tracker's cards, for a layout to arrange. The phone's Tracker tab stacks
 * them; the one-page desktop layout runs them down the page under the status
 * card, grouped into doses and supplies. The sheets they open belong to the
 * tracker either way.
 */
export type TrackerCards = {
  /** Load and save failures, or null when there are none. */
  errors: ReactNode;
  calendar: ReactNode;
  supply: ReactNode;
  inventory: ReactNode;
  routine: ReactNode;
  planAhead: ReactNode;
  /** The USB dose device. Null wherever the browser cannot open a serial port. */
  device: ReactNode;
};

export type TrackerLayout = (cards: TrackerCards) => ReactNode;

type TrackerProps = {
  /** Whose ledger to load. Undefined before any profile exists; the page then reads empty. */
  profileId?: number;
  /** Vials to keep at home, as the profile stores it. */
  bufferVials: number | null;
  /** The day of the month this profile orders on, as the profile stores it. */
  orderDayOfMonth: number | null;
  /** Stores the buffer and order day on the profile. Absent when there is no profile to merge them into. */
  onSaveOrderPreferences?: (
    bufferVials: number | null,
    orderDay: number | null,
  ) => Promise<boolean>;
  /** The regular dose recorded on the profile, in vials. Seeds a routine's dose, and a dose logged without one. */
  usualVials?: number;
  /** Whether the routine card sets a first routine up, or the status card does (the one-page layout). */
  offersRoutineSetup: boolean;
  layout: TrackerLayout;
};

/** The doses a routine is counted from: a planned dose taken, or one taken late. */
const ROUTINE_DOSE_KINDS = new Set<TrackerEntry["kind"]>(["prophylaxis", "makeup"]);

/** Every kind that takes factor out of the cupboard, and so settles its day. */
const USE_KINDS = new Set<TrackerEntry["kind"]>(FACTOR_USE_KINDS);

/** A dose is made up within the week; anything later is a new dose entirely. */
const MAKEUP_WINDOW_DAYS = 7;

/** Whether a day already holds a factor use of any kind. */
function dayHasUse(entries: EntryMap, dateKey: string) {
  return (entries[dateKey] ?? []).some((entry) => USE_KINDS.has(entry.kind));
}

/**
 * The planned days that were missed: in the past, with no factor use on them,
 * and not already made up by a later dose that names them.
 *
 * Derived, never stored. That is the whole point — a miss is the absence of an
 * entry, so recording it as one gave the tracker two rows for a single dose
 * that could disagree. Backdating the dose, or logging it as a make-up,
 * removes the day from this set on the next fold.
 */
function missedDays(
  occurrences: Record<string, Occurrence>,
  entries: EntryMap,
  todayKey: string,
): string[] {
  const madeUp = new Set(
    Object.values(entries)
      .flat()
      .filter((entry) => entry.kind === "makeup")
      .map((entry) => (entry.kind === "makeup" ? entry.missedDateKey : "")),
  );
  return Object.keys(occurrences)
    .filter(
      (dateKey) =>
        dateKey < todayKey &&
        !madeUp.has(dateKey) &&
        !(entries[dateKey] ?? []).some((entry) => USE_KINDS.has(entry.kind)),
    )
    .sort();
}

/**
 * The calendar, the supply summary, the routine, the plans, and the sheets
 * for logging a day. Every card and sheet is a component under
 * `@/components/tracker`; `layout` decides where the cards go.
 *
 * Three hooks own the data and nothing is derived in the page:
 * `useLedger` for the entries (with what the API charged for each),
 * `useSchedule` for the routine and the doses it plans in the visible grid,
 * and `usePlans` for the temporary changes to it. The fold — factor on hand,
 * the run-out date and the order advice — is the one `HomeDataProvider`
 * holds for the status card, re-read through `refreshStatus` whenever any of
 * the three writes. There is one copy, so the status card's "Vials at home"
 * and the supply card's figure cannot disagree.
 *
 * The status card writes to the same ledger and routine. Its writes move
 * `writeVersion`, which re-reads all three here.
 */
function TrackerPage({
  profileId,
  bufferVials,
  orderDayOfMonth,
  onSaveOrderPreferences,
  usualVials,
  offersRoutineSetup,
  layout,
}: TrackerProps) {
  const today = useMemo(() => getSingaporeToday(), []);
  const [viewMonth, setViewMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [flow, setFlow] = useState<DayFlow | null>(null);
  const [showSupplyHistory, setShowSupplyHistory] = useState(false);
  /** The day a stock count is being entered for: today from the supply card, or the day being edited. */
  const [countOn, setCountOn] = useState<string | null>(null);
  /** An off-cycle dose the user just logged; the prompt offers to restart the routine from it. */
  const [shiftFrom, setShiftFrom] = useState<Date | null>(null);

  const { status, statusError, writeVersion, refreshStatus } = useHomeData();
  const {
    entries,
    mutate,
    version: ledgerVersion,
    error: ledgerError,
  } = useLedger(profileId, writeVersion);
  const range = useMemo(() => monthGridRange(viewMonth), [viewMonth]);
  const plans = usePlans(profileId);
  // The planned doses follow the plans, so a plan write re-reads the window.
  const schedule = useSchedule(profileId, range, plans.version + writeVersion);
  const trackerVersion = ledgerVersion + schedule.version + plans.version;
  const routineFrequency = schedule.series ? frequencyOf(schedule.series) : undefined;

  // The fold follows every write here; the status card reads the same copy.
  useEffect(() => {
    if (trackerVersion > 0) void refreshStatus();
  }, [trackerVersion, refreshStatus]);

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const dayEntries = selectedKey ? (entries[selectedKey] ?? []) : [];
  const isFutureDate = Boolean(selectedDate && selectedDate.getTime() > today.getTime());
  const isPastDate = Boolean(selectedDate && selectedDate.getTime() < today.getTime());
  const plannedOnSelected = selectedKey ? schedule.occurrences[selectedKey] : undefined;
  const missed = useMemo(
    () => missedDays(schedule.occurrences, entries, toKey(today)),
    [schedule.occurrences, entries, today],
  );
  // What this date can make up for: a missed day in the week before it. Newest
  // first, because the most recent miss is nearly always the one meant.
  const makeupCandidates = useMemo(() => {
    if (!selectedKey) return [];
    const earliest = toKey(
      new Date(fromKey(selectedKey).getTime() - MAKEUP_WINDOW_DAYS * 86400000),
    );
    return missed.filter((dateKey) => dateKey >= earliest && dateKey < selectedKey).reverse();
  }, [missed, selectedKey]);
  // A planned dose can be moved until its day holds a factor use, and a day
  // that has passed cannot be planned again.
  // A plan's dose follows the plan and is not offered.
  const canMovePlanned =
    Boolean(plannedOnSelected && plannedOnSelected.schedule_id !== null) &&
    !isPastDate &&
    !dayEntries.some((entry) => USE_KINDS.has(entry.kind));

  const errors = [ledgerError, schedule.error, statusError].filter((message): message is string =>
    Boolean(message),
  );

  /**
   * The USB board. Its dose button means "I took my routine dose now", filed
   * like Home's "Taken": one use per day, so a second press changes nothing.
   * Its + and − settle on a count, filed like the supply card's "Correct":
   * today's stock count, one per day. Its display follows the fold — vials at
   * home and the next planned dose — and its reminder sounds while that dose
   * is due and nothing is logged today.
   */
  const todayKey = toKey(today);
  const usedToday = dayHasUse(entries, todayKey);
  const logDeviceDose = useCallback(() => {
    mutate((current) =>
      dayHasUse(current, todayKey) ? current : recordProphylaxis(current, todayKey, Date.now()),
    );
  }, [mutate, todayKey]);
  const fileDeviceCount = useCallback(
    (vials: number) => mutate((current) => recordCount(current, todayKey, vials, Date.now())),
    [mutate, todayKey],
  );
  const device = useDevice({
    todayKey,
    vials: status?.vials_on_hand,
    dateLabel: formatDeviceDate(status?.next_dose ? fromKey(status.next_dose.on) : today),
    doseDue: Boolean(status?.next_dose && status.next_dose.on <= todayKey && !usedToday),
    onDoseTaken: logDeviceDose,
    onCount: fileDeviceCount,
  });

  /** Replace the entries on one day. */
  function updateDay(dateKey: string, update: (current: TrackerEntry[]) => TrackerEntry[]) {
    mutate((current) => ({ ...current, [dateKey]: update(current[dateKey] ?? []) }));
  }

  /** Add an entry, replacing any existing one of the same kinds. */
  function putEntry(dateKey: string, entry: TrackerEntry, replaces: TrackerEntry["kind"][]) {
    mutate((current) => withEntry(current, dateKey, entry, replaces));
  }

  /**
   * After a routine-sized dose lands on `dateKey`: if nothing was planned
   * there, no plan covers the day, and no later routine dose is on record,
   * offer to count the cycle from this dose instead. Backfilled history is
   * left alone — only the latest dose can put a routine off its cycle.
   */
  function considerShift(dateKey: string, ledger: EntryMap) {
    if (!schedule.series || !routineFrequency) return;
    if (dateKey < schedule.series.start_on) return;
    if (dateKey < range.since || dateKey > range.until) return;
    if (schedule.occurrences[dateKey]) return;
    if (plans.plans.some((plan) => plan.startKey <= dateKey && dateKey <= plan.endKey)) return;
    const laterDose = Object.entries(ledger).some(
      ([key, dayEntries]) =>
        key > dateKey && dayEntries.some((entry) => ROUTINE_DOSE_KINDS.has(entry.kind)),
    );
    if (!laterDose) setShiftFrom(fromKey(dateKey));
  }

  /** "Shift all future doses": a new series counted from the off-cycle dose. */
  async function answerShift(shift: boolean) {
    const from = shiftFrom;
    setShiftFrom(null);
    if (!shift || !from || !schedule.series || !routineFrequency) return;
    await schedule.replace({
      start_on: toKey(from),
      ...frequencyToApi(shiftedFrequency(routineFrequency, from)),
      vials: schedule.series.vials,
    });
  }

  function closeFlows() {
    setFlow(null);
  }

  function closeAll() {
    setSelectedDate(null);
    closeFlows();
  }

  function openFlow(next: DayFlow) {
    setFlow(next);
  }

  /** The day's factor use, if it has one. The tracker records at most one. */
  const savedUse = dayEntries.find((entry): entry is SavedUse => USE_KINDS.has(entry.kind));

  /**
   * One injection, whichever kind it is — the sheet hands back a whole entry.
   * Saving replaces any use already on the day, the rule Home's "Taken" button
   * applies too: one factor use per day.
   *
   * A dose taken late is a single entry on the day it was taken;
   * `missedDateKey` is what stops the earlier day reading as missed, and the
   * API refuses it if that day already holds a use of its own.
   */
  function saveUse(use: FactorUse) {
    if (!selectedKey) return;
    const dateKey = selectedKey;
    putEntry(dateKey, { id: Date.now(), ...use }, [...FACTOR_USE_KINDS]);
    // Back to the day sheet rather than right out — the day often has more to log.
    closeFlows();
    // A routine-sized dose can land on a day the routine did not plan, which is
    // the question `considerShift` asks. A bleed is not a routine dose.
    if (use.kind === "prophylaxis" || use.kind === "makeup") considerShift(dateKey, entries);
  }

  function saveRefill(vials: number) {
    if (!selectedKey) return;
    putEntry(selectedKey, { id: Date.now(), kind: "refill", vials }, ["refill"]);
    closeFlows();
  }

  /**
   * The vials actually at home on `countOn`. One count per day, so saving
   * replaces any count already there.
   */
  function saveCount(vials: number) {
    if (!countOn) return;
    const dateKey = countOn;
    mutate((current) => recordCount(current, dateKey, vials, Date.now()));
    setCountOn(null);
  }

  /** The Factor Use sheet opens on whatever the day already holds, so kind is enough. */
  function editEntry(entry: TrackerEntry) {
    if (entry.kind === "count") {
      if (selectedKey) setCountOn(selectedKey);
      return;
    }
    setFlow(entry.kind === "refill" ? "refill" : "use");
  }

  /**
   * One entry, one delete. A make-up dose is an ordinary factor use, so
   * removing it puts its planned day back to missed on the next fold — there
   * is no second record to keep in step.
   */
  function deleteEntry(entry: TrackerEntry) {
    if (!selectedKey) return;
    updateDay(selectedKey, (current) => current.filter((item) => item.id !== entry.id));
  }

  async function moveDose(date: Date) {
    if (!plannedOnSelected) return;
    if (await schedule.move(plannedOnSelected, toKey(date))) closeAll();
  }

  async function restoreDose() {
    if (!plannedOnSelected) return;
    if (await schedule.restore(plannedOnSelected)) closeAll();
  }

  return (
    <>
      {layout({
        errors: errors.length ? (
          <div className="flex flex-col gap-2">
            {errors.map((message) => (
              <p
                key={message}
                role="status"
                className="rounded-2xl border border-brick-200 bg-brick-50 px-4 py-3 text-sm font-medium text-brick-600"
              >
                {message}
              </p>
            ))}
          </div>
        ) : null,
        calendar: (
          <MonthCalendar
            month={viewMonth}
            today={today}
            selectedDate={selectedDate}
            entries={entries}
            planned={schedule.occurrences}
            missed={missed}
            onMonthChange={setViewMonth}
            onSelectDate={(date) => {
              setSelectedDate(date);
              closeFlows();
            }}
          />
        ),
        supply: (
          <FactorSupplyCard
            vialsRemaining={status?.vials_on_hand ?? 0}
            stockState={status?.stock_state}
            bufferVials={bufferVials}
            orderDayOfMonth={orderDayOfMonth}
            hasSchedule={Boolean(status?.schedule)}
            order={status?.order ?? null}
            isLoading={status === null}
            onShowHistory={() => setShowSupplyHistory(true)}
            onCorrect={() => setCountOn(todayKey)}
          />
        ),
        inventory: <InventoryCard profileId={profileId} />,
        routine: (
          <RoutineCard
            series={schedule.series}
            offersSetup={offersRoutineSetup}
            today={today}
            bufferVials={bufferVials}
            orderDayOfMonth={orderDayOfMonth}
            usualVials={usualVials}
            onReplace={schedule.replace}
            onRemove={schedule.remove}
            onSaveOrderPreferences={onSaveOrderPreferences}
          />
        ),
        planAhead: (
          <PlanAheadCard
            plans={plans.plans}
            today={today}
            routineVials={schedule.series?.vials}
            error={plans.error}
            onAdd={plans.add}
            onUpdate={plans.update}
            onRemove={plans.remove}
          />
        ),
        device: <DeviceCard device={device} />,
      })}

      {selectedDate && (
        <>
          <DayActionsSheet
            date={selectedDate}
            isFuture={isFutureDate}
            planned={plannedOnSelected}
            canMovePlanned={canMovePlanned}
            activeFlow={flow}
            onPick={openFlow}
            onClose={closeAll}
          />
          <SavedEntriesPanel entries={dayEntries} onEdit={editEntry} onDelete={deleteEntry} />
        </>
      )}

      {selectedDate && flow === "refill" && (
        <RefillSheet
          savedVials={dayEntries.find((entry) => entry.kind === "refill")?.vials}
          onSave={saveRefill}
          onBack={closeFlows}
          onClose={closeAll}
        />
      )}

      {selectedDate && flow === "use" && (
        <FactorUseFlow
          saved={savedUse}
          routineVials={schedule.series?.vials}
          usualVials={usualVials}
          missedDays={makeupCandidates}
          onSave={saveUse}
          onBack={closeFlows}
          onClose={closeAll}
        />
      )}

      {selectedDate && flow === "move" && plannedOnSelected && (
        <MoveDoseFlow
          occurrence={plannedOnSelected}
          today={today}
          onMove={moveDose}
          onRestore={restoreDose}
          onBack={closeFlows}
          onClose={closeAll}
        />
      )}

      {shiftFrom && routineFrequency && (
        <ScheduleShiftPrompt
          doseDate={shiftFrom}
          frequency={shiftedFrequency(routineFrequency, shiftFrom)}
          onAnswer={(shift) => void answerShift(shift)}
        />
      )}

      {countOn && (
        <StockCountSheet
          // A count already on the day is what is being edited; otherwise
          // start from the figure the user is correcting.
          initialVials={
            entries[countOn]?.find((entry) => entry.kind === "count")?.vials ??
            status?.vials_on_hand
          }
          onSave={saveCount}
          onClose={() => setCountOn(null)}
        />
      )}

      {showSupplyHistory && (
        <SupplyHistorySheet
          rows={supplyHistory(entries)}
          onClose={() => setShowSupplyHistory(false)}
        />
      )}
    </>
  );
}

/**
 * The phone's Tracker tab: every card in one column. The supply and routine
 * cards are anchors, so Home's "How much to order" and "Set up routine" land
 * on them.
 */
function TrackerScreen({ cards }: { cards: TrackerCards }) {
  useScrollToHash();
  return (
    <div className="px-4 pt-7 sm:px-1">
      <PageHeader title="Tracker" />
      {cards.errors ? <div className="mt-4">{cards.errors}</div> : null}
      <div className="mt-5 flex flex-col gap-4">
        {cards.calendar}
        <div id="supply" className="scroll-mt-4">
          {cards.supply}
        </div>
        {cards.inventory}
        <div id="routine" className="scroll-mt-4">
          {cards.routine}
        </div>
        {cards.planAhead}
        {cards.device}
      </div>
    </div>
  );
}

const phoneLayout: TrackerLayout = (cards) => <TrackerScreen cards={cards} />;

/* ===================================================================== */
/* Tracker — the adapter between the page and the active profile         */
/* ===================================================================== */

/**
 * The tracker for the active profile, laid out by `layout` — the phone's tab
 * by default, where its routine card also sets a first routine up. A layout
 * whose status card does that itself passes `offersRoutineSetup={false}`.
 */
export function Tracker({
  layout = phoneLayout,
  offersRoutineSetup = true,
}: {
  layout?: TrackerLayout;
  offersRoutineSetup?: boolean;
}) {
  const { activeProfile, updateProfile } = useProfiles();
  const clinical = activeProfile?.clinical_profile ?? null;
  const profileId = activeProfile?.id;

  /**
   * The order buffer is asked for beside the routine but stored on the
   * profile, so this merges it into what is already there — the Medical ID
   * fields and the diagnosis are saved by their own screens, and the API
   * replaces the whole object.
   */
  const saveOrderPreferences = useCallback(
    async (bufferVials: number | null, orderDay: number | null) => {
      if (profileId === undefined || !clinical) return false;
      try {
        await updateProfile(profileId, {
          clinical_profile: {
            ...clinical,
            minimum_buffer_vials: bufferVials,
            order_day_of_month: orderDay,
          },
        });
        return true;
      } catch {
        // The routine itself saved; the card keeps showing the stored buffer
        // rather than a number that never landed.
        return false;
      }
    },
    [profileId, clinical, updateProfile],
  );

  return (
    <TrackerPage
      // Remount on a profile switch: the page holds the selected day and any
      // open sheet, and neither means anything for the person you just became.
      key={activeProfile?.id ?? "none"}
      profileId={profileId}
      bufferVials={clinical?.minimum_buffer_vials ?? null}
      orderDayOfMonth={clinical?.order_day_of_month ?? null}
      onSaveOrderPreferences={clinical ? saveOrderPreferences : undefined}
      usualVials={usualDoseVials(clinical)}
      offersRoutineSetup={offersRoutineSetup}
      layout={layout}
    />
  );
}
