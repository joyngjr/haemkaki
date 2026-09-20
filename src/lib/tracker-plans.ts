import {
  frequencyLabel,
  fromKey,
  isScheduledProphylaxisDate,
  shortDate,
  toKey,
  weekdayList,
  type Frequency,
} from "@/lib/tracker-dates";

/**
 * A temporary change to the usual routine over a date range — a trip, an
 * illness, a procedure. Either field left unset means "as usual".
 */
export type PlanAhead = {
  id: number;
  /** First and last day of the plan, inclusive, as `YYYY-MM-DD`. */
  startKey: string;
  endKey: string;
  frequency?: Frequency;
  /** Vials per dose while the plan is in effect. */
  vials?: number;
};

/** `YYYY-MM-DD` keys sort the same way the dates do. */
function covers(plan: PlanAhead, dateKey: string) {
  return plan.startKey <= dateKey && dateKey <= plan.endKey;
}

export function planOn(plans: PlanAhead[], date: Date) {
  const key = toKey(date);
  return plans.find((plan) => covers(plan, key));
}

/** Whether a date range clashes with a saved plan, ignoring the plan being edited. */
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

/** Vials per dose on a day: the plan's dosage if one applies, else the routine's. */
export function vialsOn(plans: PlanAhead[], dateKey: string, routineVials: number | undefined) {
  return plans.find((plan) => covers(plan, dateKey))?.vials ?? routineVials;
}

/**
 * Whether a prophylaxis dose is planned for `date`. A plan with its own
 * frequency replaces the routine's for its dates and counts from its first day,
 * which is itself a dose day; otherwise the routine's schedule applies.
 */
export function isPlannedProphylaxisDate(
  date: Date,
  anchorDate: Date | undefined,
  frequency: Frequency | undefined,
  plans: PlanAhead[],
) {
  const plan = planOn(plans, date);
  if (plan?.frequency) {
    if (plan.frequency.unit === "week") return plan.frequency.weekdays.includes(date.getDay());
    const diffDays = Math.round((date.getTime() - fromKey(plan.startKey).getTime()) / 86_400_000);
    return plan.frequency.days > 0 && diffDays % plan.frequency.days === 0;
  }
  return isScheduledProphylaxisDate(date, anchorDate, frequency);
}

export function planDates(plan: PlanAhead) {
  const start = shortDate(fromKey(plan.startKey));
  return plan.startKey === plan.endKey ? start : `${start} – ${shortDate(fromKey(plan.endKey))}`;
}

/** "Every 2 days · 3 vials" */
export function planChanges(plan: PlanAhead) {
  const parts: string[] = [];
  if (plan.frequency) {
    parts.push(
      plan.frequency.unit === "week"
        ? `${frequencyLabel(plan.frequency)} (${weekdayList(plan.frequency.weekdays)})`
        : frequencyLabel(plan.frequency),
    );
  }
  if (plan.vials) parts.push(`${plan.vials} vial${plan.vials === 1 ? "" : "s"} per dose`);
  return parts.join(" · ");
}

export function planStatus(plan: PlanAhead, today: Date): "active" | "upcoming" | "ended" {
  const key = toKey(today);
  if (plan.endKey < key) return "ended";
  return plan.startKey > key ? "upcoming" : "active";
}
