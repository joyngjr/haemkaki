import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";

type SavedEntry = { id: number; label: string; detail: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function getSingaporeToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Singapore", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day));
}

function Icon({ name, className = "" }: { name: "chevronLeft" | "chevronRight" | "plus" | "close"; className?: string }) {
  const paths = {
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>;
}

export function Tracker() {
  const today = getSingaporeToday();
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
    setSavedEntries((entries) => {
      const current = entries[dateKey] ?? [];
      if (current.some((entry) => entry.label === "Factor Use" && entry.detail === "Regular prophylaxis use")) return entries;
      const withoutPreviousUse = current.filter((entry) => entry.label !== "Factor Use");
      return { ...entries, [dateKey]: [...withoutPreviousUse, { id: Date.now(), label: "Factor Use", detail: "Regular prophylaxis use" }] };
    });
  }, [selectedDate, selectedAction, selectedUseType]);

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
      (entry) => entry.label === "Factor Use" && entry.detail === "Regular prophylaxis use",
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
    return Array.from({ length: 35 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [viewDate]);

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

  const monthTitle = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedDayLabel = selectedDate?.toLocaleDateString("en-US", { weekday: "long" }) ?? "Selected date";
  const selectedDateLabel = selectedDate?.toLocaleDateString("en-US", { month: "long", day: "numeric" }) ?? "";

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

  function saveMissedDoseProphylaxis() {
    if (!selectedDate || !missedTakenDate) return;
    const takenLabel = `Taken on ${missedTakenDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    updateMissedDoseDetail(toKey(selectedDate), `${takenLabel} — Regular prophylaxis amount`);
  }

  function saveMissedDoseVials() {
    if (!selectedDate || !missedTakenDate || !missedVialCount || Number(missedVialCount) === 0) return;
    const takenLabel = `Taken on ${missedTakenDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    updateMissedDoseDetail(toKey(selectedDate), `${takenLabel} — ${missedVialCount} vial${missedVialCount === "1" ? "" : "s"}`);
  }

  function saveMissedDoseSkipped() {
    if (!selectedDate) return;
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

  return (
    <div data-theme="warm" className="min-h-screen overflow-x-hidden bg-[#f8f0e2] px-3 py-4 pb-24 text-slate-900 sm:px-8 sm:py-10 sm:pb-24">
      <main className="mx-auto max-w-5xl">
        <header className="mb-4 ml-3 mt-2 sm:mb-6 sm:ml-7 sm:mt-3">
          <div><h1 className="text-[26px] font-bold tracking-tight text-[#3b281c] sm:text-[38px]">Tracker</h1><p className="mt-1 text-[14px] leading-tight text-[#806d51] sm:mt-2 sm:text-[18px]">Log doses and bleeds as they happen.</p></div>
        </header>
        <div>
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:rounded-3xl sm:p-7">
            <div className="mb-7 flex items-center justify-between"><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{monthTitle}</h1><div className="flex items-center gap-1"><button onClick={() => changeMonth(-1)} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={() => { setViewDate(today); setSelectedDate(today); }} className="rounded-lg px-3 py-2 text-xs font-bold text-[#6c5ce7] transition hover:bg-violet-50">Today</button><button onClick={() => changeMonth(1)} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"><Icon name="chevronRight" className="h-5 w-5" /></button></div></div>
            <div className="grid grid-cols-7 border-b border-slate-100 pb-3">{DAYS.map((day) => <div key={day} className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{day}</div>)}</div>
            <div className="grid grid-cols-7 pt-2">{calendarDays.map((date) => {
              const key = toKey(date); const currentMonth = date.getMonth() === viewDate.getMonth(); const isToday = key === toKey(today); const isSelected = selectedDate ? key === toKey(selectedDate) : false; const hasFactorUse = (savedEntries[key] ?? []).some((entry) => entry.label === "Factor Use") || Boolean(takenMissedDoseDates[key]); const hasMissedDose = (savedEntries[key] ?? []).some((entry) => entry.label === "Missed Dose"); const hasOnDemandUse = (savedEntries[key] ?? []).some((entry) => entry.label === "Factor Use" && entry.detail.startsWith("On-demand use"));
              return <button key={key} onClick={() => { setSelectedDate(date); setSelectedAction(null); }} aria-pressed={isSelected} className={`group relative flex aspect-[.75] flex-col items-center rounded-xl pt-2 transition focus:z-10 focus:outline-none focus:ring-2 focus:ring-violet-300 sm:aspect-[.85] sm:pt-3 ${isSelected ? "bg-[#6c5ce7] text-white shadow-md shadow-violet-200" : "hover:bg-violet-50"}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${!currentMonth ? "text-slate-300" : isSelected ? "text-white" : isToday ? "bg-violet-100 text-[#6c5ce7]" : "text-slate-700"}`}>{date.getDate()}</span>{(hasFactorUse || hasMissedDose || hasOnDemandUse) && <span className="mt-0.5 flex items-center gap-1">{hasFactorUse && <i className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-white" : "bg-[#8df5c0]"}`} />}{hasMissedDose && <i className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-white" : "bg-[#ffcc4d]"}`} />}{hasOnDemandUse && <svg className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-[#cd5952]"}`} viewBox="0 0 24 24" fill="currentColor" aria-label="Bleed indicator"><path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z" /></svg>}</span>}</button>;
            })}</div>
          </section>
        </div>
      </main>
      {selectedDate && <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">{selectedDayLabel}</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">{selectedDateLabel}</h2></div><button onClick={() => setSelectedDate(null)} aria-label="Close date details" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div><div className="mt-6 space-y-3"><button onClick={() => setSelectedAction("refill")} aria-pressed={selectedAction === "refill"} className="flex w-full items-center gap-3 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#a98559]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d8c3a0]/35 text-[#80633e]"><Icon name="plus" className="h-6 w-6" /></span><span className="flex-1"><span className="block text-sm font-bold text-[#443229]">Factor Refill</span><span className="mt-1 block text-xs text-[#806d51]">Add new vials to your supply</span></span></button><button onClick={() => setSelectedAction("use")} aria-pressed={selectedAction === "use"} className="flex w-full items-center gap-3 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8df5c0]/25 text-[#3b281c]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 19 4-4M8 20l-4-4M10 14l-3-3 5-5 3 3-5 5ZM14 6l2-2 4 4-2 2M15 15h5v5h-5z" /></svg></span><span className="flex-1"><span className="block text-sm font-bold text-[#443229]">Factor Use</span><span className="mt-1 block text-xs text-[#806d51]">Record an injection</span></span><i className="h-2.5 w-2.5 rounded-full bg-[#8df5c0]" /></button><button onClick={() => setSelectedAction("missed")} aria-pressed={selectedAction === "missed"} className="flex w-full items-center gap-3 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#cd5952]"><span className="grid h-10 w-10 shrink-0 items-center rounded-xl bg-[#cd5952]/15 text-[#cd5952]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 17h.01" /></svg></span><span className="flex-1"><span className="block text-sm font-bold text-[#443229]">Missed Dose</span><span className="mt-1 block text-xs text-[#806d51]">Mark a dose that was missed</span></span><i className="h-2.5 w-2.5 rounded-full bg-[#cd5952]" /></button></div></aside></div>}
      {selectedDate && <section className="fixed bottom-24 left-3 right-3 z-[60] mx-auto max-w-md rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-4 shadow-xl sm:bottom-6 sm:left-auto sm:right-6"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#3b281c]">Saved entries</h3><span className="text-xs text-[#806d51]">{(savedEntries[toKey(selectedDate)] ?? []).length}</span></div>{(savedEntries[toKey(selectedDate)] ?? []).length ? <div className="mt-3 space-y-2">{savedEntries[toKey(selectedDate)].map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-xl bg-[#f8f0e2] px-3 py-2"><div><p className="text-xs font-bold text-[#443229]">{entry.label}</p><p className="text-[11px] text-[#806d51]">{entry.detail}</p></div><div className="flex gap-1"><button onClick={() => editEntry(toKey(selectedDate), entry)} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#80633e] hover:bg-[#f4ead8]">Edit</button><button onClick={() => setSavedEntries((entries) => ({ ...entries, [toKey(selectedDate)]: (entries[toKey(selectedDate)] ?? []).filter((item) => item.id !== entry.id) }))} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#cd5952] hover:bg-[#f4ead8]">Delete</button></div></div>)}</div> : <p className="mt-2 text-xs text-[#806d51]">No saved entries for this date yet.</p>}</section>}
      {selectedDate && selectedAction === "use" && !selectedUseType && <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Factor Use</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">What kind of use?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setSelectedAction(null); setSelectedUseType(null); }} aria-label="Back to date actions" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><div className="mt-6 space-y-3"><button onClick={() => setSelectedUseType("prophylaxis")} aria-pressed={selectedUseType === "prophylaxis"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="block text-sm font-bold text-[#443229]">Regular prophylaxis use</span><span className="mt-1 block text-xs text-[#806d51]">Your planned preventative dose</span></button><button onClick={() => setSelectedUseType("on-demand")} aria-pressed={selectedUseType === "on-demand"} className="relative w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 pr-12 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="block text-sm font-bold text-[#443229]">On-demand use</span><span className="mt-1 block text-xs text-[#806d51]">Treatment taken when a bleed starts</span><svg className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#cd5952]" viewBox="0 0 24 24" fill="currentColor" aria-label="Bleed indicator"><path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z" /></svg></button><button onClick={() => setSelectedUseType("follow-up")} aria-pressed={selectedUseType === "follow-up"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#8df5c0]"><span className="block text-sm font-bold text-[#443229]">Follow-up use after a bleed</span><span className="mt-1 block text-xs text-[#806d51]">An additional dose after a serious bleed</span></button></div></aside></div>}
      {selectedDate && selectedAction === "missed" && <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#443229]/25 p-3 backdrop-blur-sm sm:items-center sm:p-6"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">Was the missed dose taken or skipped?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setSelectedAction(null); setMissedAnswer(null); }} aria-label="Back to date actions" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><div className="mt-6 space-y-3"><button onClick={() => setMissedAnswer("taken")} aria-pressed={missedAnswer === "taken"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#cd5952]">Taken</button><button onClick={() => { saveMissedDoseSkipped(); setSelectedAction(null); }} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">Skipped</button></div></aside></div>}
      {selectedDate && selectedAction === "missed" && missedAnswer === "taken" && !missedTakenDate && <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-60 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-64"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">When did you take the missed dose?</h2></div><div className="flex items-center gap-1"><button onClick={() => setMissedAnswer(null)} aria-label="Back to missed-dose options" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-3 text-sm font-bold text-[#443229]">{missedDoseWeekMonthLabel}</p><div className="mt-5 grid grid-cols-7 gap-1.5">{missedDoseWeek.map((date) => <button key={toKey(date)} onClick={() => setMissedTakenDate(date)} className="flex h-16 flex-col items-center justify-center rounded-xl border border-[#eee5d5] bg-[#f8f0e2] text-[#443229] transition hover:bg-[#f4ead8]"><span className="text-[10px] font-bold uppercase text-[#806d51]">{date.toLocaleDateString("en-US", { weekday: "narrow" })}</span><span className="mt-1 text-sm font-bold">{date.getDate()}</span></button>)}</div></aside></div>}
      {selectedDate && selectedAction === "missed" && missedAnswer === "taken" && missedTakenDate && !missedVialType && <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-60 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-64"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials used?</h2></div><div className="flex items-center gap-1"><button onClick={() => setMissedTakenDate(null)} aria-label="Back to missed-dose date" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><div className="mt-6 space-y-3"><button onClick={() => { saveMissedDoseProphylaxis(); setSelectedAction(null); }} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8]"><span className="block text-sm font-bold text-[#443229]">Regular prophylaxis amount</span><span className="mt-1 block text-xs text-[#806d51]">Your usual planned dose</span></button><button onClick={() => setMissedVialType("custom")} aria-pressed={missedVialType === "custom"} className="w-full rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8] aria-pressed:ring-2 aria-pressed:ring-[#cd5952]"><span className="block text-sm font-bold text-[#443229]">Custom</span><span className="mt-1 block text-xs text-[#806d51]">Enter a specific number of vials</span></button></div></aside></div>}
      {selectedDate && selectedAction === "missed" && missedAnswer === "taken" && missedTakenDate && missedVialType && <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-44 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-48"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Missed Dose</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials used?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setMissedVialType(null); setMissedVialCount(""); }} aria-label="Back to vial type" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-2 text-xs text-[#806d51]">Enter the number of vials used.</p><div className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-2xl font-bold tracking-wide text-[#3b281c]">{missedVialCount || "0"}</div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setMissedVialCount((count) => `${count}${number}`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setMissedVialCount("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setMissedVialCount((count) => `${count}0`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setMissedVialCount((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!missedVialCount || Number(missedVialCount) === 0} onClick={() => { saveMissedDoseVials(); setSelectedAction(null); }} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Track</button></aside></div>}
      {selectedDate && selectedAction === "refill" && <div className="fixed inset-0 z-40 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-16 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-20"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">Factor Refill</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setSelectedAction(null); setRefillCount(""); }} aria-label="Back to date actions" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-2 text-xs text-[#806d51]">Enter the number of vials to add to your supply.</p><div className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-2xl font-bold tracking-wide text-[#3b281c]">{refillCount || "0"}</div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setRefillCount((count) => `${count}${number}`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setRefillCount("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setRefillCount((count) => `${count}0`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setRefillCount((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!refillCount} onClick={() => { setSelectedDate(null); setSelectedAction(null); setRefillCount(""); }} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Add vials</button></aside></div>}
      {selectedDate && selectedAction === "use" && (selectedUseType === "on-demand" || selectedUseType === "follow-up") && <div className="fixed inset-0 z-40 flex items-start justify-center bg-[#443229]/25 px-3 pb-3 pt-16 backdrop-blur-sm sm:px-6 sm:pb-6 sm:pt-20"><aside className="w-full max-w-md rounded-3xl border border-[#eee5d5] bg-[#fffaf0] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#806d51]">{selectedUseType === "on-demand" ? "On-demand use" : "Follow-up use after a bleed"}</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#3b281c]">How many vials used?</h2></div><div className="flex items-center gap-1"><button onClick={() => { setUseCount(""); setSelectedUseType(null); }} aria-label="Back to use type" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="chevronLeft" className="h-5 w-5" /></button><button onClick={closeAllPopups} aria-label="Close all pop-ups" className="grid h-8 w-8 place-items-center rounded-full text-[#806d51] hover:bg-[#f4ead8]"><Icon name="close" className="h-5 w-5" /></button></div></div><p className="mt-2 text-xs text-[#806d51]">Enter the number of vials used.</p><div className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-2 text-center text-2xl font-bold tracking-wide text-[#3b281c]">{useCount || "0"}</div><div className="mt-3 grid grid-cols-3 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} onClick={() => setUseCount((count) => `${count}${number}`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">{number}</button>)}<button onClick={() => setUseCount("")} className="h-10 rounded-lg bg-[#f8f0e2] text-xs font-bold text-[#806d51] transition hover:bg-[#f4ead8]">Clear</button><button onClick={() => setUseCount((count) => `${count}0`.slice(0, 3))} className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#443229] transition hover:bg-[#f4ead8]">0</button><button onClick={() => setUseCount((count) => count.slice(0, -1))} aria-label="Delete last digit" className="h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold text-[#806d51] transition hover:bg-[#f4ead8]">⌫</button></div><button disabled={!useCount} onClick={() => { saveOnDemandUse(); setSelectedDate(null); setSelectedAction(null); setSelectedUseType(null); setUseCount(""); }} className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40">Track</button></aside></div>}
      <BottomNav active="tracker" />
      {false && <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-[#eee5d5] bg-[#f8f0e2]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(74,53,32,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-end justify-around gap-2">
          <a href="/" className="flex w-20 flex-col items-center gap-1.5 text-[#806d51] transition hover:text-[#443229]"><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Z" /></svg><span className="text-sm font-semibold">Home</span></a>
          <a href="/tracker" aria-current="page" className="flex w-20 flex-col items-center gap-1.5 text-[#443229]"><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg><span className="text-sm font-semibold">Tracker</span></a>
          <a href="/tips" className="flex w-20 flex-col items-center gap-1.5 text-[#806d51] transition hover:text-[#443229]"><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M8.5 15.5C7 14.4 6 12.6 6 10.5a6 6 0 1 1 12 0c0 2.1-1 3.9-2.5 5" /></svg><span className="text-sm font-semibold">Tips</span></a>
        </div>
      </nav>}
    </div>
  );
}
