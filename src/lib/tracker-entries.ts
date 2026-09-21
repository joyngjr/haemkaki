import { fromKey, shortDate } from "@/lib/tracker-dates";

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

/** Whether a bleed started on its own or followed an injury. */
export type BleedNature = "spontaneous" | "traumatic";

export const BLEED_NATURE_LABEL: Record<BleedNature, string> = {
  spontaneous: "Spontaneous",
  traumatic: "Traumatic",
};

export type TrackerEntry =
  | { id: number; kind: "refill"; vials: number }
  /** The planned preventative dose. Amount always comes from the routine. */
  | { id: number; kind: "prophylaxis" }
  /** `nature` is unset on entries logged before it was asked. */
  | { id: number; kind: "on-demand"; vials: number; nature?: BleedNature }
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
      return entry.nature
        ? `On-demand use (${entry.nature} bleed) — ${vialLabel(entry.vials)}`
        : `On-demand use — ${vialLabel(entry.vials)}`;
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
 * Whether an entry is a dose the prophylaxis schedule is counted from. A made-up
 * dose whose size is still unanswered doesn't count yet — the flow isn't done.
 */
export function countsTowardSchedule(entry: TrackerEntry) {
  return (
    entry.kind === "prophylaxis" || (entry.kind === "makeup" && entry.amount.source !== "pending")
  );
}

/** The date a schedule-counting dose is filed under, or undefined once it has been removed. */
export function scheduleDoseDate(entries: EntryMap, id: number | undefined) {
  if (id === undefined) return undefined;
  const found = Object.entries(entries).find(([, dayEntries]) =>
    dayEntries.some((entry) => entry.id === id && countsTowardSchedule(entry)),
  );
  return found ? fromKey(found[0]) : undefined;
}

/**
 * The dose that has thrown the planned schedule off, if there is one.
 *
 * Only the latest dose after `anchorDate` matters: if it sits on the current
 * schedule nothing has changed, and if it doesn't, it is the date any shifted
 * schedule would count forward from. Doses on or before `handledThrough` have
 * already been answered, so they are left alone.
 */
export function findScheduleDisruption(
  entries: EntryMap,
  anchorDate: Date | undefined,
  handledThrough: Date | undefined,
  isPlanned: (date: Date) => boolean,
) {
  if (!anchorDate) return undefined;
  const floor =
    handledThrough && handledThrough.getTime() > anchorDate.getTime() ? handledThrough : anchorDate;
  let latest: { id: number; date: Date } | undefined;
  Object.entries(entries).forEach(([key, dayEntries]) => {
    const dose = dayEntries.find(countsTowardSchedule);
    if (!dose) return;
    const date = fromKey(key);
    if (date.getTime() <= floor.getTime()) return;
    if (!latest || date.getTime() > latest.date.getTime()) latest = { id: dose.id, date };
  });
  if (!latest || isPlanned(latest.date)) return undefined;
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
  vialsOn: (dateKey: string) => number | undefined,
  limit = 5,
): SupplyRow[] {
  const rows: SupplyRow[] = [];
  Object.entries(entries).forEach(([dateKey, dayEntries]) => {
    dayEntries.forEach((entry) => {
      const routineVials = vialsOn(dateKey);
      const amount = entryVials(entry, routineVials);
      if (!amount) return;
      rows.push({ id: entry.id, dateKey, detail: entryDetail(entry, routineVials), amount });
    });
  });
  rows.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : b.id - a.id));
  return rows.slice(0, limit);
}

export function totalFactorSupply(
  entries: EntryMap,
  vialsOn: (dateKey: string) => number | undefined,
) {
  const total = Object.entries(entries).reduce(
    (sum, [dateKey, dayEntries]) =>
      sum + dayEntries.reduce((daySum, entry) => daySum + entryVials(entry, vialsOn(dateKey)), 0),
    0,
  );
  return Math.max(0, total);
}
