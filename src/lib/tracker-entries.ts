import type {
  AmountSource,
  TrackingEvent as ApiTrackingEvent,
  TrackingEventDraft,
} from "@/lib/api";
import { fromKey, shortDate } from "@/lib/tracker-dates";

/**
 * The tracker's event ledger.
 *
 * Entries are a discriminated union rather than free text: the UI used to store
 * each entry as an English sentence and read it back with regexes
 * (`detail.startsWith("Regular prophylaxis use")`, `/(\d+)\s*vials?/`), which
 * meant a copy tweak silently broke the supply arithmetic. The sentences are now
 * produced by `entryDetail` at render time and never parsed back.
 *
 * Nothing here counts vials. The API folds the ledger and reports what it
 * charged for each entry as `appliedVials`; the page only ever displays that.
 */

/** How much factor a dose used. `routine` defers to the schedule's dose size. */
export type DoseAmount =
  { source: "pending" } | { source: "routine" } | { source: "custom"; vials: number };

type Base = {
  id: number;
  /**
   * What the fold charged the cupboard for this entry: positive for a refill,
   * negative for a dose. From the API, so absent on an entry not yet written.
   */
  appliedVials?: number;
};

export type TrackerEntry =
  | (Base & { kind: "refill"; vials: number })
  /** The planned preventative dose. Sized by the schedule on that day; resolved by the API. */
  | (Base & { kind: "prophylaxis"; vials?: number })
  | (Base & { kind: "on-demand"; vials: number })
  | (Base & { kind: "follow-up"; vials: number })
  /** The dose that made up for a missed one, filed on the day it was taken. */
  | (Base & { kind: "makeup"; missedDateKey: string; amount: DoseAmount })
  /** A dose that was due but not taken on the day. Filed on the day it was due. */
  | (Base & {
      kind: "missed";
      status: "awaiting" | "skipped" | "taken";
      /** Set once the user says when they made the dose up; points at a `makeup` entry. */
      takenDateKey?: string;
      amount?: DoseAmount;
    });

export type EntryMap = Record<string, TrackerEntry[]>;

export function vialLabel(vials: number) {
  return `${vials} vial${vials === 1 ? "" : "s"}`;
}

/** The heading shown on an entry row, and the grouping the calendar dots use. */
export function entryLabel(entry: TrackerEntry) {
  if (entry.kind === "refill") return "Factor Refill";
  if (entry.kind === "missed") return "Missed Dose";
  return "Factor Use";
}

/** The size of a routine-sized dose, once the API has charged it. */
function chargedVials(entry: TrackerEntry): number | undefined {
  return entry.appliedVials && entry.appliedVials < 0 ? -entry.appliedVials : undefined;
}

function amountLabel(amount: DoseAmount, routineVials: number | undefined) {
  if (amount.source === "pending") return "Awaiting response";
  if (amount.source === "custom") return vialLabel(amount.vials);
  return routineVials
    ? `${vialLabel(routineVials)} (Regular prophylaxis amount)`
    : "Regular prophylaxis amount";
}

/** The sentence under an entry's heading. Display only — never parsed back. */
export function entryDetail(entry: TrackerEntry): string {
  switch (entry.kind) {
    case "refill":
      return `${vialLabel(entry.vials)} added`;
    case "prophylaxis": {
      const vials = entry.vials ?? chargedVials(entry);
      return vials ? `Regular prophylaxis use — ${vialLabel(vials)}` : "Regular prophylaxis use";
    }
    case "on-demand":
      return `On-demand use — ${vialLabel(entry.vials)}`;
    case "follow-up":
      return `Follow-up use after a bleed — ${vialLabel(entry.vials)}`;
    case "makeup":
      return `Missed dose on ${shortDate(fromKey(entry.missedDateKey))} - ${amountLabel(entry.amount, chargedVials(entry))}`;
    case "missed": {
      if (entry.status === "awaiting") return "Awaiting response";
      if (entry.status === "skipped") return "Skipped";
      if (!entry.takenDateKey) return "Taken";
      const taken = `Taken on ${shortDate(fromKey(entry.takenDateKey))}`;
      return entry.amount ? `${taken} — ${amountLabel(entry.amount, undefined)}` : taken;
    }
  }
}

/** Add an entry to a day, replacing any existing entries of the given kinds. */
export function withEntry(
  entries: EntryMap,
  dateKey: string,
  entry: TrackerEntry,
  replaces: readonly TrackerEntry["kind"][],
): EntryMap {
  const current = entries[dateKey] ?? [];
  return {
    ...entries,
    [dateKey]: [...current.filter((item) => !replaces.includes(item.kind)), entry],
  };
}

/** The tracker records one factor use per day, and a confirmed dose supersedes a "Missed Dose". */
const PROPHYLAXIS_SUPERSEDES = ["prophylaxis", "on-demand", "follow-up", "missed"] as const;

/**
 * Log the routine dose on a day.
 *
 * Shared by the tracker's Factor Use flow and Home's "Taken" button, so the
 * two screens apply exactly the same rule to the same ledger. `id` is a local
 * placeholder; the API assigns the real one on the re-read.
 */
export function recordProphylaxis(entries: EntryMap, dateKey: string, id: number): EntryMap {
  return withEntry(entries, dateKey, { id, kind: "prophylaxis" }, PROPHYLAXIS_SUPERSEDES);
}

export type SupplyRow = {
  id: number;
  dateKey: string;
  detail: string;
  amount: number;
};

/**
 * The most recent vial movements, newest first, as the API charged them.
 * Entries not yet written, and doses of unknown size, are skipped.
 */
export function supplyHistory(entries: EntryMap, limit = 5): SupplyRow[] {
  const rows: SupplyRow[] = [];
  Object.entries(entries).forEach(([dateKey, dayEntries]) => {
    dayEntries.forEach((entry) => {
      if (!entry.appliedVials) return;
      rows.push({ id: entry.id, dateKey, detail: entryDetail(entry), amount: entry.appliedVials });
    });
  });
  rows.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : b.id - a.id));
  return rows.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* The API ledger <-> TrackerEntry                                     */
/* ------------------------------------------------------------------ */

/**
 * The API returns one flat row per event, with a null for every field that
 * does not belong to its kind. These two functions are the only place that
 * narrowing happens; everything above this line keeps working on
 * `TrackerEntry` and never sees the wire shape.
 */

function amountFromApi(source: AmountSource | null, vials: number | null): DoseAmount | undefined {
  if (source === "custom") return { source: "custom", vials: vials ?? 0 };
  if (source === "routine") return { source: "routine" };
  if (source === "pending") return { source: "pending" };
  return undefined;
}

function entryFromApi(event: ApiTrackingEvent): TrackerEntry | null {
  const base = { id: event.id, appliedVials: event.applied_vials };
  switch (event.kind) {
    case "refill":
      return { ...base, kind: "refill", vials: event.vials ?? 0 };
    case "prophylaxis":
      return {
        ...base,
        kind: "prophylaxis",
        ...(event.applied_vials < 0 ? { vials: -event.applied_vials } : {}),
      };
    case "on-demand":
    case "follow-up":
      return { ...base, kind: event.kind, vials: event.vials ?? 0 };
    case "makeup":
      return {
        ...base,
        kind: "makeup",
        missedDateKey: event.missed_on ?? "",
        amount: amountFromApi(event.amount_source, event.amount_vials) ?? { source: "pending" },
      };
    case "missed":
      return {
        ...base,
        kind: "missed",
        status: event.status ?? "awaiting",
        ...(event.taken_on ? { takenDateKey: event.taken_on } : {}),
        ...(() => {
          const amount = amountFromApi(event.amount_source, event.amount_vials);
          return amount ? { amount } : {};
        })(),
      };
    default:
      // A kind this build does not know about. Dropping it is better than
      // rendering a blank row, and the next deploy picks it up.
      return null;
  }
}

/** The ledger as the calendar wants it: entries grouped by day key. */
export function entriesFromApi(events: ApiTrackingEvent[]): EntryMap {
  const map: EntryMap = {};
  events.forEach((event) => {
    const entry = entryFromApi(event);
    if (!entry) return;
    (map[event.occurred_on] ??= []).push(entry);
  });
  return map;
}

/** One entry as a create/replace payload. */
export function entryToApi(entry: TrackerEntry, dateKey: string): TrackingEventDraft {
  switch (entry.kind) {
    case "refill":
      return { kind: "refill", occurred_on: dateKey, vials: entry.vials };
    case "prophylaxis":
      return { kind: "prophylaxis", occurred_on: dateKey };
    case "on-demand":
    case "follow-up":
      return { kind: entry.kind, occurred_on: dateKey, vials: entry.vials };
    case "makeup":
      return {
        kind: "makeup",
        occurred_on: dateKey,
        missed_on: entry.missedDateKey,
        amount: amountToApi(entry.amount),
      };
    case "missed":
      return {
        kind: "missed",
        occurred_on: dateKey,
        status: entry.status,
        // The API rejects these on anything but a taken dose, which mirrors
        // what the flow can actually produce.
        ...(entry.status === "taken" && entry.takenDateKey ? { taken_on: entry.takenDateKey } : {}),
        ...(entry.status === "taken" && entry.amount ? { amount: amountToApi(entry.amount) } : {}),
      };
  }
}

function amountToApi(amount: DoseAmount): { source: AmountSource; vials?: number } {
  // `pending` and `routine` carry no vial count — the API rejects one, because
  // folding an amount the user never gave would invent supply.
  return amount.source === "custom"
    ? { source: "custom", vials: amount.vials }
    : { source: amount.source };
}
