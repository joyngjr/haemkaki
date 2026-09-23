import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Occurrence } from "@/lib/api";

import { PageHeader } from "@/components/layout/PageHeader";
import { DayActionsSheet, type DayFlow } from "@/components/tracker/DayActionsSheet";
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
import { useLedger } from "@/components/tracker/useLedger";
import { usePlans } from "@/components/tracker/usePlans";
import { useSchedule } from "@/components/tracker/useSchedule";
import { useStatus } from "@/components/tracker/useStatus";
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
  supplyHistory,
  withEntry,
  type EntryMap,
  type TrackerEntry,
} from "@/lib/tracker-entries";
import { Card, CardTitle } from "@/components/ui/Card";
import { useScrollToHash } from "@/lib/scroll";
import { medicationVialCount } from "@/lib/medication-dose";
import { decodeOrderPreferences, encodeOrderPreferences } from "@/lib/order-preferences";
import { useHomeData } from "@/state/home-context";
import { useProfiles } from "@/state/profile-context";

/**
 * The tracker's cards, for a layout to arrange. The phone's Tracker tab stacks
 * them; the one-page desktop layout sets them beside the status card. The
 * sheets they open belong to the tracker either way.
 */
export type TrackerCards = {
  /** Load and save failures, or null when there are none. */
  errors: ReactNode;
  calendar: ReactNode;
  supply: ReactNode;
  inventory: ReactNode;
  summary: ReactNode;
  routine: ReactNode;
  planAhead: ReactNode;
};

export type TrackerLayout = (cards: TrackerCards) => ReactNode;

type TrackerProps = {
  /** Whose ledger to load. Undefined before any profile exists; the page then reads empty. */
  profileId?: number;
  /** Vials to keep in reserve before ordering, as the profile stores it. */
  bufferVials: number | null;
  /** Recurring calendar day on which this profile orders. */
  orderDayOfMonth: number | null;
  /** Whole-vial dose recorded during profile creation. */
  defaultVials?: number;
  /** Stores a new buffer on the profile. Absent when there is no profile to merge it into. */
  onSaveOrderPreferences?: (vials: number, dayOfMonth: number) => Promise<boolean>;
  layout: TrackerLayout;
};

/** The doses a routine is counted from: a planned dose taken, or one taken late. */
const ROUTINE_DOSE_KINDS = new Set<TrackerEntry["kind"]>(["prophylaxis", "makeup"]);

/** Every kind that takes factor out of the cupboard, and so settles its day. */
const USE_KINDS = new Set<TrackerEntry["kind"]>(FACTOR_USE_KINDS);

/** A dose is made up within the week; anything later is a new dose entirely. */
const MAKEUP_WINDOW_DAYS = 7;

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
 * Four hooks own the data and nothing is derived in the page:
 * `useLedger` for the entries (with what the API charged for each),
 * `useSchedule` for the routine and the doses it plans in the visible grid,
 * `usePlans` for the temporary changes to it, and `useStatus` for the fold —
 * vials on hand and the monthly order advice — re-read whenever
 * any of the other three writes.
 *
 * The status card writes to the same ledger and routine. Its writes move
 * `writeVersion`, which re-reads all three here; this page's writes re-read
 * the status card's figures through `refreshStatus`.
 */
function TrackerPage({
  profileId,
  bufferVials,
  orderDayOfMonth,
  defaultVials,
  onSaveOrderPreferences,
  layout,
}: TrackerProps) {
  const today = useMemo(() => getSingaporeToday(), []);
  const [viewMonth, setViewMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [flow, setFlow] = useState<DayFlow | null>(null);
  const [showSupplyHistory, setShowSupplyHistory] = useState(false);
  /** An off-cycle dose the user just logged; the prompt offers to restart the routine from it. */
  const [shiftFrom, setShiftFrom] = useState<Date | null>(null);

  const { writeVersion, refreshStatus } = useHomeData();
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
  const { status, error: statusError } = useStatus(
    profileId,
    trackerVersion + writeVersion,
    bufferVials,
    orderDayOfMonth,
  );
  const routineFrequency = schedule.series ? frequencyOf(schedule.series) : undefined;

  // The status card reads the same fold; keep it level with every write here.
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
    dayEntries.every((entry) => entry.kind === "refill");

  const errors = [ledgerError, schedule.error, statusError].filter((message): message is string =>
    Boolean(message),
  );

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
  const savedUse = dayEntries.find((entry): entry is SavedUse => entry.kind !== "refill");

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

  /** The Factor Use sheet opens on whatever the day already holds, so kind is enough. */
  function editEntry(entry: TrackerEntry) {
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
            bufferVials={bufferVials}
            orderDayOfMonth={orderDayOfMonth}
            hasSchedule={Boolean(status?.schedule)}
            order={status?.order ?? null}
            isLoading={status === null}
            onShowHistory={() => setShowSupplyHistory(true)}
          />
        ),
        inventory: <InventoryCard profileId={profileId} />,
        summary: <MonthSummary month={viewMonth} entries={entries} missed={missed} />,
        routine: (
          <RoutineCard
            series={schedule.series}
            today={today}
            bufferVials={bufferVials}
            orderDayOfMonth={orderDayOfMonth}
            defaultVials={defaultVials}
            onReplace={schedule.replace}
            onRemove={schedule.remove}
            onSaveOrderPreferences={onSaveOrderPreferences}
          />
        ),
        planAhead: (
          <PlanAheadCard
            plans={plans.plans}
            today={today}
            routineFrequency={routineFrequency}
            routineVials={schedule.series?.vials}
            error={plans.error}
            onAdd={plans.add}
            onUpdate={plans.update}
            onRemove={plans.remove}
          />
        ),
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
        {cards.summary}
        <div id="routine" className="scroll-mt-4">
          {cards.routine}
        </div>
        {cards.planAhead}
      </div>
    </div>
  );
}

const phoneLayout: TrackerLayout = (cards) => <TrackerScreen cards={cards} />;

const SUMMARY_KINDS = {
  taken: new Set<TrackerEntry["kind"]>(["prophylaxis", "makeup", "follow-up"]),
  bleeds: new Set<TrackerEntry["kind"]>(["on-demand"]),
} as const;

/**
 * "September so far" — the three counts a clinic conversation opens with,
 * tallied for whichever month the calendar is showing. Doses taken and bleeds
 * treated come from the ledger; doses missed are the planned days it has
 * nothing for, so they are counted from `missed` rather than from entries.
 */
function MonthSummary({
  month,
  entries,
  missed,
}: {
  month: Date;
  entries: EntryMap;
  missed: string[];
}) {
  const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const counts = useMemo(() => {
    const tally = { taken: 0, missed: 0, bleeds: 0 };
    for (const [dateKey, dayEntries] of Object.entries(entries)) {
      if (!dateKey.startsWith(prefix)) continue;
      for (const entry of dayEntries) {
        if (SUMMARY_KINDS.taken.has(entry.kind)) tally.taken += 1;
        else if (SUMMARY_KINDS.bleeds.has(entry.kind)) tally.bleeds += 1;
      }
    }
    tally.missed = missed.filter((dateKey) => dateKey.startsWith(prefix)).length;
    return tally;
  }, [entries, missed, prefix]);

  const rows: [string, number][] = [
    ["Doses taken", counts.taken],
    ["Doses missed", counts.missed],
    ["Bleeds treated", counts.bleeds],
  ];

  return (
    <Card className="lg:p-6">
      <CardTitle>{month.toLocaleDateString("en-SG", { month: "long" })} so far</CardTitle>
      <dl className="mt-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between py-1.5">
            <dt className="text-[15px] text-ink-muted">{label}</dt>
            <dd className="font-mono text-[22px] font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* ===================================================================== */
/* Tracker — the adapter between the page and the active profile         */
/* ===================================================================== */

/** The tracker for the active profile, laid out by `layout` — the phone's tab by default. */
export function Tracker({ layout = phoneLayout }: { layout?: TrackerLayout }) {
  const { activeProfile, updateProfile } = useProfiles();
  const clinical = activeProfile?.clinical_profile ?? null;
  const profileId = activeProfile?.id;
  const orderPreferences = decodeOrderPreferences(clinical?.minimum_buffer_days);

  /**
   * The vial reserve is asked for beside the routine but stored on the
   * profile, so this merges it into what is already there — the Medical ID
   * fields and the diagnosis are saved by their own screens, and the API
   * replaces the whole object.
   */
  const saveOrderPreferences = useCallback(
    async (vials: number, dayOfMonth: number) => {
      if (profileId === undefined || !clinical) return false;
      try {
        await updateProfile(profileId, {
          clinical_profile: {
            ...clinical,
            minimum_buffer_days: encodeOrderPreferences(vials, dayOfMonth),
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
      bufferVials={orderPreferences.bufferVials}
      orderDayOfMonth={orderPreferences.orderDayOfMonth}
      defaultVials={medicationVialCount(clinical?.prophylactic_medication)}
      onSaveOrderPreferences={clinical ? saveOrderPreferences : undefined}
      layout={layout}
    />
  );
}
