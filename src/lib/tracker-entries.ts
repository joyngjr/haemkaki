import type {
  AmountSource,
  TrackingEvent as ApiTrackingEvent,
  BleedNature,
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
 *
 * There is no entry for a missed dose. A miss is the absence of a factor use
 * on a day the routine planned one, so it is derived where the planned doses
 * are known (`missedDays` in `src/pages/Tracker.tsx`, `status.missed_doses`
 * for Home) rather than written down. One dose, one entry, one charge.
 */

/** How much factor a dose used. `routine` defers to the schedule's dose size. */
export type DoseAmount =
  { source: "pending" } | { source: "routine" } | { source: "custom"; vials: number };

type Base = {
  id: number;
  /**
   * What the fold charged the cupboard for this entry: positive for a refill,
   * negative for a dose, and for a count the correction it made. From the
   * API, so absent on an entry not yet written.
   */
  appliedVials?: number;
};

export type TrackerEntry =
  | (Base & { kind: "refill"; vials: number })
  /**
   * The planned preventative dose. `vials` only when the dose carries its own
   * size (typed in, or imported with one); otherwise the schedule on that day
   * sizes it and `appliedVials` says how much, resolved by the API.
   */
  | (Base & { kind: "prophylaxis"; vials?: number })
  /** `nature` is unset on a dose logged before it was asked, and on imported history. */
  | (Base & { kind: "on-demand"; vials: number; nature?: BleedNature })
  | (Base & { kind: "follow-up"; vials: number })
  /**
   * A planned dose taken late, filed on the day it was actually taken.
   * `missedDateKey` is the planned day it was owed for — the one thing that
   * stops that day reading as missed.
   */
  | (Base & { kind: "makeup"; missedDateKey: string; amount: DoseAmount })
  /**
   * The vials actually at home, counted — how a wrong entry is corrected.
   * The API takes it over whatever the entries before it add up to.
   */
  | (Base & { kind: "count"; vials: number });

export type EntryMap = Record<string, TrackerEntry[]>;

/** The API caps every amount — a dose, a refill, the buffer — at 999 vials. */
export const VIALS_MAX = 999;
/** How many digits a vial count accepts: as many as `VIALS_MAX` has. */
export const VIALS_DIGITS = String(VIALS_MAX).length;

export const BLEED_NATURE_LABEL: Record<BleedNature, string> = {
  spontaneous: "Spontaneous",
  traumatic: "Traumatic",
};

/** "3 vials", "1 vial" — every amount the app prints, so they all read the same. */
export function vialLabel(vials: number) {
  return `${vials} vial${vials === 1 ? "" : "s"}`;
}

/** The heading shown on an entry row, and the grouping the calendar dots use. */
export function entryLabel(entry: TrackerEntry) {
  if (entry.kind === "refill") return "Factor Refill";
  if (entry.kind === "count") return "Stock Count";
  return "Factor Use";
}

/** The size of a routine-sized dose, once the API has charged it. */
export function chargedVials(entry: TrackerEntry): number | undefined {
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
      return entry.nature
        ? `On-demand use (${entry.nature} bleed) — ${vialLabel(entry.vials)}`
        : `On-demand use — ${vialLabel(entry.vials)}`;
    case "follow-up":
      return `Follow-up use after a bleed — ${vialLabel(entry.vials)}`;
    case "makeup":
      return `Missed dose on ${shortDate(fromKey(entry.missedDateKey))} - ${amountLabel(entry.amount, chargedVials(entry))}`;
    case "count":
      return `${vialLabel(entry.vials)} at home`;
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

/** The tracker records one factor use per day, whichever kind it is. */
export const FACTOR_USE_KINDS = ["prophylaxis", "on-demand", "follow-up", "makeup"] as const;

/**
 * Log the routine dose on a day.
 *
 * Shared by the tracker's Factor Use flow and Home's "Taken" button, so the
 * two screens apply exactly the same rule to the same ledger. `id` is a local
 * placeholder; the API assigns the real one on the re-read.
 */
export function recordProphylaxis(entries: EntryMap, dateKey: string, id: number): EntryMap {
  return withEntry(entries, dateKey, { id, kind: "prophylaxis" }, FACTOR_USE_KINDS);
}

export type SupplyRow = {
  id: number;
  dateKey: string;
  detail: string;
  amount: number;
};

/**
 * The most recent factor movements, newest first, as the API charged them.
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
      // Only an explicit count is the entry's own; a routine-sized dose keeps
      // `vials` empty and shows `appliedVials` instead, so a round-trip never
      // freezes the routine's size into the row.
      return { ...base, kind: "prophylaxis", ...(event.vials ? { vials: event.vials } : {}) };
    case "on-demand":
      return {
        ...base,
        kind: "on-demand",
        vials: event.vials ?? 0,
        ...(event.bleed_nature ? { nature: event.bleed_nature } : {}),
      };
    case "follow-up":
      return { ...base, kind: "follow-up", vials: event.vials ?? 0 };
    case "makeup":
      return {
        ...base,
        kind: "makeup",
        missedDateKey: event.missed_on ?? "",
        amount: amountFromApi(event.amount_source, event.amount_vials) ?? { source: "pending" },
      };
    case "count":
      return { ...base, kind: "count", vials: event.vials ?? 0 };
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
      return {
        kind: "prophylaxis",
        occurred_on: dateKey,
        ...(entry.vials ? { vials: entry.vials } : {}),
      };
    case "on-demand":
      return {
        kind: "on-demand",
        occurred_on: dateKey,
        vials: entry.vials,
        ...(entry.nature ? { bleed_nature: entry.nature } : {}),
      };
    case "follow-up":
      return { kind: "follow-up", occurred_on: dateKey, vials: entry.vials };
    case "makeup":
      return {
        kind: "makeup",
        occurred_on: dateKey,
        missed_on: entry.missedDateKey,
        amount: amountToApi(entry.amount),
      };
    case "count":
      return { kind: "count", occurred_on: dateKey, vials: entry.vials };
  }
}

function amountToApi(amount: DoseAmount): { source: AmountSource; vials?: number } {
  // `pending` and `routine` carry no amount — the API rejects one, because
  // folding an amount the user never gave would invent supply.
  return amount.source === "custom"
    ? { source: "custom", vials: amount.vials }
    : { source: amount.source };
}
