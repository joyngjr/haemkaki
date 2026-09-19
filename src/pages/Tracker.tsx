import { useMemo, useState } from "react";

import { ProfileButton } from "@/components/profile/ProfileButton";
import { DayActionsSheet, type DayFlow } from "@/components/tracker/DayActionsSheet";
import { FactorSupplyCard, SupplyHistorySheet } from "@/components/tracker/FactorSupplyCard";
import { FactorUseFlow, type SavedUse } from "@/components/tracker/FactorUseFlow";
import { MissedDoseFlow } from "@/components/tracker/MissedDoseFlow";
import { MonthCalendar } from "@/components/tracker/MonthCalendar";
import { RefillSheet } from "@/components/tracker/RefillSheet";
import { RoutineCard } from "@/components/tracker/RoutineCard";
import { SavedEntriesPanel } from "@/components/tracker/SavedEntriesPanel";
import { useRoutine, type RoutineProps } from "@/components/tracker/useRoutine";
import { getSingaporeToday, isScheduledProphylaxisDate, toKey } from "@/lib/tracker-dates";
import {
  latestDoseDate,
  supplyHistory,
  totalFactorSupply,
  withRoutineStartDose,
  type DoseAmount,
  type EntryMap,
  type TrackerEntry,
} from "@/lib/tracker-entries";

type TrackerProps = RoutineProps & {
  /** Minimum factor supply buffer, in vials, set during profile creation. Undefined until that flow exists. */
  minimumFactorSupplyVials?: number;
};

/**
 * The calendar, the supply summary, the routine, and the sheets for logging a
 * day. State lives here; every card and sheet is a component under
 * `@/components/tracker`.
 *
 * Entries are held in memory only — nothing is persisted yet, and the routine
 * props are unset until the profile-creation flow lands.
 */
export function Tracker({ minimumFactorSupplyVials, ...routineProps }: TrackerProps = {}) {
  const today = useMemo(() => getSingaporeToday(), []);
  const { routine, setVials, setIntervalDays, setStartDate } = useRoutine(routineProps);

  const [viewMonth, setViewMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [flow, setFlow] = useState<DayFlow | null>(null);
  /** Set when a Factor Use flow was reopened from an existing entry. */
  const [editingUseType, setEditingUseType] = useState<"on-demand" | "follow-up" | null>(null);
  const [stored, setStored] = useState<EntryMap>({});
  const [showSupplyHistory, setShowSupplyHistory] = useState(false);

  // The routine's own start date implies a dose; it is derived rather than
  // written so editing the routine can't strand a stale entry.
  const entries = useMemo(
    () => withRoutineStartDose(stored, routine.startDate, today),
    [stored, routine.startDate, today],
  );

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const dayEntries = selectedKey ? (entries[selectedKey] ?? []) : [];
  const isFutureDate = Boolean(selectedDate && selectedDate.getTime() > today.getTime());

  const factorSupply = totalFactorSupply(entries, routine.vials);
  const isFactorSupplyLow =
    minimumFactorSupplyVials !== undefined && factorSupply <= minimumFactorSupplyVials;
  const scheduleAnchorDate = useMemo(
    () => latestDoseDate(entries, routine.startDate),
    [entries, routine.startDate],
  );

  // Orders are placed a week before the month they cover.
  const nextOrderDate = useMemo(() => {
    const date = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    date.setDate(date.getDate() - 7);
    return date;
  }, [today]);
  const daysToNextOrder = Math.round(
    (nextOrderDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  const recommendedOrderVials = useMemo(() => {
    if (!routine.vials || !routine.intervalDays || !scheduleAnchorDate) return undefined;
    if (minimumFactorSupplyVials === undefined) return undefined;
    const monthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    let plannedDoses = 0;
    for (const day = new Date(monthStart); day <= monthEnd; day.setDate(day.getDate() + 1)) {
      if (isScheduledProphylaxisDate(day, scheduleAnchorDate, routine.intervalDays)) plannedDoses++;
    }
    return Math.max(0, plannedDoses * routine.vials + minimumFactorSupplyVials - factorSupply);
  }, [
    routine.vials,
    routine.intervalDays,
    scheduleAnchorDate,
    minimumFactorSupplyVials,
    factorSupply,
    today,
  ]);

  /** Replace the entries on one day. */
  function updateDay(dateKey: string, update: (current: TrackerEntry[]) => TrackerEntry[]) {
    setStored((current) => ({ ...current, [dateKey]: update(entries[dateKey] ?? []) }));
  }

  /** Add an entry, replacing any existing one of the same kinds. */
  function putEntry(dateKey: string, entry: TrackerEntry, replaces: TrackerEntry["kind"][]) {
    updateDay(dateKey, (current) => [
      ...current.filter((item) => !replaces.includes(item.kind)),
      entry,
    ]);
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
    // A confirmed dose supersedes any "Missed Dose" record for the same day.
    putEntry(selectedKey, { id: Date.now(), kind: "prophylaxis" }, [
      "prophylaxis",
      "on-demand",
      "follow-up",
      "missed",
    ]);
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
    setStored((current) => ({
      ...current,
      [takenDateKey]: (entries[takenDateKey] ?? []).filter(
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
    setStored((current) => ({
      ...current,
      [takenKey]: [
        ...(entries[takenKey] ?? []).filter(
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
    setStored((current) => ({
      ...current,
      [takenKey]: (entries[takenKey] ?? []).map((entry) =>
        entry.kind === "makeup" && entry.missedDateKey === selectedKey
          ? { ...entry, amount }
          : entry,
      ),
    }));
    closeFlows();
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
      setStored((current) => ({
        ...current,
        [entry.missedDateKey]: (entries[entry.missedDateKey] ?? []).filter(
          (item) => item.kind !== "missed",
        ),
      }));
    }
    // The routine's start date is what puts a dose there, so clear it instead.
    if (
      entry.kind === "prophylaxis" &&
      routine.startDate &&
      selectedKey === toKey(routine.startDate)
    ) {
      setStartDate(undefined);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f0e2] px-3 py-4 pb-24 text-[#443229] sm:px-8 sm:py-10 sm:pb-24">
      <main className="mx-auto max-w-5xl">
        <header className="mb-4 ml-3 mt-2 flex items-start justify-between gap-3 sm:mb-6 sm:ml-7 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold tracking-tight text-[#6b3817] sm:text-[38px]">
              Tracker
            </h1>
            <p className="mt-1 text-[14px] leading-[1.5] text-[#806d51] sm:mt-2 sm:text-[18px]">
              Log doses and bleeds as they happen.
              <br />
              Tap on a date to start tracking.
            </p>
          </div>
          <ProfileButton />
        </header>

        <MonthCalendar
          month={viewMonth}
          today={today}
          selectedDate={selectedDate}
          entries={entries}
          scheduleAnchorDate={scheduleAnchorDate}
          routineIntervalDays={routine.intervalDays}
          routineStartDate={routine.startDate}
          onMonthChange={setViewMonth}
          onSelectDate={(date) => {
            setSelectedDate(date);
            closeFlows();
          }}
        />

        <FactorSupplyCard
          vialsRemaining={factorSupply}
          isLow={isFactorSupplyLow}
          nextOrderDate={nextOrderDate}
          isOrderNeededAsap={isFactorSupplyLow && daysToNextOrder > 0}
          isNextOrderDateSoon={daysToNextOrder >= 0 && daysToNextOrder <= 3}
          recommendedOrderVials={recommendedOrderVials}
          onShowHistory={() => setShowSupplyHistory(true)}
        />

        <RoutineCard
          routine={routine}
          today={today}
          onIntervalDaysChange={setIntervalDays}
          onVialsChange={setVials}
          onStartDateChange={setStartDate}
        />
      </main>

      {selectedDate && (
        <>
          <DayActionsSheet
            date={selectedDate}
            isFuture={isFutureDate}
            activeFlow={flow}
            onPick={openFlow}
            onClose={closeAll}
          />
          <SavedEntriesPanel
            entries={dayEntries}
            routineVials={routine.vials}
            onEdit={editEntry}
            onDelete={deleteEntry}
          />
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

      {showSupplyHistory && (
        <SupplyHistorySheet
          rows={supplyHistory(entries, routine.vials)}
          onClose={() => setShowSupplyHistory(false)}
        />
      )}
    </div>
  );
}
