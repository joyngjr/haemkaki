import type { Plan, PlanDraft } from "@/lib/api";
import { vialLabel } from "@/lib/tracker-entries";
import { fromKey, shortDate, toKey } from "@/lib/tracker-dates";

/**
 * A temporary change to the usual routine over a date range — a trip, an
 * illness, a procedure. Either field left unset means "as usual".
 *
 * The API applies a plan inside its fold, so the calendar's planned doses,
 * the run-out date and the order advice all follow it. Nothing here works out
 * a dose day; this module only converts to and from the API's rows and
 * formats a plan for the card.
 */
export type PlanAhead = {
  id: number;
  /** First and last day of the plan, inclusive, as `YYYY-MM-DD`. */
  startKey: string;
  endKey: string;
  /** The days a dose is due, sorted, all inside the plan's dates. */
  doseKeys?: string[];
  /** Vials per dose while the plan is in effect. */
  vials?: number;
};

export type PlanAheadDraft = Omit<PlanAhead, "id">;

export function planFromApi(plan: Plan): PlanAhead {
  return {
    id: plan.id,
    startKey: plan.start_on,
    endKey: plan.end_on,
    ...(plan.dose_dates ? { doseKeys: plan.dose_dates } : {}),
    ...(plan.vials ? { vials: plan.vials } : {}),
  };
}

export function planToApi(draft: PlanAheadDraft): PlanDraft {
  return {
    start_on: draft.startKey,
    end_on: draft.endKey,
    dose_dates: draft.doseKeys ?? null,
    vials: draft.vials ?? null,
  };
}

/**
 * Whether a date range clashes with a saved plan, ignoring the plan being
 * edited. The API refuses an overlap too; this lets the sheet say so before
 * the tap. `YYYY-MM-DD` keys sort the same way the dates do.
 */
export function plansOverlap(
  plans: PlanAhead[],
  startKey: string,
  endKey: string,
  ignoreId?: number,
) {
  return plans.some(
    (plan) => plan.id !== ignoreId && plan.startKey <= endKey && startKey <= plan.endKey,
  );
}

export function planDates(plan: PlanAhead) {
  const start = shortDate(fromKey(plan.startKey));
  return plan.startKey === plan.endKey ? start : `${start} – ${shortDate(fromKey(plan.endKey))}`;
}

/** "Doses on 3 Oct, 5 Oct · 3 vials per dose", or "6 dose days" once the list is long. */
export function planChanges(plan: PlanAhead) {
  const parts: string[] = [];
  if (plan.doseKeys) {
    parts.push(
      plan.doseKeys.length <= 3
        ? `Doses on ${plan.doseKeys.map((key) => shortDate(fromKey(key))).join(", ")}`
        : `${plan.doseKeys.length} dose days`,
    );
  }
  if (plan.vials) parts.push(`${vialLabel(plan.vials)} per dose`);
  return parts.join(" · ");
}

export function planStatus(plan: PlanAhead, today: Date): "active" | "upcoming" | "ended" {
  const key = toKey(today);
  if (plan.endKey < key) return "ended";
  return plan.startKey > key ? "upcoming" : "active";
}
