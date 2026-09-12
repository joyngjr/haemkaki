import { useEffect, useMemo, useState } from "react";
import { Platelet } from "@/components/platelet/Platelet";

type SavedEntry = { id: number; label: string; detail: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

/** Regular prophylaxis schedule: every `intervalDays` days from `lastDoseDate`, both set during profile creation. */
function isScheduledProphylaxisDate(date: Date, lastDoseDate: Date | undefined, intervalDays: number | undefined) {
  if (!lastDoseDate || !intervalDays) return false;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((date.getTime() - lastDoseDate.getTime()) / msPerDay);
  if (diffDays <= 0) return false;
  return diffDays % intervalDays === 0;
}

function getSingaporeToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Singapore", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day));
}

function Icon({ name, className = "" }: { name: "chevronLeft" | "chevronRight" | "plus" | "close" | "search" | "repeat" | "calendar" | "vial" | "play"; className?: string }) {
  const paths = {
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    vial: <><rect x="8" y="2" width="8" height="20" rx="4" /><path d="M8 8h8" /></>,
    play: <path d="M6 4v16l14-8Z" fill="currentColor" stroke="none" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>;
}

type TrackerProps = {
  /** Regular prophylaxis dose in vials, set during profile creation. Undefined until that flow exists. */
  regularProphylaxisVials?: number;
  /** Date of the last regular prophylaxis dose, set during profile creation. Undefined until that flow exists. */
  lastRegularProphylaxisDate?: Date;
  /** How often regular prophylaxis is due, in days, set during profile creation. Undefined until that flow exists. */
  regularProphylaxisIntervalDays?: number;
  /** Called when the user edits the dosage from "Your Current Routine" — wire this to the profile store to keep them in sync. */
  onRegularProphylaxisVialsChange?: (vials: number) => void;
  /** Called when the user edits the effective start date from "Your Current Routine". */
  onLastRegularProphylaxisDateChange?: (date: Date | undefined) => void;
  /** Called when the user edits the frequency (in days) from "Your Current Routine". */
  onRegularProphylaxisIntervalDaysChange?: (days: number) => void;
  /** Minimum factor supply buffer, in vials, set during profile creation. Undefined until that flow exists. */
  minimumFactorSupplyVials?: number;
};

export function Tracker({
  regularProphylaxisVials: initialRoutineVials,
  lastRegularProphylaxisDate: initialRoutineStartDate,
  regularProphylaxisIntervalDays: initialRoutineIntervalDays,
  onRegularProphylaxisVialsChange,
  onLastRegularProphylaxisDateChange,
  onRegularProphylaxisIntervalDaysChange,
  minimumFactorSupplyVials,
}: TrackerProps = {}) {
  const today = getSingaporeToday();
  const [routineVials, setRoutineVialsState] = useState(initialRoutineVials);
  const [routineStartDate, setRoutineStartDateState] = useState(initialRoutineStartDate);
  const [routineIntervalDays, setRoutineIntervalDaysState] = useState(initialRoutineIntervalDays);
  useEffect(() => setRoutineVialsState(initialRoutineVials), [initialRoutineVials]);
  useEffect(() => setRoutineStartDateState(initialRoutineStartDate), [initialRoutineStartDate]);
  useEffect(() => setRoutineIntervalDaysState(initialRoutineIntervalDays), [initialRoutineIntervalDays]);
  function setRoutineVials(next: number) {
    setRoutineVialsState(next);
    onRegularProphylaxisVialsChange?.(next);
  }
  function setRoutineStartDate(next: Date) {
    setRoutineStartDateState(next);
    onLastRegularProphylaxisDateChange?.(next);
  }
  function resetRoutineStartDate() {
    setRoutineStartDateState(undefined);
    onLastRegularProphylaxisDateChange?.(undefined);
  }
  function setRoutineIntervalDays(next: number) {
    setRoutineIntervalDaysState(next);
    onRegularProphylaxisIntervalDaysChange?.(next);
  }
  function startEditingRoutineField(field: "frequency" | "dosage" | "start") {
    if (field === "frequency") setRoutineIntervalDraft(routineIntervalDays ? String(routineIntervalDays) : "");
    if (field === "dosage") setRoutineVialsDraft(routineVials ? String(routineVials) : "");
    if (field === "start") setRoutineDatePickerMonth(routineStartDate ?? today);
    setEditingRoutineField(field);
  }
  function saveRoutineInterval() {
    const value = Number(routineIntervalDraft);
    if (!value) return;
    setRoutineIntervalDays(value);
    setEditingRoutineField(null);
  }
  function saveRoutineVials() {
    const value = Number(routineVialsDraft);
    if (!value) return;
    setRoutineVials(value);
    setEditingRoutineField(null);
  }
  function saveRoutineStartDate(date: Date) {
    setRoutineStartDate(date);
    setEditingRoutineField(null);
  }
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDateState] = useState<Date | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedUseType, setSelectedUseType] = useState<string | null>(null);
  const [missedAnswer, setMissedAnswer] = useState<string | null>(null);
  const [missedTakenDate, setMissedTakenDate] = useState<Date | null>(null);
  const [takenMissedDoseDates, setTakenMissedDoseDates] = useState<Record<string, boolean>>({});
  const [missedDoseTakenKeys, setMissedDoseTakenKeys] = useState<Record<string, string>>({});
  const [missedVialType, setMissedVialType] = useState<string | null>(null);
  const [missedVialCount, setMissedVialCount] = useState("");
  const [refillCount, setRefillCount] = useState("");
  const [useCount, setUseCount] = useState("");
  const [savedEntries, setSavedEntries] = useState<Record<string, SavedEntry[]>>({});
  const [showSupplyHistory, setShowSupplyHistory] = useState(false);
  const [editingRoutineField, setEditingRoutineField] = useState<"frequency" | "dosage" | "start" | null>(null);
  const [routineIntervalDraft, setRoutineIntervalDraft] = useState("");
  const [routineVialsDraft, setRoutineVialsDraft] = useState("");
  const [routineDatePickerMonth, setRoutineDatePickerMonth] = useState(routineStartDate ?? today);

  const setSelectedDate = (date: Date | null) => {
    if (date === null && selectedAction === "use" && (selectedUseType === "on-demand" || selectedUseType === "follow-up")) {
      setSelectedAction(null);
      setSelectedUseType(null);
      setUseCount("");
      return;
    }
    if (date === null && selectedAction === "refill") {
      setSelectedAction(null);
      setRefillCount("");
      return;
    }
    setSelectedDateState(date);
  };

  useEffect(() => {
    if (!selectedDate || selectedAction !== "use" || selectedUseType !== "prophylaxis") return;
    const dateKey = toKey(selectedDate);
    const detail = routineVials
      ? `Regular prophylaxis use — ${routineVials} vial${routineVials === 1 ? "" : "s"}`
      : "Regular prophylaxis use";
    setSavedEntries((entries) => {
      const current = entries[dateKey] ?? [];
      if (current.some((entry) => entry.label === "Factor Use" && entry.detail.startsWith("Regular prophylaxis use"))) return entries;
      // A confirmed dose supersedes any stale "Missed Dose" record for the same day (e.g. auto-detected before the user logged it).
      const withoutConflicts = current.filter((entry) => entry.label !== "Factor Use" && entry.label !== "Missed Dose");
      return { ...entries, [dateKey]: [...withoutConflicts, { id: Date.now(), label: "Factor Use", detail }] };
    });
  }, [selectedDate, selectedAction, selectedUseType, routineVials]);

  useEffect(() => {
    if (!routineStartDate) return;
    const lastDoseKey = toKey(routineStartDate);
    if (routineStartDate.getTime() > today.getTime()) {
      // A future effective start date is just a planned dose — no entry until it actually happens.
      setSavedEntries((entries) => {
        const current = entries[lastDoseKey] ?? [];
        const filtered = current.filter((entry) => !(entry.label === "Factor Use" && entry.detail.startsWith("Regular prophylaxis use")));
        return filtered.length === current.length ? entries : { ...entries, [lastDoseKey]: filtered };
      });
      return;
    }
    const detail = routineVials
      ? `Regular prophylaxis use — ${routineVials} vial${routineVials === 1 ? "" : "s"}`
      : "Regular prophylaxis use";
    setSavedEntries((entries) => {
      const current = entries[lastDoseKey] ?? [];
      const existingIndex = current.findIndex((entry) => entry.label === "Factor Use" && entry.detail.startsWith("Regular prophylaxis use"));
      if (existingIndex >= 0 && current[existingIndex].detail === detail) return entries;
      const updatedEntry = { id: existingIndex >= 0 ? current[existingIndex].id : Date.now(), label: "Factor Use", detail };
      return { ...entries, [lastDoseKey]: existingIndex >= 0 ? current.map((entry, index) => index === existingIndex ? updatedEntry : entry) : [...current, updatedEntry] };
    });
  }, [routineVials, routineStartDate, today]);

  const scheduleAnchorDate = useMemo(() => {
    if (!routineStartDate) return undefined;
    let latest = routineStartDate;
    Object.entries(savedEntries).forEach(([key, entries]) => {
      const hasDose = entries.some((entry) => entry.label === "Factor Use" && (entry.detail.startsWith("Regular prophylaxis use") || entry.detail.startsWith("Missed dose on ")));
      if (!hasDose) return;
      const [year, month, day] = key.split("-").map(Number);
      const entryDate = new Date(year, month - 1, day);
      if (entryDate.getTime() > latest.getTime()) latest = entryDate;
    });
    return latest;
  }, [savedEntries, routineStartDate]);

  useEffect(() => {
    if (selectedAction !== "use") setSelectedUseType(null);
  }, [selectedAction]);

  useEffect(() => {
    if (selectedAction !== "missed") {
      setMissedAnswer(null);
      setMissedTakenDate(null);
      setMissedVialType(null);
      setMissedVialCount("");
    }
  }, [selectedAction]);

  useEffect(() => {
    if (!selectedDate) return;
    const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.trim().startsWith("Factor Use"));
    if (!button) return;
    const resetUseFlow = () => { setSelectedUseType(null); setUseCount(""); };
    button.addEventListener("click", resetUseFlow);
    return () => button.removeEventListener("click", resetUseFlow);
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || selectedAction !== "use" || selectedUseType) return;
    const hasSavedProphylaxis = (savedEntries[toKey(selectedDate)] ?? []).some(
      (entry) => entry.label === "Factor Use" && entry.detail.startsWith("Regular prophylaxis use"),
    );
    const hasSavedOnDemand = (savedEntries[toKey(selectedDate)] ?? []).some(
      (entry) => entry.label === "Factor Use" && entry.detail.startsWith("On-demand use"),
    );
    const hasSavedFollowUp = (savedEntries[toKey(selectedDate)] ?? []).some(
      (entry) => entry.label === "Factor Use" && entry.detail.startsWith("Follow-up use after a bleed"),
    );
    const prophylaxisButton = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.trim().startsWith("Regular prophylaxis use"));
    const onDemandButton = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.trim().startsWith("On-demand use"));
    const followUpButton = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.trim().startsWith("Follow-up use after a bleed"));
    if (prophylaxisButton) prophylaxisButton.setAttribute("aria-pressed", String(hasSavedProphylaxis));
    if (onDemandButton) onDemandButton.setAttribute("aria-pressed", String(hasSavedOnDemand));
    if (followUpButton) followUpButton.setAttribute("aria-pressed", String(hasSavedFollowUp));
  }, [selectedDate, selectedAction, selectedUseType, savedEntries]);

  useEffect(() => {
    if (!selectedDate || selectedAction !== "use" || (selectedUseType !== "on-demand" && selectedUseType !== "follow-up")) return;
    const label = selectedUseType === "on-demand" ? "On-demand use" : "Follow-up use after a bleed";
    const savedUse = (savedEntries[toKey(selectedDate)] ?? []).find(
      (entry) => entry.label === "Factor Use" && entry.detail.startsWith(label),
    );
    setUseCount(savedUse?.detail.match(/\d+/)?.[0] ?? "");
  }, [selectedDate, selectedAction, selectedUseType, savedEntries]);

  useEffect(() => {
    if (!selectedDate || selectedAction !== "refill") return;
    const hasRefill = (savedEntries[toKey(selectedDate)] ?? []).some((entry) => entry.label === "Factor Refill");
    if (!hasRefill) setRefillCount("");
  }, [savedEntries, selectedDate, selectedAction]);

  useEffect(() => {
    if (!selectedDate || selectedAction !== "refill") return;
    const savedRefill = (savedEntries[toKey(selectedDate)] ?? []).find((entry) => entry.label === "Factor Refill");
    if (savedRefill) setRefillCount(savedRefill.detail.match(/\d+/)?.[0] ?? "");
  }, [selectedDate, selectedAction, savedEntries]);

  useEffect(() => {
    if (!selectedDate || selectedAction !== "missed") return;
    const dateKey = toKey(selectedDate);
    setSavedEntries((entries) => {
      const current = entries[dateKey] ?? [];
      if (current.some((entry) => entry.label === "Missed Dose")) return entries;
      return { ...entries, [dateKey]: [...current, { id: Date.now(), label: "Missed Dose", detail: "Awaiting response" }] };
    });
  }, [selectedDate, selectedAction]);

  useEffect(() => {
    if (!selectedDate || selectedAction !== "missed" || missedAnswer !== "taken") return;
    updateMissedDoseDetail(toKey(selectedDate), "Taken");
  }, [selectedDate, selectedAction, missedAnswer]);

  useEffect(() => {
    if (!selectedDate || !missedTakenDate) return;
    const dateKey = toKey(selectedDate);
    const takenKey = toKey(missedTakenDate);
    const previousKey = missedDoseTakenKeys[dateKey];
    if (previousKey === takenKey) return;
    const missedDateLabel = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const detail = `Taken on ${missedTakenDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    setSavedEntries((entries) => {
      const current = entries[dateKey] ?? [];
      const existingIndex = current.findIndex((entry) => entry.label === "Missed Dose");
      const updatedEntry = { id: existingIndex >= 0 ? current[existingIndex].id : Date.now(), label: "Missed Dose", detail };
      return { ...entries, [dateKey]: existingIndex >= 0 ? current.map((entry, index) => index === existingIndex ? updatedEntry : entry) : [...current, updatedEntry] };
    });
    setTakenMissedDoseDates((dates) => {
      const next = { ...dates };
      if (previousKey) delete next[previousKey];
      next[takenKey] = true;
      return next;
    });
    setMissedDoseTakenKeys((keys) => ({ ...keys, [dateKey]: takenKey }));
    if (previousKey) {
      setSavedEntries((entries) => {
        const previousEntries = entries[previousKey] ?? [];
        const filtered = previousEntries.filter((entry) => !(entry.label === "Factor Use" && entry.detail.startsWith(`Missed dose on ${missedDateLabel}`)));
        return filtered.length === previousEntries.length ? entries : { ...entries, [previousKey]: filtered };
      });
    }
    addMissedDoseFactorUseEntry(takenKey, missedDateLabel, "Awaiting response");
  }, [selectedDate, missedTakenDate, missedDoseTakenKeys]);

  useEffect(() => {
    if (!selectedDate || selectedAction !== "missed" || !missedVialType) return;
    const saved = (savedEntries[toKey(selectedDate)] ?? []).find((entry) => entry.label === "Missed Dose");
    setMissedVialCount(saved?.detail.match(/(\d+) vial/)?.[1] ?? "");
  }, [selectedDate, selectedAction, missedVialType, savedEntries]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstDay.getDay());
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const end = new Date(year, month, lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));
    const totalDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [viewDate]);

  const routineDatePickerDays = useMemo(() => {
    const year = routineDatePickerMonth.getFullYear();
    const month = routineDatePickerMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstDay.getDay());
    return Array.from({ length: 35 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [routineDatePickerMonth]);

  const missedDoseWeek = useMemo(() => selectedDate ? Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + index);
    return date;
  }) : [], [selectedDate]);

  const missedDoseWeekMonthLabel = useMemo(() => {
    if (missedDoseWeek.length === 0) return "";
    const startMonth = missedDoseWeek[0].toLocaleDateString("en-US", { month: "long" });
    const endDate = missedDoseWeek[missedDoseWeek.length - 1];
    const endMonth = endDate.toLocaleDateString("en-US", { month: "long" });
    const year = endDate.getFullYear();
    return startMonth === endMonth ? `${startMonth} ${year}` : `${startMonth} – ${endMonth} ${year}`;
  }, [missedDoseWeek]);

  const factorSupply = useMemo(() => {
    const total = Object.values(savedEntries).reduce((sum, entries) => {
      return sum + entries.reduce((entrySum, entry) => {
        const amount = Number(entry.detail.match(/(\d+)\s*vials?/)?.[1] ?? 0);
        if (entry.label === "Factor Refill") return entrySum + amount;
        if (entry.label === "Factor Use") return entrySum - amount;
        return entrySum;
      }, 0);
    }, 0);
    return Math.max(0, total);
  }, [savedEntries]);

  const isFactorSupplyLow = minimumFactorSupplyVials !== undefined && factorSupply <= minimumFactorSupplyVials;
  const nextOrderDate = useMemo(() => {
    const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const date = new Date(nextMonthFirst);
    date.setDate(date.getDate() - 7);
    return date;
  }, [today]);
  const isNextOrderDateSoon = useMemo(() => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((nextOrderDate.getTime() - today.getTime()) / msPerDay);
    return diffDays >= 0 && diffDays <= 3;
  }, [nextOrderDate, today]);
  const isOrderNeededAsap = isFactorSupplyLow && today.getTime() < nextOrderDate.getTime();
  const plannedDosesNextMonth = useMemo(() => {
    if (!scheduleAnchorDate || !routineIntervalDays) return 0;
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    let count = 0;
    for (let d = new Date(nextMonthStart); d <= nextMonthEnd; d.setDate(d.getDate() + 1)) {
      if (isScheduledProphylaxisDate(d, scheduleAnchorDate, routineIntervalDays)) count++;
    }
    return count;
  }, [scheduleAnchorDate, routineIntervalDays, today]);
  const recommendedOrderVials = useMemo(() => {
    if (!routineVials || !routineIntervalDays || !scheduleAnchorDate || minimumFactorSupplyVials === undefined) return undefined;
    return Math.max(0, plannedDosesNextMonth * routineVials + minimumFactorSupplyVials - factorSupply);
  }, [plannedDosesNextMonth, routineVials, routineIntervalDays, scheduleAnchorDate, minimumFactorSupplyVials, factorSupply]);

  const supplyHistory = useMemo(() => {
    const rows: { id: number; dateKey: string; label: string; detail: string; amount: number }[] = [];
    Object.entries(savedEntries).forEach(([dateKey, entries]) => {
      entries.forEach((entry) => {
        const amount = Number(entry.detail.match(/(\d+)\s*vials?/)?.[1] ?? 0);
        if (!amount) return;
        if (entry.label === "Factor Refill") rows.push({ id: entry.id, dateKey, label: entry.label, detail: entry.detail, amount });
        else if (entry.label === "Factor Use") rows.push({ id: entry.id, dateKey, label: entry.label, detail: entry.detail, amount: -amount });
      });
    });
    rows.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : b.id - a.id));
    return rows.slice(0, 5);
  }, [savedEntries]);

  const monthTitle = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedDayLabel = selectedDate?.toLocaleDateString("en-US", { weekday: "long" }) ?? "Selected date";
  const selectedDateLabel = selectedDate?.toLocaleDateString("en-US", { month: "long", day: "numeric" }) ?? "";
  const isFutureDate = Boolean(selectedDate && selectedDate.getTime() > today.getTime());

  function changeMonth(amount: number) {
    setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1));
  }

  function saveRefill() {
    if (!selectedDate || !refillCount) return;
    const dateKey = toKey(selectedDate);
    setSavedEntries((entries) => {
      const current = entries[dateKey] ?? [];
      const withoutPrevious = current.filter((entry) => entry.label !== "Factor Refill");
      return { ...entries, [dateKey]: [...withoutPrevious, { id: Date.now(), label: "Factor Refill", detail: `${refillCount} vial${refillCount === "1" ? "" : "s"} added` }] };
    });
  }

  function saveFactorUse() {
    if (!selectedDate || (selectedUseType !== "on-demand" && selectedUseType !== "follow-up") || !useCount) return;
    const dateKey = toKey(selectedDate);
    const detail = `${selectedUseType === "on-demand" ? "On-demand use" : "Follow-up use after a bleed"} — ${useCount} vial${useCount === "1" ? "" : "s"}`;
    setSavedEntries((entries) => ({
      ...entries,
      [dateKey]: [...(entries[dateKey] ?? []).filter((entry) => entry.label !== "Factor Use"), { id: Date.now(), label: "Factor Use", detail }],
    }));
  }

  function saveOnDemandUse() {
    saveFactorUse();
  }

  function updateMissedDoseDetail(dateKey: string, detail: string) {
    setSavedEntries((entries) => {
      const current = entries[dateKey] ?? [];
      const existingIndex = current.findIndex((entry) => entry.label === "Missed Dose");
      const updatedEntry = { id: existingIndex >= 0 ? current[existingIndex].id : Date.now(), label: "Missed Dose", detail };
      return { ...entries, [dateKey]: existingIndex >= 0 ? current.map((entry, index) => index === existingIndex ? updatedEntry : entry) : [...current, updatedEntry] };
    });
  }

  function addMissedDoseFactorUseEntry(takenDateKey: string, missedDateLabel: string, amountLabel: string) {
    const detail = `Missed dose on ${missedDateLabel} - ${amountLabel}`;
    setSavedEntries((entries) => {
      const current = entries[takenDateKey] ?? [];
      const existingIndex = current.findIndex((entry) => entry.label === "Factor Use" && entry.detail.startsWith(`Missed dose on ${missedDateLabel}`));
      const updatedEntry = { id: existingIndex >= 0 ? current[existingIndex].id : Date.now(), label: "Factor Use", detail };
      return { ...entries, [takenDateKey]: existingIndex >= 0 ? current.map((entry, index) => index === existingIndex ? updatedEntry : entry) : [...current, updatedEntry] };
    });
  }

  function saveMissedDoseProphylaxis() {
    if (!selectedDate || !missedTakenDate) return;
    const missedDateLabel = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const takenLabel = `Taken on ${missedTakenDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const amountLabel = routineVials
      ? `${routineVials} vial${routineVials === 1 ? "" : "s"} (Regular prophylaxis amount)`
      : "Regular prophylaxis amount";
    updateMissedDoseDetail(toKey(selectedDate), `${takenLabel} — ${amountLabel}`);
    addMissedDoseFactorUseEntry(toKey(missedTakenDate), missedDateLabel, amountLabel);
  }

  function saveMissedDoseVials() {
    if (!selectedDate || !missedTakenDate || !missedVialCount || Number(missedVialCount) === 0) return;
    const missedDateLabel = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const takenLabel = `Taken on ${missedTakenDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const vialLabel = `${missedVialCount} vial${missedVialCount === "1" ? "" : "s"}`;
    updateMissedDoseDetail(toKey(selectedDate), `${takenLabel} — ${vialLabel}`);
    addMissedDoseFactorUseEntry(toKey(missedTakenDate), missedDateLabel, vialLabel);
  }

  function unlinkMissedDoseTaken(missedDateKey: string) {
    const takenKey = missedDoseTakenKeys[missedDateKey];
    if (!takenKey) return;
    const [year, month, day] = missedDateKey.split("-").map(Number);
    const missedDateLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setSavedEntries((entries) => ({
      ...entries,
      [takenKey]: (entries[takenKey] ?? []).filter((item) => !(item.label === "Factor Use" && item.detail.startsWith(`Missed dose on ${missedDateLabel}`))),
    }));
    setTakenMissedDoseDates((dates) => {
      const next = { ...dates };
      delete next[takenKey];
      return next;
    });
    setMissedDoseTakenKeys((keys) => {
      const next = { ...keys };
      delete next[missedDateKey];
      return next;
    });
  }

  function startMissedDoseTaken() {
    if (!missedTakenDate && selectedDate) unlinkMissedDoseTaken(toKey(selectedDate));
    setMissedAnswer("taken");
  }

  function saveMissedDoseSkipped() {
    if (!selectedDate) return;
    unlinkMissedDoseTaken(toKey(selectedDate));
    updateMissedDoseDetail(toKey(selectedDate), "Skipped");
  }

  function closeAllPopups() {
    setSelectedDateState(null);
    setSelectedAction(null);
    setSelectedUseType(null);
    setUseCount("");
    setRefillCount("");
    setMissedAnswer(null);
    setMissedTakenDate(null);
    setMissedVialType(null);
    setMissedVialCount("");
  }

  useEffect(() => {
    if (selectedAction !== "refill") return;
    const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent === "Add vials");
    if (!button) return;
    const commit = () => saveRefill();
    button.addEventListener("click", commit);
    return () => button.removeEventListener("click", commit);
  }, [selectedAction, selectedDate, refillCount]);

  useEffect(() => {
    const label = selectedAction === "refill" ? "Add vials" : selectedAction === "use" && (selectedUseType === "on-demand" || selectedUseType === "follow-up") ? "Track" : null;
    if (!label) return;
    const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.trim() === label) as HTMLButtonElement | undefined;
    if (button) button.disabled = !(Number(selectedAction === "refill" ? refillCount : useCount) > 0);
  }, [selectedAction, selectedUseType, refillCount, useCount]);

  function editEntry(dateKey: string, entry: SavedEntry) {
    if (entry.label === "Factor Refill") {
      setRefillCount(entry.detail.match(/\d+/)?.[0] ?? "");
      setSelectedAction("refill");
      return;
    }
    if (entry.label === "Factor Use") {
      const isOnDemand = entry.detail.startsWith("On-demand use");
      const isFollowUp = entry.detail.startsWith("Follow-up use after a bleed");
      setSelectedUseType(isOnDemand ? "on-demand" : isFollowUp ? "follow-up" : null);
      setUseCount(isOnDemand || isFollowUp ? (entry.detail.match(/\d+/)?.[0] ?? "") : "");
      setSelectedAction("use");
      return;
    }
    if (entry.label === "Missed Dose") {
      setMissedAnswer(null);
      setMissedTakenDate(null);
      setMissedVialType(null);
      setMissedVialCount("");
      setSelectedAction("missed");
      return;
    }
    const nextLabel = window.prompt("Edit entry", entry.label);
    if (nextLabel?.trim()) setSavedEntries((entries) => ({ ...entries, [dateKey]: (entries[dateKey] ?? []).map((item) => item.id === entry.id ? { ...item, label: nextLabel.trim() } : item) }));
  }

  function removeMissedDoseLink(missedDateKey: string, takenDateKey: string) {
    const [year, month, day] = missedDateKey.split("-").map(Number);
    const missedDateLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setSavedEntries((entries) => {
      const next = { ...entries };
      next[missedDateKey] = (next[missedDateKey] ?? []).filter((item) => item.label !== "Missed Dose");
      next[takenDateKey] = (next[takenDateKey] ?? []).filter((item) => !(item.label === "Factor Use" && item.detail.startsWith(`Missed dose on ${missedDateLabel}`)));
      return next;
    });
    setTakenMissedDoseDates((dates) => {
      const next = { ...dates };
      delete next[takenDateKey];
      return next;
    });
    setMissedDoseTakenKeys((keys) => {
      const next = { ...keys };
      delete next[missedDateKey];
      return next;
    });
  }

  function deleteEntry(dateKey: string, entry: SavedEntry) {
    setSavedEntries((entries) => ({ ...entries, [dateKey]: (entries[dateKey] ?? []).filter((item) => item.id !== entry.id) }));
    if (entry.label === "Missed Dose") {
      const takenKey = missedDoseTakenKeys[dateKey];
      if (takenKey) removeMissedDoseLink(dateKey, takenKey);
      return;
    }
    if (entry.label === "Factor Use" && entry.detail.startsWith("Missed dose on ")) {
      const missedDateLabel = entry.detail.match(/^Missed dose on (.+) - /)?.[1];
      const missedDateKey = missedDateLabel && Object.keys(missedDoseTakenKeys).find((key) => {
        if (missedDoseTakenKeys[key] !== dateKey) return false;
        const [year, month, day] = key.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" }) === missedDateLabel;
      });
      if (missedDateKey) removeMissedDoseLink(missedDateKey, dateKey);
    }
    if (entry.label === "Factor Use" && entry.detail.startsWith("Regular prophylaxis use") && routineStartDate && dateKey === toKey(routineStartDate)) {
      resetRoutineStartDate();
    }
  }

  return (
    <div data-theme="warm" className="min-h-screen overflow-x-hidden bg-[#f8f0e2] px-3 py-4 pb-24 text-slate-900 sm:px-8 sm:py-10 sm:pb-24">
      <main className="mx-auto max-w-5xl">
        <header className="mb-4 ml-3 mt-2 sm:mb-6 sm:ml-7 sm:mt-3">
          <div><h1 className="text-[26px] font-bold tracking-tight text-[#3b281c] sm:text-[38px]">Tracker</h1><p className="mt-1 text-[14px] leading-[1.5] text-[#806d51] sm:mt-2 sm:text-[18px]">Log doses and bleeds as they happen.<br />Tap on a date to start tracking.</p></div>
        </header>
        <div>
          <section className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:rounded-3xl sm:p-7">
            <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.10]" aria-hidden="true">
              <Platelet state="covered" className="absolute -right-14 -top-16 h-60 w-60 rotate-12 sm:h-80 sm:w-80" />
              <Platelet state="covered" className="absolute -bottom-16 -left-16 h-52 w-52 -rotate-6 sm:h-72 sm:w-72" />
            </div>
            <div className="relative z-10">
            <div className="mb-5 flex items-center justify-between"><h1 className="ml-2 text-xl font-bold tracking-tight text-[#6b3817] sm:text-2xl">{monthTitle}</h1><div className="flex items-center gap-1"><button onClick={() => changeMonth(-1)} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={() => { setViewDate(today); setSelectedDate(today); }} className="rounded-lg px-3 py-2 text-xs font-bold text-[#6c5ce7] transition hover:bg-violet-50">Today</button><button onClick={() => changeMonth(1)} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"><Icon name="chevronRight" className="h-5 w-5" /></button></div></div>
            <div className="grid grid-cols-7 border-b border-slate-100 pb-3">{DAYS.map((day) => <div key={day} className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{day}</div>)}</div>
            <div className="grid grid-cols-7 pt-2">{calendarDays.map((date, index) => {
              const key = toKey(date); const currentMonth = date.getMonth() === viewDate.getMonth(); const isToday = key === toKey(today); const isSelected = selectedDate ? key === toKey(selectedDate) : false; const hasFactorUse = (savedEntries[key] ?? []).some((entry) => entry.label === "Factor Use") || Boolean(takenMissedDoseDates[key]); const hasMissedDose = (savedEntries[key] ?? []).some((entry) => entry.label === "Missed Dose"); const hasOnDemandUse = (savedEntries[key] ?? []).some((entry) => entry.label === "Factor Use" && entry.detail.startsWith("On-demand use")); const isLastRow = index >= calendarDays.length - 7; const isFutureRoutineStart = Boolean(routineStartDate && key === toKey(routineStartDate) && routineStartDate.getTime() > today.getTime()); const isPlannedProphylaxis = !hasFactorUse && !hasMissedDose && (isScheduledProphylaxisDate(date, scheduleAnchorDate, routineIntervalDays) || isFutureRoutineStart);
              return <button key={key} onClick={() => { setSelectedDate(date); setSelectedAction(null); }} aria-pressed={isSelected} className={`group relative flex ${isLastRow ? "aspect-[.95] sm:aspect-[1.05]" : "aspect-[.75] sm:aspect-[.85]"} flex-col items-center rounded-xl pt-2 transition focus:z-10 focus:outline-none focus:ring-2 focus:ring-violet-300 sm:pt-3 ${isSelected ? "bg-[#6c5ce7] text-white shadow-md shadow-violet-200" : "hover:bg-violet-50"}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${!currentMonth ? "text-slate-300" : isSelected ? "text-white" : isToday ? "bg-violet-100 text-[#6c5ce7]" : "text-slate-700"}`}>{date.getDate()}</span>{(hasFactorUse || hasMissedDose || hasOnDemandUse || isPlannedProphylaxis) && <span className="mt-0.5 flex items-center gap-1">{hasFactorUse && <i className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-white" : "bg-[#8df5c0]"}`} />}{isPlannedProphylaxis && <i className={`h-2.5 w-2.5 rounded-full border-2 bg-transparent ${isSelected ? "border-white" : "border-[#8df5c0]"}`} aria-label="Planned prophylaxis dose" />}{hasMissedDose && <i className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-white" : "bg-[#ffcc4d]"}`} />}{hasOnDemandUse && <svg className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-[#cd5952]"}`} viewBox="0 0 24 24" fill="currentColor" aria-label="Bleed indicator"><path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z" /></svg>}</span>}</button>;
            })}</div>
            <div className="mt-4 flex flex-col items-center border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Legend</p><div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#8df5c0] bg-transparent" />Planned Prophylaxis</span><span className="flex items-center gap-1.5"><i className="ml-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#8df5c0]" />Factor Use</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ffcc4d]" />Missed Dose</span><span className="flex items-center gap-1.5"><svg className="h-3.5 w-3.5 shrink-0 text-[#cd5952]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z" /></svg>Bleed Event</span></div></div>
            </div>
          </section>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:mt-6 sm:rounded-3xl sm:p-7"><button onClick={() => setShowSupplyHistory(true)} className="w-full text-left transition hover:opacity-80"><div className="flex items-center justify-between"><div className="ml-1 sm:ml-2"><h2 className="text-xl font-bold tracking-tight text-[#6b3817] sm:text-2xl">Factor Supply</h2><p className="mt-2 text-sm text-[#806d51]">Vials remaining in your supply</p><p className="mt-2 flex items-center gap-1 text-sm text-[#806d51]"><Icon name="search" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />Tap to view your recent activity</p></div><span className="relative mr-1 sm:mr-2">{isFactorSupplyLow && <svg viewBox="0 0 260 200" className="absolute -left-10 -top-9 h-11 w-14 shrink-0 sm:-top-10 sm:h-14 sm:w-[4.5rem]" role="img" aria-label="Alarmed platelet character"><g fill="#FF7B93" stroke="#FF7B93" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"><path d="M 100 100 L 100 35" fill="none" /><path d="M 100 100 L 45 55" fill="none" /><path d="M 100 100 L 155 55" fill="none" /><path d="M 100 100 L 35 110" fill="none" /><path d="M 100 100 L 165 110" fill="none" /><path d="M 100 100 L 70 155" fill="none" /><path d="M 100 100 L 130 155" fill="none" /><circle cx="100" cy="100" r="45" /></g><path d="M 72 82 Q 80 72 90 80" stroke="#2D3748" strokeWidth="3.5" fill="none" strokeLinecap="round" /><path d="M 110 80 Q 120 72 128 82" stroke="#2D3748" strokeWidth="3.5" fill="none" strokeLinecap="round" /><circle cx="82" cy="95" r="7" fill="#2D3748" /><circle cx="118" cy="95" r="7" fill="#2D3748" /><ellipse cx="100" cy="120" rx="8" ry="10" fill="#2D3748" /><text x="195" y="128" fontSize="88" fontWeight="700" fill="#cd5952" transform="rotate(15 195 90)">!</text></svg>}<span className={`text-3xl font-bold sm:text-4xl ${isFactorSupplyLow ? "text-[#cd5952]" : "text-[#3b281c]"}`}>{factorSupply}</span></span></div></button><div className="mt-4 border-t border-slate-100 pt-4"><h3 className="text-center text-base font-bold text-[#6b3817] sm:text-lg">Recommended order</h3><div className="ml-1 mt-3 space-y-2 sm:ml-2"><div className="flex items-center justify-between rounded-xl bg-[#f8f0e2] px-3 py-2.5"><span className="text-sm text-[#806d51]">Next order date</span><span className={`text-sm font-bold ${isOrderNeededAsap || isNextOrderDateSoon ? "text-[#cd5952]" : "text-[#443229]"}`}>{isOrderNeededAsap ? "ASAP" : nextOrderDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div><div className="flex items-center justify-between rounded-xl bg-[#f8f0e2] px-3 py-2.5"><span className="text-sm text-[#806d51]">Number of vials</span><span className="text-sm font-bold text-[#443229]">{recommendedOrderVials !== undefined ? recommendedOrderVials : ""}</span></div></div></div></div>
          <section className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:mt-6 sm:rounded-3xl sm:p-7"><h2 className="ml-1 text-xl font-bold tracking-tight text-[#6b3817] sm:ml-2 sm:text-2xl">Your Current Routine</h2><p className="ml-1 mt-1 text-sm text-[#a8977c] sm:ml-2">Tap any value to edit</p><div className="mt-4 grid grid-cols-3 gap-2"><button onClick={() => startEditingRoutineField("frequency")} className="flex flex-col items-center gap-1.5 rounded-xl bg-[#f8f0e2] px-2 py-3 text-center transition hover:bg-[#f4ead8]"><Icon name="repeat" className="h-5 w-5 text-[#80633e]" /><span className="flex min-h-8 items-center text-xs text-[#806d51]">Frequency</span><span className="whitespace-nowrap text-sm font-bold text-[#443229]">{routineIntervalDays ? `Every ${routineIntervalDays} day${routineIntervalDays === 1 ? "" : "s"}` : "Not set"}</span></button><button onClick={() => startEditingRoutineField("dosage")} className="flex flex-col items-center gap-1.5 rounded-xl bg-[#f8f0e2] px-2 py-3 text-center transition hover:bg-[#f4ead8]"><Icon name="vial" className="h-5 w-5 text-[#80633e]" /><span className="flex min-h-8 items-center text-xs text-[#806d51]">Dosage</span><span className="text-sm font-bold text-[#443229]">{routineVials ? `${routineVials} vial${routineVials === 1 ? "" : "s"}` : "Not set"}</span></button><button onClick={() => startEditingRoutineField("start")} className="flex flex-col items-center gap-1.5 rounded-xl bg-[#f8f0e2] px-2 py-3 text-center transition hover:bg-[#f4ead8]"><Icon name="play" className="h-5 w-5 text-[#80633e]" /><span className="flex min-h-8 items-center text-xs leading-tight text-[#806d51]">Effective<br />start date</span><span className="whitespace-nowrap text-sm font-bold text-[#443229]">{routineStartDate ? `${routineStartDate.toLocaleDateString("en-US", { month: "short" })} ${routineStartDate.getDate()}, ${routineStartDate.getFullYear()}` : "Not set"}</span></button></div></section>
        </div>
      </main>
      {selectedDate && <div onClick={closeAllPopups} className="fixed inset-0 z-30 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><div><p className="text-sm font-medium text-[#806d51]">{selectedDayLabel}</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">{selectedDateLabel}</h2></div>{isFutureDate && <svg viewBox="0 0 200 200" className="h-14 w-14 shrink-0" role="img" aria-label="Confused platelet character"><g fill="#FF7B93" stroke="#FF7B93" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"><path d="M 100 100 L 100 35" fill="none" /><path d="M 100 100 L 45 55" fill="none" /><path d="M 100 100 L 155 55" fill="none" /><path d="M 100 100 L 35 110" fill="none" /><path d="M 100 100 L 165 110" fill="none" /><path d="M 100 100 L 70 155" fill="none" /><path d="M 100 100 L 130 155" fill="none" /><circle cx="100" cy="100" r="45" /></g><path d="M 76 88 Q 82 78 90 84" stroke="#2D3748" strokeWidth="3.5" fill="none" strokeLinecap="round" /><path d="M 108 84 Q 116 76 124 86" stroke="#2D3748" strokeWidth="3.5" fill="none" strokeLinecap="round" /><circle cx="83" cy="97" r="5" fill="#2D3748" /><circle cx="117" cy="99" r="4" fill="#2D3748" /><path d="M 88 118 Q 96 112 104 118 Q 112 124 120 116" stroke="#2D3748" strokeWidth="3.5" fill="none" strokeLinecap="round" /><text x="128" y="60" fontSize="34" fontWeight="700" fill="#80633e">?</text></svg>}</div><button onClick={() => setSelectedDate(null)} aria-label="Close date details" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div>{isFutureDate ?<p className="mt-6 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-sm leading-loose text-[#806d51]">Oops! This date hasn't happened yet, so it can't be logged. If a dose is planned for this day, you'll see it marked on your calendar.</p> : <div className="mt-6 space-y-3"><button onClick={() => setSelectedAction("refill")} aria-pressed={selectedAction === "refill"} className="flex w-full items-center gap-3 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#a98559]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d8c3a0]/35 text-[#80633e]"><Icon name="plus" className="h-6 w-6" /></span><span className="flex-1"><span className="block text-sm font-bold text-[#443229]">Factor Refill</span><span className="mt-1 block text-xs text-[#806d51]">Add new vials to your supply</span></span></button><button onClick={() => setSelectedAction("use")} aria-pressed={selectedAction === "use"} className="flex w-full items-center gap-3 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8df5c0]/25 text-[#3b281c]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 19 4-4M8 20l-4-4M10 14l-3-3 5-5 3 3-5 5ZM14 6l2-2 4 4-2 2M15 15h5v5h-5z" /></svg></span><span className="flex-1"><span className="block text-sm font-bold text-[#443229]">Factor Use</span><span className="mt-1 block text-xs text-[#806d51]">Record an injection</span></span><i className="h-2.5 w-2.5 rounded-full bg-[#8df5c0]" /></button><button onClick={() => setSelectedAction("missed")} aria-pressed={selectedAction === "missed"} className="flex w-full items-center gap-3 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#cd5952]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffcc4d]/35 text-[#b8860b]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 17h.01" /></svg></span><span className="flex-1"><span className="block text-sm font-bold text-[#443229]">Missed Dose</span><span className="mt-1 block text-xs text-[#806d51]">Mark a dose that was missed</span></span><i className="h-2.5 w-2.5 rounded-full bg-[#ffcc4d]" /></button></div>}</aside></div>}
      {selectedDate && <section className="fixed bottom-24 left-3 right-3 z-[60] mx-auto max-w-md rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-4 shadow-xl sm:bottom-6 sm:left-auto sm:right-6"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#3b281c]">Saved entries</h3><span className="text-xs text-[#806d51]">{(savedEntries[toKey(selectedDate)] ?? []).length}</span></div>{(savedEntries[toKey(selectedDate)] ?? []).length ? <div className="mt-3 space-y-2">{savedEntries[toKey(selectedDate)].map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-xl bg-[#f8f0e2] px-3 py-2"><div><p className="text-xs font-bold text-[#443229]">{entry.label}</p><p className="text-sm text-[#806d51]">{entry.detail}</p></div><div className="flex gap-1">{!(entry.label === "Factor Use" && entry.detail.startsWith("Missed dose on ")) && <button onClick={() => editEntry(toKey(selectedDate), entry)} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#80633e] hover:bg-[#f4ead8]">Edit</button>}<button onClick={() => deleteEntry(toKey(selectedDate), entry)} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#cd5952] hover:bg-[#f4ead8]">Delete</button></div></div>)}</div> : <p className="mt-2 text-xs text-[#806d51]">No saved entries for this date yet.</p>}</section>}
      {selectedDate && selectedAction === "use" && !selectedUseType && <div onClick={closeAllPopups} className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Factor Use</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">What kind of use?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setSelectedAction(null); setSelectedUseType(null); }} aria-label="Back to date actions" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><div className="mt-6 space-y-3"><button onClick={() => setSelectedUseType("prophylaxis")} aria-pressed={selectedUseType === "prophylaxis"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="block text-sm font-bold text-[#443229]">Regular prophylaxis use</span><span className="mt-1 block text-xs text-[#806d51]">Your planned preventative dose</span></button><button onClick={() => setSelectedUseType("on-demand")} aria-pressed={selectedUseType === "on-demand"} className="relative w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 pr-12 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="block text-sm font-bold text-[#443229]">On-demand use</span><span className="mt-1 block text-xs text-[#806d51]">Treatment taken when a bleed starts</span><svg className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#cd5952]" viewBox="0 0 24 24" fill="currentColor" aria-label="Bleed indicator"><path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z" /></svg></button><button onClick={() => setSelectedUseType("follow-up")} aria-pressed={selectedUseType === "follow-up"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="block text-sm font-bold text-[#443229]">Follow-up use after a bleed</span><span className="mt-1 block text-xs text-[#806d51]">An additional dose after a serious bleed</span></button></div></aside></div>}
      {selectedDate && selectedAction === "missed" && <div onClick={closeAllPopups} className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">Was the missed dose taken or skipped?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setSelectedAction(null); setMissedAnswer(null); }} aria-label="Back to date actions" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><div className="mt-6 space-y-3"><button onClick={startMissedDoseTaken} aria-pressed={missedAnswer === "taken"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#cd5952]">Taken</button><button onClick={() => { saveMissedDoseSkipped(); setSelectedAction(null); }} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">Skipped</button></div></aside></div>}
      {selectedDate && selectedAction === "missed" && missedAnswer === "taken" && !missedTakenDate && <div onClick={closeAllPopups} className="fixed inset-0 z-50 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-60 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-64"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">When did you take the missed dose?</h2></div><div className="flex items-center gap-1"><button onClick={() => setMissedAnswer(null)} aria-label="Back to missed-dose options" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-3 text-sm font-bold text-[#443229]">{missedDoseWeekMonthLabel}</p><div className="mt-5 grid grid-cols-7 gap-1.5">{missedDoseWeek.map((date) => <button key={toKey(date)} onClick={() => setMissedTakenDate(date)} className="flex h-16 flex-col items-center justify-center rounded-xl border border-[#eee5d5] bg-[#f8f0e2] text-[#443229] transition hover:bg-[#f4ead8]"><span className="text-[10px] font-bold uppercase text-[#806d51]">{date.toLocaleDateString("en-US", { weekday: "narrow" })}</span><span className="mt-1 text-sm font-bold">{date.getDate()}</span></button>)}</div></aside></div>}
      {selectedDate && selectedAction === "missed" && missedAnswer === "taken" && missedTakenDate && !missedVialType && <div onClick={closeAllPopups} className="fixed inset-0 z-50 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-60 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-64"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials used?</h2></div><div className="flex items-center gap-1"><button onClick={() => setMissedTakenDate(null)} aria-label="Back to missed-dose date" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><div className="mt-6 space-y-3"><button onClick={() => { saveMissedDoseProphylaxis(); setSelectedAction(null); }} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8]"><span className="block text-sm font-bold text-[#443229]">Regular prophylaxis amount</span><span className="mt-1 block text-xs text-[#806d51]">Your usual planned dose</span></button><button onClick={() => setMissedVialType("custom")} aria-pressed={missedVialType === "custom"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#cd5952]"><span className="block text-sm font-bold text-[#443229]">Custom</span><span className="mt-1 block text-xs text-[#806d51]">Enter a specific number of vials</span></button></div></aside></div>}
      {selectedDate && selectedAction === "missed" && missedAnswer === "taken" && missedTakenDate && missedVialType && <div onClick={closeAllPopups} className="fixed inset-0 z-50 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-44 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-48"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials used?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setMissedVialType(null); setMissedVialCount(""); }} aria-label="Back to vial type" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-2 text-xs text-[#806d51]">Enter the number of vials used.</p><div className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-2xl font-bold tracking-wide text-[#3b281c]">{missedVialCount || "0"}</div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setMissedVialCount((count) => `${count}${number}`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setMissedVialCount("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setMissedVialCount((count) => `${count}0`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setMissedVialCount((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!missedVialCount || Number(missedVialCount) === 0} onClick={() => { saveMissedDoseVials(); setSelectedAction(null); }} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Track</button></aside></div>}
      {selectedDate && selectedAction === "refill" && <div onClick={closeAllPopups} className="fixed inset-0 z-40 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-16 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-20"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Factor Refill</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setSelectedAction(null); setRefillCount(""); }} aria-label="Back to date actions" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-2 text-xs text-[#806d51]">Enter the number of vials to add to your supply.</p><div className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-2xl font-bold tracking-wide text-[#3b281c]">{refillCount || "0"}</div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setRefillCount((count) => `${count}${number}`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setRefillCount("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setRefillCount((count) => `${count}0`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setRefillCount((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!refillCount} onClick={() => { setSelectedDate(null); setSelectedAction(null); setRefillCount(""); }} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Add vials</button></aside></div>}
      {selectedDate && selectedAction === "use" && (selectedUseType === "on-demand" || selectedUseType === "follow-up") && <div onClick={closeAllPopups} className="fixed inset-0 z-40 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-16 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-20"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">{selectedUseType === "on-demand" ? "On-demand use" : "Follow-up use after a bleed"}</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials used?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setUseCount(""); setSelectedUseType(null); }} aria-label="Back to use type" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-2 text-xs text-[#806d51]">Enter the number of vials used.</p><div className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-2xl font-bold tracking-wide text-[#3b281c]">{useCount || "0"}</div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setUseCount((count) => `${count}${number}`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setUseCount("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setUseCount((count) => `${count}0`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setUseCount((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!useCount} onClick={() => { saveOnDemandUse(); setSelectedDate(null); setSelectedAction(null); setSelectedUseType(null); setUseCount(""); }} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Track</button></aside></div>}
      {showSupplyHistory && <div onClick={() => setShowSupplyHistory(false)} className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Factor Supply</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">Recent activity</h2></div><button onClick={() => setShowSupplyHistory(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div>{supplyHistory.length ? <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto">{supplyHistory.map((row) => { const [year, month, day] = row.dateKey.split("-").map(Number); const dateLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); return <div key={row.id} className="flex items-center justify-between rounded-xl bg-[#f8f0e2] px-3 py-2"><div><p className="text-xs font-bold text-[#443229]">{dateLabel}</p><p className="text-sm text-[#806d51]">{row.detail}</p></div><span className={`text-sm font-bold ${row.amount > 0 ? "text-[#3b9c5c]" : "text-[#cd5952]"}`}>{row.amount > 0 ? `+${row.amount}` : row.amount}</span></div>; })}</div> : <p className="mt-5 text-sm text-[#806d51]">No vial activity logged yet.</p>}</aside></div>}
      {editingRoutineField === "frequency" && <div onClick={() => setEditingRoutineField(null)} className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Your Current Routine</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How often is prophylaxis due?</h2></div><button onClick={() => setEditingRoutineField(null)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div><p className="mt-2 text-xs text-[#806d51]">For example, enter 3 for a dose every 3 days.</p><div className="relative mt-3 rounded-xl bg-[#f8f0e2] px-4 py-2 text-center"><span className="text-2xl font-bold tracking-wide text-[#3b281c]">{routineIntervalDraft || "0"}</span><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#806d51]">days</span></div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setRoutineIntervalDraft((count) => `${count}${number}`.slice(0, 2))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setRoutineIntervalDraft("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setRoutineIntervalDraft((count) => `${count}0`.slice(0, 2))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setRoutineIntervalDraft((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!routineIntervalDraft || Number(routineIntervalDraft) === 0} onClick={saveRoutineInterval} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Save</button></aside></div>}
      {editingRoutineField === "dosage" && <div onClick={() => setEditingRoutineField(null)} className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Your Current Routine</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials per dose?</h2></div><button onClick={() => setEditingRoutineField(null)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div><p className="mt-2 text-xs text-[#806d51]">Enter your usual dosage in vials</p><div className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-2xl font-bold tracking-wide text-[#3b281c]">{routineVialsDraft || "0"}</div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setRoutineVialsDraft((count) => `${count}${number}`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setRoutineVialsDraft("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setRoutineVialsDraft((count) => `${count}0`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setRoutineVialsDraft((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!routineVialsDraft || Number(routineVialsDraft) === 0} onClick={saveRoutineVials} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Save</button></aside></div>}
      {editingRoutineField === "start" && <div onClick={() => setEditingRoutineField(null)} className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Your Current Routine</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">When did this routine start?</h2></div><button onClick={() => setEditingRoutineField(null)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div><div className="mt-4 flex items-center justify-between"><button onClick={() => setRoutineDatePickerMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"><Icon name="chevronLeft" className="h-4 w-4" /></button><span className="text-sm font-bold text-[#443229]">{routineDatePickerMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span><button onClick={() => setRoutineDatePickerMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"><Icon name="chevronRight" className="h-4 w-4" /></button></div><div className="mt-3 grid grid-cols-7 gap-1">{DAYS.map((day) => <div key={day} className="text-center text-[10px] font-bold uppercase text-slate-400">{day[0]}</div>)}{routineDatePickerDays.map((date) => { const inMonth = date.getMonth() === routineDatePickerMonth.getMonth(); const isSelected = routineStartDate ? toKey(date) === toKey(routineStartDate) : false; return <button key={toKey(date)} onClick={() => saveRoutineStartDate(date)} className={`grid h-9 place-items-center rounded-lg text-xs font-semibold transition ${isSelected ? "bg-[#6c5ce7] text-white" : inMonth ? "text-[#443229] hover:bg-[#f4ead8]" : "text-slate-300 hover:bg-[#f4ead8]"}`}>{date.getDate()}</button>; })}</div></aside></div>}
    </div>
  );
}
