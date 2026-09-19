import { useEffect, useMemo, useState } from "react";
import { connectArduino, disconnectArduino, sendToArduino, tryAutoConnect } from "@/lib/arduino";


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

interface DoseHistoryItem {
  id: number;
  date: string;
  time: string;
  source: "device" | "manual";
}

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

    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [deviceVials, setDeviceVials] = useState<number | null>(null);

  // Dose history state saved in browser storage
  const [doseHistory, setDoseHistory] = useState<DoseHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("haemkaki_dose_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Helper to record date, time, and whether logged by device or web app
  const recordDoseHistory = (source: "device" | "manual") => {
    const now = new Date();
    const newEntry: DoseHistoryItem = {
      id: Date.now(),
      date: now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source,
    };

    setDoseHistory((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem("haemkaki_dose_history", JSON.stringify(updated));
      return updated;
    });
  };
    // Auto-connect to previously paired Arduino on page load
  useEffect(() => {
    tryAutoConnect({
      onStatusChange: (connected) => {
        setIsDeviceConnected(connected);
        if (connected) {
          // Send today's date and vials 1.5s after connect
          setTimeout(() => {
            const todayStr = today.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
            sendToArduino(`SET_DATE:${todayStr}`);
            sendToArduino(`SET_VIALS:${factorSupply}`);
          }, 1500);
        }
      },
      onDoseTaken: () => {
        console.log("Device dose triggered!");
        const key = toKey(new Date());
        putEntry(key, { id: Date.now(), kind: "prophylaxis" }, [
          "prophylaxis",
          "on-demand",
          "follow-up",
          "missed",
        ]);
        recordDoseHistory("device");
      },
      onVialsChange: (count) => {
        console.log("Device sent vials:", count);
        setDeviceVials(count);
      },
    });
  }, [today]);

  // Connect/disconnect button handler
  const handleToggleDevice = async () => {
    if (isDeviceConnected) {
      await disconnectArduino();
      setIsDeviceConnected(false);
     } else {
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
            await connectArduino(
        {
          onStatusChange: setIsDeviceConnected,
          onDoseTaken: () => {
            console.log("Device dose triggered!");
            const key = toKey(new Date());
            putEntry(key, { id: Date.now(), kind: "prophylaxis" }, [
              "prophylaxis",
              "on-demand",
              "follow-up",
              "missed",
            ]);
            recordDoseHistory("device");
          },
                onVialsChange: (count) => {
        console.log("Device sent vials:", count);
        setDeviceVials(count);
      },
        },
        factorSupply,
        formattedDate
      );
    }
  };

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
  console.log("routine.vials is:", routine.vials, "factorSupply calculated as:", factorSupply);
    // Automatically send website vial count to the Arduino whenever it changes
   // When the device connects, send whatever vial count is on the web to the Arduino
  const isFactorSupplyLow =
    minimumFactorSupplyVials !== undefined && factorSupply <= minimumFactorSupplyVials;
  const scheduleAnchorDate = useMemo(
    () => latestDoseDate(entries, routine.startDate),
    [entries, routine.startDate],
  );
  // Find the next upcoming scheduled prophylaxis date
const nextDoseDate = useMemo(() => {
  if (!scheduleAnchorDate || !routine.intervalDays) return null;

  // If today's dose was already taken, look starting tomorrow; otherwise start from today
  const todayKey = toKey(today);
  const tookToday = (entries[todayKey] ?? []).some((e) => e.kind === "prophylaxis");

  const check = new Date(today);
  if (tookToday) {
    check.setDate(check.getDate() + 1);
  }

  // Look ahead up to 30 days to find the next scheduled dose matching your calendar
  for (let i = 0; i < 30; i++) {
    if (isScheduledProphylaxisDate(check, scheduleAnchorDate, routine.intervalDays)) {
      return new Date(check);
    }
    check.setDate(check.getDate() + 1);
  }
  return null;
}, [today, entries, scheduleAnchorDate, routine.intervalDays]);
   // Keep Arduino synced whenever the count on the web changes
    // Keep Arduino synced whenever the count or scheduled date changes
  useEffect(() => {
    if (!isDeviceConnected) return;

    const timer = setTimeout(() => {
      // 1. Send vial count
      const countToSend = deviceVials ?? factorSupply ?? 0;
      sendToArduino(`SET_VIALS:${countToSend}`);

      // 2. Format and send next scheduled dose date
      const dateObj = nextDoseDate ?? today;
      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });

      console.log("Sending date to Arduino:", formattedDate);
      sendToArduino(`SET_DATE:${formattedDate}`);
    }, 1500);

    return () => clearTimeout(timer);
  }, [deviceVials, factorSupply, nextDoseDate, isDeviceConnected, today]);

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
    recordDoseHistory("manual"); // 👈 Logs exact date and time with "Manual Log" badge
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
        <header className="mb-4 ml-3 mt-2 sm:mb-6 sm:ml-7 sm:mt-3 flex items-start justify-between">
  <div>
    <h1 className="text-[26px] font-bold tracking-tight text-[#6b3817] sm:text-[38px]">
      Tracker
    </h1>
    <p className="mt-1 text-[14px] leading-[1.5] text-[#806d51] sm:mt-2 sm:text-[18px]">
      Log doses and bleeds as they happen.
      <br />
      Tap on a date to start tracking.
    </p>
  </div>

        {/* USB Connect Button */}
        <button
          type="button"
          onClick={handleToggleDevice}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold ${
            isDeviceConnected
              ? "bg-[#2e7d32] text-white"
              : "bg-[#6b3817] text-[#f8f0e2] hover:bg-[#522b12]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isDeviceConnected ? "animate-pulse bg-emerald-200" : "bg-orange-200"
            }`}
          />
          {isDeviceConnected ? "Device Connected" : "Connect Device"}
        </button>

        {/* Separate Test Dose Reminder Button */}
        <button
          type="button"
          onClick={() => sendToArduino("DOSE_ALERT_ON")}
          className="ml-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
        >
          Test Dose Reminder
        </button>

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
          vialsRemaining={deviceVials ?? factorSupply}
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
        {/* Dose History Card */}
<section className="mt-4 rounded-2xl bg-[#efe3cf] p-4 text-[#443229] shadow-sm">
  <div className="flex items-center justify-between">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b3817]">
      Recent Dose History
    </h3>
    <span className="text-[11px] text-[#806d51]">
      {doseHistory.length} total logged
    </span>
  </div>

  {doseHistory.length === 0 ? (
    <p className="mt-2 text-xs text-[#806d51]">
      No doses recorded yet. Take a dose with your device to see it logged here.
    </p>
  ) : (
    <ul className="mt-3 divide-y divide-[#dfd2bc] text-xs">
      {doseHistory.slice(0, 5).map((item) => (
        <li key={item.id} className="flex items-center justify-between py-2.5">
          <div>
            <span className="font-semibold text-[#6b3817]">{item.date}</span>
            <span className="ml-2 text-[#806d51]">at {item.time}</span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
              item.source === "device"
                ? "bg-[#2e7d32]/15 text-[#2e7d32]"
                : "bg-[#6b3817]/10 text-[#6b3817]"
            }`}
          >
            {item.source === "device" ? "🔌 Hardware Device" : "📱 Web App"}
          </span>
        </li>
      ))}
    </ul>
  )}
</section>

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