import { useEffect, useMemo, useState, type ReactNode } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DayActionsSheet, type DayFlow } from "@/components/tracker/DayActionsSheet";
import { FactorSupplyCard, SupplyHistorySheet } from "@/components/tracker/FactorSupplyCard";
import { FactorUseFlow, type SavedUse } from "@/components/tracker/FactorUseFlow";
import { InventoryCard } from "@/components/tracker/InventoryCard";
import { MissedDoseFlow } from "@/components/tracker/MissedDoseFlow";
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
  recordProphylaxis,
  supplyHistory,
  withEntry,
  type DoseAmount,
  type EntryMap,
  type TrackerEntry,
} from "@/lib/tracker-entries";
import { Card, CardTitle } from "@/components/ui/Card";
import { useScrollToHash } from "@/lib/scroll";
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
  /** Prefills a first routine's interval from the onboarding form's "times per week". */
  defaultIntervalDays?: number;
  layout: TrackerLayout;
};

/** The doses a routine is counted from: a planned dose taken, or one made up later. */
const ROUTINE_DOSE_KINDS = new Set<TrackerEntry["kind"]>(["prophylaxis", "makeup"]);

/**
 * The calendar, the supply summary, the routine, the plans, and the sheets
 * for logging a day. Every card and sheet is a component under
 * `@/components/tracker`; `layout` decides where the cards go.
 *
 * Four hooks own the data and nothing is derived in the page:
 * `useLedger` for the entries (with what the API charged for each),
 * `useSchedule` for the routine and the doses it plans in the visible grid,
 * `usePlans` for the temporary changes to it, and `useStatus` for the fold —
 * vials on hand, the run-out date and the order advice — re-read whenever
 * any of the other three writes.
 *
 * The status card writes to the same ledger and routine. Its writes move
 * `writeVersion`, which re-reads all three here; this page's writes re-read
 * the status card's figures through `refreshStatus`.
 */
function TrackerPage({ profileId, defaultIntervalDays, layout }: TrackerProps) {
  const today = useMemo(() => getSingaporeToday(), []);
  const [viewMonth, setViewMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [flow, setFlow] = useState<DayFlow | null>(null);
  /** Set when a Factor Use flow was reopened from an existing entry. */
  const [editingUseType, setEditingUseType] = useState<"on-demand" | "follow-up" | null>(null);
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
  const { status, error: statusError } = useStatus(profileId, trackerVersion + writeVersion);
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
  // A planned dose can be moved until its day is settled — by a logged dose or
  // a missed-dose record — and a day that has passed cannot be planned again.
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
    setEditingUseType(null);
  }

  function closeAll() {
    setSelectedDate(null);
    closeFlows();
  }

  function openFlow(next: DayFlow) {
    setEditingUseType(null);
    setFlow(next);
    // A missed dose is recorded the moment it is flagged; the following steps
    // refine it rather than create it.
    if (next === "missed" && selectedKey) {
      updateDay(selectedKey, (current) =>
        current.some((entry) => entry.kind === "missed")
          ? current
          : [...current, { id: Date.now(), kind: "missed", status: "awaiting" }],
      );
    }
  }

  const savedUse: SavedUse = {
    prophylaxis: dayEntries.some((entry) => entry.kind === "prophylaxis"),
    "on-demand": dayEntries.find((entry) => entry.kind === "on-demand")?.vials,
    "follow-up": dayEntries.find((entry) => entry.kind === "follow-up")?.vials,
  };

  function saveProphylaxis() {
    if (!selectedKey) return;
    // The same rule Home's "Taken" button applies: a confirmed dose supersedes
    // any "Missed Dose" record for the same day.
    const dateKey = selectedKey;
    mutate((current) => recordProphylaxis(current, dateKey, Date.now()));
    considerShift(dateKey, entries);
  }

  function saveCountedUse(kind: "on-demand" | "follow-up", vials: number) {
    if (!selectedKey) return;
    putEntry(selectedKey, { id: Date.now(), kind, vials }, [
      "prophylaxis",
      "on-demand",
      "follow-up",
    ]);
    // Back to the day sheet rather than right out — the day often has more to log.
    closeFlows();
  }

  function saveRefill(vials: number) {
    if (!selectedKey) return;
    putEntry(selectedKey, { id: Date.now(), kind: "refill", vials }, ["refill"]);
    closeFlows();
  }

  /** Update the missed entry on the selected date, leaving everything else alone. */
  function updateMissed(
    change: (entry: Extract<TrackerEntry, { kind: "missed" }>) => TrackerEntry,
  ) {
    if (!selectedKey) return;
    updateDay(selectedKey, (current) =>
      current.map((entry) => (entry.kind === "missed" ? change(entry) : entry)),
    );
  }

  /** Drop the made-up dose a missed entry points at, wherever it was filed. */
  function clearMakeup(missedDateKey: string, takenDateKey: string | undefined) {
    if (!takenDateKey) return;
    mutate((current) => ({
      ...current,
      [takenDateKey]: (current[takenDateKey] ?? []).filter(
        (entry) => !(entry.kind === "makeup" && entry.missedDateKey === missedDateKey),
      ),
    }));
  }

  function missedTakenOn(date: Date) {
    if (!selectedKey) return;
    const takenKey = toKey(date);
    const missed = dayEntries.find((entry) => entry.kind === "missed");
    const previousKey = missed?.kind === "missed" ? missed.takenDateKey : undefined;
    if (previousKey && previousKey !== takenKey) clearMakeup(selectedKey, previousKey);
    updateMissed((entry) => ({ ...entry, status: "taken", takenDateKey: takenKey }));
    mutate((current) => ({
      ...current,
      [takenKey]: [
        ...(current[takenKey] ?? []).filter(
          (entry) => !(entry.kind === "makeup" && entry.missedDateKey === selectedKey),
        ),
        {
          id: Date.now(),
          kind: "makeup",
          missedDateKey: selectedKey,
          amount: { source: "pending" },
        },
      ],
    }));
  }

  function missedAmount(amount: DoseAmount) {
    if (!selectedKey) return;
    const missed = dayEntries.find((entry) => entry.kind === "missed");
    const takenKey = missed?.kind === "missed" ? missed.takenDateKey : undefined;
    if (!takenKey) return;
    updateMissed((entry) => ({ ...entry, amount }));
    mutate((current) => ({
      ...current,
      [takenKey]: (current[takenKey] ?? []).map((entry) =>
        entry.kind === "makeup" && entry.missedDateKey === selectedKey
          ? { ...entry, amount }
          : entry,
      ),
    }));
    closeFlows();
    // The made-up dose is now complete, and it was taken on a day the routine
    // did not plan — the same question as a prophylaxis dose logged off-cycle.
    considerShift(takenKey, entries);
  }

  function missedSkipped() {
    if (!selectedKey) return;
    const missed = dayEntries.find((entry) => entry.kind === "missed");
    clearMakeup(selectedKey, missed?.kind === "missed" ? missed.takenDateKey : undefined);
    updateMissed(() => ({ id: Date.now(), kind: "missed", status: "skipped" }));
    closeFlows();
  }

  function editEntry(entry: TrackerEntry) {
    if (entry.kind === "refill") return setFlow("refill");
    if (entry.kind === "on-demand" || entry.kind === "follow-up") {
      setEditingUseType(entry.kind);
      return setFlow("use");
    }
    if (entry.kind === "prophylaxis") {
      setEditingUseType(null);
      return setFlow("use");
    }
    if (entry.kind === "missed") return setFlow("missed");
  }

  function deleteEntry(entry: TrackerEntry) {
    if (!selectedKey) return;
    updateDay(selectedKey, (current) => current.filter((item) => item.id !== entry.id));
    if (entry.kind === "missed") {
      clearMakeup(selectedKey, entry.takenDateKey);
    }
    if (entry.kind === "makeup") {
      // Deleting the made-up dose retracts the answer about the missed one too.
      mutate((current) => ({
        ...current,
        [entry.missedDateKey]: (current[entry.missedDateKey] ?? []).filter(
          (item) => item.kind !== "missed",
        ),
      }));
    }
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
            hasSchedule={Boolean(status?.schedule)}
            runsOutOn={status?.runs_out_on ? fromKey(status.runs_out_on) : null}
            order={status?.order ?? null}
            isLoading={status === null}
            onShowHistory={() => setShowSupplyHistory(true)}
          />
        ),
        inventory: <InventoryCard profileId={profileId} />,
        summary: <MonthSummary month={viewMonth} entries={entries} />,
        routine: (
          <RoutineCard
            series={schedule.series}
            today={today}
            defaultIntervalDays={defaultIntervalDays}
            onReplace={schedule.replace}
            onRemove={schedule.remove}
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
          initialType={editingUseType}
          onSaveProphylaxis={saveProphylaxis}
          onSaveCounted={saveCountedUse}
          onBack={closeFlows}
          onClose={closeAll}
        />
      )}

      {selectedDate && flow === "missed" && (
        <MissedDoseFlow
          missedDate={selectedDate}
          onSkip={missedSkipped}
          onTaken={() => updateMissed((entry) => ({ ...entry, status: "taken" }))}
          onTakenDate={missedTakenOn}
          onAmount={missedAmount}
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
  missed: new Set<TrackerEntry["kind"]>(["missed"]),
  bleeds: new Set<TrackerEntry["kind"]>(["on-demand"]),
} as const;

/**
 * "September so far" — the three counts a clinic conversation opens with,
 * tallied from the ledger for whichever month the calendar is showing.
 */
function MonthSummary({ month, entries }: { month: Date; entries: EntryMap }) {
  const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const counts = useMemo(() => {
    const tally = { taken: 0, missed: 0, bleeds: 0 };
    for (const [dateKey, dayEntries] of Object.entries(entries)) {
      if (!dateKey.startsWith(prefix)) continue;
      for (const entry of dayEntries) {
        if (SUMMARY_KINDS.taken.has(entry.kind)) tally.taken += 1;
        else if (SUMMARY_KINDS.missed.has(entry.kind)) tally.missed += 1;
        else if (SUMMARY_KINDS.bleeds.has(entry.kind)) tally.bleeds += 1;
      }
    }
    return tally;
  }, [entries, prefix]);

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

/**
 * "3 times per week" as a day interval, to prefill a first routine.
 *
 * Not exact, and cannot be: a 3x/week schedule really runs 2, 2, 3 days
 * apart. The nearest whole day is what a cycle can draw, and never less than
 * daily; the routine's frequency editor offers fixed weekdays for the exact
 * version. The form stores the frequency as prose; the number leads it.
 */
function intervalDaysFromFrequency(frequency: string | undefined): number | undefined {
  const perWeek = Number.parseFloat(frequency ?? "");
  if (!Number.isFinite(perWeek) || perWeek <= 0) return undefined;
  return Math.max(1, Math.round(7 / perWeek));
}

/** The tracker for the active profile, laid out by `layout` — the phone's tab by default. */
export function Tracker({ layout = phoneLayout }: { layout?: TrackerLayout }) {
  const { activeProfile } = useProfiles();
  const frequency = activeProfile?.clinical_profile?.prophylactic_medication?.frequency;
  return (
    <TrackerPage
      // Remount on a profile switch: the page holds the selected day and any
      // open sheet, and neither means anything for the person you just became.
      key={activeProfile?.id ?? "none"}
      profileId={activeProfile?.id}
      defaultIntervalDays={intervalDaysFromFrequency(frequency)}
      layout={layout}
    />
  );
}
