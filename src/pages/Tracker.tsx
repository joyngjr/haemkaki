import { useMemo, useState } from "react";

import { ProfileButton } from "@/components/profile/ProfileButton";
import { DayActionsSheet, type DayFlow } from "@/components/tracker/DayActionsSheet";
import {
  FactorSupplyCard,
  SupplyHistorySheet,
  type OrderBreakdown,
} from "@/components/tracker/FactorSupplyCard";
import { FactorUseFlow, type SavedUse } from "@/components/tracker/FactorUseFlow";
import { InventoryCard } from "@/components/tracker/InventoryCard";
import { MissedDoseFlow } from "@/components/tracker/MissedDoseFlow";
import { MonthCalendar } from "@/components/tracker/MonthCalendar";
import { RefillSheet } from "@/components/tracker/RefillSheet";
import { PlanAheadCard } from "@/components/tracker/PlanAheadCard";
import { RoutineCard } from "@/components/tracker/RoutineCard";
import { ScheduleShiftPrompt } from "@/components/tracker/ScheduleShiftPrompt";
import { SavedEntriesPanel } from "@/components/tracker/SavedEntriesPanel";
import { useRoutine, type RoutineProps } from "@/components/tracker/useRoutine";
import { CloseIcon } from "@/components/tracker/TrackerIcons";
import { useTrackerData } from "@/components/tracker/useTrackerData";
import type { PlanDraft } from "@/components/tracker/PlanAheadSheet";
import {
  getSingaporeToday,
  nextOrderDate,
  rotateWeekdays,
  shiftedFrequency,
  toKey,
  weekdayShiftFor,
  type Frequency,
} from "@/lib/tracker-dates";
import {
  findScheduleDisruption,
  scheduleDoseDate,
  supplyHistory,
  totalFactorSupply,
  type BleedNature,
  type DoseAmount,
  type TrackerEntry,
} from "@/lib/tracker-entries";
import { isPlannedProphylaxisDate, vialsOn } from "@/lib/tracker-plans";
import { useProfiles } from "@/state/profile-context";

type TrackerProps = RoutineProps & {
  /** Minimum factor supply buffer, in vials, set during profile creation. Undefined until that flow exists. */
  minimumFactorSupplyVials?: number;
};

/**
 * The tracker for the active profile. It is remounted when the profile changes,
 * so one person's selection, plans and drafts never carry over to another.
 */
export function Tracker(props: TrackerProps = {}) {
  const { activeProfile } = useProfiles();
  const profileId = activeProfile?.id ?? null;
  return <TrackerView key={profileId ?? "none"} profileId={profileId} {...props} />;
}

/**
 * The calendar, the supply summary, the routine, and the sheets for logging a
 * day. State lives here; every card and sheet is a component under
 * `@/components/tracker`.
 *
 * Everything here is saved to the backend for the profile (`useTrackerData`);
 * with no profile it stays in memory. Routine props passed in take precedence
 * over the saved routine.
 */
function TrackerView({
  profileId,
  minimumFactorSupplyVials,
  ...routineProps
}: TrackerProps & { profileId: number | null }) {
  const today = useMemo(() => getSingaporeToday(), []);
  const data = useTrackerData(profileId);
  const { entries, setEntries } = data;
  const { routine, setVials, setFrequency, setStartDate } = useRoutine({
    ...data.routineProps,
    ...routineProps,
  });

  const [viewMonth, setViewMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [flow, setFlow] = useState<DayFlow | null>(null);
  /** Set when a Factor Use flow was reopened from an existing entry. */
  const [editingUseType, setEditingUseType] = useState<"on-demand" | "follow-up" | null>(null);
  const [showSupplyHistory, setShowSupplyHistory] = useState(false);
  const { plans, setPlans, shift: scheduleShift, setShift: setScheduleShift } = data;

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const dayEntries = selectedKey ? (entries[selectedKey] ?? []) : [];
  const isFutureDate = Boolean(selectedDate && selectedDate.getTime() > today.getTime());

  /** Vials per dose on a day: a plan's dosage if one applies, else the routine's. */
  const dosageOn = (dateKey: string) => vialsOn(plans, dateKey, routine.vials);

  const factorSupply = totalFactorSupply(entries, dosageOn);
  const isFactorSupplyLow =
    minimumFactorSupplyVials !== undefined && factorSupply <= minimumFactorSupplyVials;
  // Planned doses count from the routine's start date until the user agrees to
  // shift them. A shift only holds while its dose still exists.
  const shiftedAnchorDate = useMemo(() => {
    const shifted = scheduleDoseDate(entries, scheduleShift.anchorId);
    return routine.startDate && shifted && shifted.getTime() > routine.startDate.getTime()
      ? shifted
      : undefined;
  }, [entries, routine.startDate, scheduleShift.anchorId]);
  const scheduleAnchorDate = shiftedAnchorDate ?? routine.startDate;
  const weekdayOffset = shiftedAnchorDate ? (scheduleShift.weekdayOffset ?? 0) : 0;
  // The routine's frequency as currently planned, with any accepted shift applied.
  const frequency = useMemo<Frequency | undefined>(() => {
    const base = routine.frequency;
    if (base?.unit !== "week" || !weekdayOffset) return base;
    return { unit: "week", weekdays: rotateWeekdays(base.weekdays, weekdayOffset) };
  }, [routine.frequency, weekdayOffset]);
  const isPlannedDate = useMemo(
    () => (date: Date) => isPlannedProphylaxisDate(date, scheduleAnchorDate, frequency, plans),
    [scheduleAnchorDate, frequency, plans],
  );
  const scheduleDisruption = useMemo(
    () =>
      frequency
        ? findScheduleDisruption(
            entries,
            scheduleAnchorDate,
            scheduleDoseDate(entries, scheduleShift.handledId),
            isPlannedDate,
          )
        : undefined,
    [entries, scheduleAnchorDate, scheduleShift.handledId, frequency, isPlannedDate],
  );

  function answerScheduleShift(shift: boolean) {
    if (!scheduleDisruption) return;
    const { id, date } = scheduleDisruption;
    setScheduleShift((current) => ({
      anchorId: shift ? id : current.anchorId,
      handledId: id,
      weekdayOffset:
        shift && frequency?.unit === "week"
          ? weekdayOffset + weekdayShiftFor(frequency.weekdays, date)
          : current.weekdayOffset,
    }));
  }

  /** Editing the routine's frequency starts its weekly pattern afresh. */
  function changeFrequency(next: Frequency) {
    setFrequency(next);
    setScheduleShift((current) => ({ ...current, weekdayOffset: 0 }));
  }

  function addPlan(plan: PlanDraft) {
    setPlans((current) => [...current, { ...plan, id: Date.now() }]);
  }

  function updatePlan(id: number, plan: PlanDraft) {
    setPlans((current) => current.map((item) => (item.id === id ? { ...plan, id } : item)));
  }

  // Orders are placed a week before the last Tuesday of the month.
  const orderDate = useMemo(() => nextOrderDate(today), [today]);
  const daysToNextOrder = Math.round(
    (orderDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  const orderBreakdown = useMemo<OrderBreakdown | undefined>(() => {
    if (!routine.vials || !frequency || !scheduleAnchorDate) return undefined;
    if (minimumFactorSupplyVials === undefined) return undefined;
    const monthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    let plannedDoses = 0;
    let plannedVials = 0;
    for (const day = new Date(monthStart); day <= monthEnd; day.setDate(day.getDate() + 1)) {
      if (!isPlannedDate(day)) continue;
      plannedDoses++;
      plannedVials += vialsOn(plans, toKey(day), routine.vials) ?? 0;
    }
    return {
      vials: Math.max(0, plannedVials + minimumFactorSupplyVials - factorSupply),
      monthLabel: monthStart.toLocaleDateString("en-US", { month: "long" }),
      plannedDoses,
      plannedVials,
      minimumBuffer: minimumFactorSupplyVials,
      currentSupply: factorSupply,
    };
  }, [
    routine.vials,
    frequency,
    scheduleAnchorDate,
    isPlannedDate,
    plans,
    minimumFactorSupplyVials,
    factorSupply,
    today,
  ]);

  /** Replace the entries on one day. */
  function updateDay(dateKey: string, update: (current: TrackerEntry[]) => TrackerEntry[]) {
    setEntries((current) => ({ ...current, [dateKey]: update(entries[dateKey] ?? []) }));
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
    onDemandNature: dayEntries.find((entry) => entry.kind === "on-demand")?.nature,
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

  function saveCountedUse(kind: "on-demand" | "follow-up", vials: number, nature?: BleedNature) {
    if (!selectedKey) return;
    putEntry(selectedKey, { id: Date.now(), kind, vials, ...(nature ? { nature } : {}) }, [
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
    setEntries((current) => ({
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
    setEntries((current) => ({
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
    setEntries((current) => ({
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
      setEntries((current) => ({
        ...current,
        [entry.missedDateKey]: (entries[entry.missedDateKey] ?? []).filter(
          (item) => item.kind !== "missed",
        ),
      }));
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

        {data.error && (
          <p
            role="alert"
            className="mb-4 flex items-start justify-between gap-2 rounded-2xl border border-[#eee5d5] bg-[#fffaf0] px-4 py-3 text-sm text-[#cd5952]"
          >
            <span>{data.error}</span>
            <button
              onClick={data.dismissError}
              aria-label="Dismiss"
              className="-my-2 -mr-2 grid h-11 w-11 shrink-0 place-items-center text-[#806d51]"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </p>
        )}

        <MonthCalendar
          month={viewMonth}
          today={today}
          selectedDate={selectedDate}
          entries={entries}
          isPlannedDate={isPlannedDate}
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
          nextOrderDate={orderDate}
          isOrderNeededAsap={isFactorSupplyLow && daysToNextOrder > 0}
          isNextOrderDateSoon={daysToNextOrder >= 0 && daysToNextOrder <= 3}
          order={orderBreakdown}
          onShowHistory={() => setShowSupplyHistory(true)}
        />

        <InventoryCard state={data.inventory} onChange={data.setInventory} />

        <RoutineCard
          routine={routine}
          today={today}
          onFrequencyChange={changeFrequency}
          onVialsChange={setVials}
          onStartDateChange={setStartDate}
        />

        <PlanAheadCard
          plans={plans}
          today={today}
          routineFrequency={routine.frequency}
          routineVials={routine.vials}
          onAdd={addPlan}
          onUpdate={updatePlan}
          onRemove={(id) => setPlans((current) => current.filter((plan) => plan.id !== id))}
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
            routineVials={selectedKey ? dosageOn(selectedKey) : routine.vials}
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

      {scheduleDisruption && frequency && (
        <ScheduleShiftPrompt
          doseDate={scheduleDisruption.date}
          frequency={shiftedFrequency(frequency, scheduleDisruption.date)}
          onAnswer={answerScheduleShift}
        />
      )}

      {showSupplyHistory && (
        <SupplyHistorySheet
          rows={supplyHistory(entries, dosageOn)}
          onClose={() => setShowSupplyHistory(false)}
        />
      )}
    </div>
  );
}
