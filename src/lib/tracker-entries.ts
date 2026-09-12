import { fromKey, shortDate, toKey } from "@/lib/tracker-dates";

/**
 * The tracker's event ledger.
 *
 * Entries are a discriminated union rather than free text: the UI used to store
 * each entry as an English sentence and read it back with regexes
 * (`detail.startsWith("Regular prophylaxis use")`, `/(\d+)\s*vials?/`), which
 * meant a copy tweak silently broke the supply arithmetic. The sentences are now
 * produced by `entryDetail` at render time and never parsed back.
 */

/** How much factor a dose used. `routine` defers to the profile's prophylaxis dosage. */
export type DoseAmount =
  { source: "pending" } | { source: "routine" } | { source: "custom"; vials: number };

export type TrackerEntry =
  | { id: number; kind: "refill"; vials: number }
  /** The planned preventative dose. Amount always comes from the routine. */
  | { id: number; kind: "prophylaxis" }
  | { id: number; kind: "on-demand"; vials: number }
  | { id: number; kind: "follow-up"; vials: number }
  /** The dose that made up for a missed one, filed on the day it was taken. */
  | { id: number; kind: "makeup"; missedDateKey: string; amount: DoseAmount }
  /** A dose that was due but not taken on the day. Filed on the day it was due. */
  | {
      id: number;
      kind: "missed";
      status: "awaiting" | "skipped" | "taken";
      /** Set once the user says when they made the dose up; points at a `makeup` entry. */
      takenDateKey?: string;
      amount?: DoseAmount;
    };

export type EntryMap = Record<string, TrackerEntry[]>;

/** The id given to the prophylaxis dose implied by the routine's start date. */
export const ROUTINE_START_ENTRY_ID = -1;

const DOSE_KINDS = ["prophylaxis", "on-demand", "follow-up", "makeup"] as const;

export type DoseKind = (typeof DOSE_KINDS)[number];

export function isDose(entry: TrackerEntry): entry is Extract<TrackerEntry, { kind: DoseKind }> {
  return (DOSE_KINDS as readonly string[]).includes(entry.kind);
}

export function vialLabel(vials: number) {
  return `${vials} vial${vials === 1 ? "" : "s"}`;
}

/** The heading shown on an entry row, and the grouping the calendar dots use. */
export function entryLabel(entry: TrackerEntry) {
  if (entry.kind === "refill") return "Factor Refill";
  if (entry.kind === "missed") return "Missed Dose";
  return "Factor Use";
}

function amountLabel(amount: DoseAmount, routineVials: number | undefined) {
  if (amount.source === "pending") return "Awaiting response";
  if (amount.source === "custom") return vialLabel(amount.vials);
  return routineVials
    ? `${vialLabel(routineVials)} (Regular prophylaxis amount)`
    : "Regular prophylaxis amount";
}

/** The sentence under an entry's heading. Display only — never parsed back. */
export function entryDetail(entry: TrackerEntry, routineVials: number | undefined): string {
  switch (entry.kind) {
    case "refill":
      return `${vialLabel(entry.vials)} added`;
    case "prophylaxis":
      return routineVials
        ? `Regular prophylaxis use — ${vialLabel(routineVials)}`
        : "Regular prophylaxis use";
    case "on-demand":
      return `On-demand use — ${vialLabel(entry.vials)}`;
    case "follow-up":
      return `Follow-up use after a bleed — ${vialLabel(entry.vials)}`;
    case "makeup":
      return `Missed dose on ${shortDate(fromKey(entry.missedDateKey))} - ${amountLabel(entry.amount, routineVials)}`;
    case "missed": {
      if (entry.status === "awaiting") return "Awaiting response";
      if (entry.status === "skipped") return "Skipped";
      if (!entry.takenDateKey) return "Taken";
      const taken = `Taken on ${shortDate(fromKey(entry.takenDateKey))}`;
      return entry.amount ? `${taken} — ${amountLabel(entry.amount, routineVials)}` : taken;
    }
  }
}

/**
 * Vials this entry moves in or out of the supply. A dose whose amount is still
 * unknown counts as zero rather than guessing.
 */
export function entryVials(entry: TrackerEntry, routineVials: number | undefined): number {
  switch (entry.kind) {
    case "refill":
      return entry.vials;
    case "prophylaxis":
      return -(routineVials ?? 0);
    case "on-demand":
    case "follow-up":
      return -entry.vials;
    case "makeup":
      if (entry.amount.source === "custom") return -entry.amount.vials;
      if (entry.amount.source === "routine") return -(routineVials ?? 0);
      return 0;
    case "missed":
      // The dose itself is recorded as a `makeup` entry on the day it was taken.
      return 0;
  }
}

/**
 * The stored ledger plus the prophylaxis dose implied by the routine's start
 * date. That dose is derived rather than written so editing the routine can
 * never leave a stale entry behind; a future start date implies nothing yet.
 */
export function withRoutineStartDose(
  entries: EntryMap,
  routineStartDate: Date | undefined,
  today: Date,
): EntryMap {
  if (!routineStartDate || routineStartDate.getTime() > today.getTime()) return entries;
  const key = toKey(routineStartDate);
  const existing = entries[key] ?? [];
  if (existing.some((entry) => entry.kind === "prophylaxis")) return entries;
  return {
    ...entries,
    [key]: [...existing, { id: ROUTINE_START_ENTRY_ID, kind: "prophylaxis" }],
  };
}

/** The most recent dose, which is what the prophylaxis schedule counts forward from. */
export function latestDoseDate(entries: EntryMap, routineStartDate: Date | undefined) {
  if (!routineStartDate) return undefined;
  let latest = routineStartDate;
  Object.entries(entries).forEach(([key, dayEntries]) => {
    const hasDose = dayEntries.some(
      (entry) => entry.kind === "prophylaxis" || entry.kind === "makeup",
    );
    if (!hasDose) return;
    const date = fromKey(key);
    if (date.getTime() > latest.getTime()) latest = date;
  });
  return latest;
}

export type SupplyRow = {
  id: number;
  dateKey: string;
  detail: string;
  amount: number;
};

/** The most recent vial movements, newest first. Entries of unknown size are skipped. */
export function supplyHistory(
  entries: EntryMap,
  routineVials: number | undefined,
  limit = 5,
): SupplyRow[] {
  const rows: SupplyRow[] = [];
  Object.entries(entries).forEach(([dateKey, dayEntries]) => {
    dayEntries.forEach((entry) => {
      const amount = entryVials(entry, routineVials);
      if (!amount) return;
      rows.push({ id: entry.id, dateKey, detail: entryDetail(entry, routineVials), amount });
    });
  });
  rows.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : b.id - a.id));
  return rows.slice(0, limit);
}

export function totalFactorSupply(entries: EntryMap, routineVials: number | undefined) {
  const total = Object.values(entries).reduce(
    (sum, dayEntries) =>
      sum + dayEntries.reduce((daySum, entry) => daySum + entryVials(entry, routineVials), 0),
    0,
  );
  return Math.max(0, total);
}
