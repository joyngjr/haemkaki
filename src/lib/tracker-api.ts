import type { ApiEntry, ApiEntryWrite, ApiPlan, ApiShift } from "@/lib/api";
import type { DoseAmount, EntryMap, TrackerEntry } from "@/lib/tracker-entries";
import type { PlanAhead } from "@/lib/tracker-plans";

/**
 * Converting between the tracker's entries and the backend's flat rows.
 *
 * The backend keeps one row per entry with nullable columns, while the tracker
 * holds a discriminated union; these two functions are the only place that
 * knows how the fields line up.
 */

function amountToApi(amount: DoseAmount): Pick<ApiEntryWrite, "amount_source" | "amount_vials"> {
  return amount.source === "custom"
    ? { amount_source: "custom", amount_vials: amount.vials }
    : { amount_source: amount.source };
}

function amountFromApi(entry: ApiEntry): DoseAmount | undefined {
  if (entry.amount_source === "custom" && entry.amount_vials) {
    return { source: "custom", vials: entry.amount_vials };
  }
  if (entry.amount_source === "routine") return { source: "routine" };
  if (entry.amount_source === "pending") return { source: "pending" };
  return undefined;
}

export function entryToApi(entry: TrackerEntry): ApiEntryWrite {
  switch (entry.kind) {
    case "refill":
    case "follow-up":
      return { id: entry.id, kind: entry.kind, vials: entry.vials };
    case "on-demand":
      return {
        id: entry.id,
        kind: entry.kind,
        vials: entry.vials,
        bleed_nature: entry.nature ?? null,
      };
    case "prophylaxis":
      return { id: entry.id, kind: entry.kind };
    case "makeup":
      return {
        id: entry.id,
        kind: entry.kind,
        missed_date: entry.missedDateKey,
        ...amountToApi(entry.amount),
      };
    case "missed":
      return {
        id: entry.id,
        kind: entry.kind,
        missed_status: entry.status,
        taken_date: entry.takenDateKey ?? null,
        ...(entry.amount ? amountToApi(entry.amount) : {}),
      };
  }
}

/** Undefined for a row the tracker can't represent, so one bad row can't blank the calendar. */
export function entryFromApi(entry: ApiEntry): TrackerEntry | undefined {
  switch (entry.kind) {
    case "refill":
    case "follow-up":
      return entry.vials ? { id: entry.id, kind: entry.kind, vials: entry.vials } : undefined;
    case "on-demand":
      return entry.vials
        ? {
            id: entry.id,
            kind: "on-demand",
            vials: entry.vials,
            ...(entry.bleed_nature ? { nature: entry.bleed_nature } : {}),
          }
        : undefined;
    case "prophylaxis":
      return { id: entry.id, kind: "prophylaxis" };
    case "makeup":
      return entry.missed_date
        ? {
            id: entry.id,
            kind: "makeup",
            missedDateKey: entry.missed_date,
            amount: amountFromApi(entry) ?? { source: "pending" },
          }
        : undefined;
    case "missed":
      return entry.missed_status
        ? {
            id: entry.id,
            kind: "missed",
            status: entry.missed_status,
            takenDateKey: entry.taken_date ?? undefined,
            amount: amountFromApi(entry),
          }
        : undefined;
  }
}

export function entriesFromApi(rows: ApiEntry[]): EntryMap {
  const map: EntryMap = {};
  rows.forEach((row) => {
    const entry = entryFromApi(row);
    if (entry) (map[row.day] ??= []).push(entry);
  });
  return map;
}

/** The answers to "shift future doses?", tracked by entry id. */
export type ShiftAnswers = {
  /** The dose the schedule was shifted to. */
  anchorId?: number;
  /** The latest dose already answered for. */
  handledId?: number;
  /** How far a weekly schedule has been rotated by the shifts so far. */
  weekdayOffset?: number;
};

export function shiftToApi(shift: ShiftAnswers): ApiShift {
  return {
    anchor_id: shift.anchorId ?? null,
    handled_id: shift.handledId ?? null,
    weekday_offset: shift.weekdayOffset ?? 0,
  };
}

export function shiftFromApi(shift: ApiShift): ShiftAnswers {
  return {
    anchorId: shift.anchor_id ?? undefined,
    handledId: shift.handled_id ?? undefined,
    weekdayOffset: shift.weekday_offset || undefined,
  };
}

export function planToApi(plan: PlanAhead): ApiPlan {
  return {
    id: plan.id,
    start_date: plan.startKey,
    end_date: plan.endKey,
    frequency: plan.frequency ?? null,
    vials: plan.vials ?? null,
  };
}

export function planFromApi(plan: ApiPlan): PlanAhead {
  return {
    id: plan.id,
    startKey: plan.start_date,
    endKey: plan.end_date,
    frequency: plan.frequency ?? undefined,
    vials: plan.vials ?? undefined,
  };
}
