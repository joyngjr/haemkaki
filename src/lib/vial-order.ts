import { api, type Occurrence, type Status, type TrackingEvent } from "@/lib/api";

const DOSE_KINDS = new Set<TrackingEvent["kind"]>([
  "prophylaxis",
  "on-demand",
  "follow-up",
  "makeup",
]);

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Next selected order day, clamped to the last day of shorter months. */
function nextMonthlyOrderDate(from: string, dayOfMonth: number): string {
  const start = new Date(`${from}T00:00:00Z`);
  for (let monthOffset = 0; monthOffset <= 1; monthOffset += 1) {
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + monthOffset;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const candidate = new Date(Date.UTC(year, month, Math.min(dayOfMonth, lastDay)))
      .toISOString()
      .slice(0, 10);
    if (candidate >= from) return candidate;
  }
  return from;
}

function settledDates(events: TrackingEvent[]): Set<string> {
  const settled = new Set<string>();
  events.forEach((event) => {
    if (DOSE_KINDS.has(event.kind)) settled.add(event.occurred_on);
    if (event.kind === "makeup" && event.missed_on) settled.add(event.missed_on);
  });
  return settled;
}

function unsettled(occurrences: Occurrence[], events: TrackingEvent[]): Occurrence[] {
  const settled = settledDates(events);
  return occurrences
    .filter((occurrence) => !settled.has(occurrence.on))
    .sort((a, b) => a.on.localeCompare(b.on));
}

/**
 * Replace the API's legacy advice with the patient's monthly order cycle.
 *
 * Project the ledger-owned balance through the dose on the next chosen order
 * day. The recommendation covers every planned dose until the following
 * monthly order day and leaves the selected vial reserve at the end.
 */
export async function withVialOrderAdvice(
  profileId: number,
  status: Status,
  bufferVials: number | null,
  orderDayOfMonth: number | null,
): Promise<Status> {
  const reserve = Math.max(0, Math.floor(bufferVials ?? 0));
  if (!orderDayOfMonth) return { ...status, runs_out_on: null, order: null };

  const orderBy = nextMonthlyOrderDate(status.as_of, orderDayOfMonth);
  const coversUntil = nextMonthlyOrderDate(addDays(orderBy, 1), orderDayOfMonth);
  const [cycleOccurrences, cycleEvents] = await Promise.all([
    api.listOccurrences(profileId, { since: status.as_of, until: coversUntil }),
    api.listEvents(profileId, { since: status.as_of, until: coversUntil }),
  ]);
  if (!status.schedule && cycleOccurrences.length === 0) {
    return { ...status, runs_out_on: null, order: null };
  }

  const occurrences = unsettled(cycleOccurrences, cycleEvents);
  const beforeOrOnOrderDay = occurrences.filter((occurrence) => occurrence.on <= orderBy);
  const nextCycle = occurrences.filter(
    (occurrence) => occurrence.on > orderBy && occurrence.on <= coversUntil,
  );
  const stockAfterOrderDayDose = beforeOrOnOrderDay.reduce(
    (stock, occurrence) => Math.max(0, stock - occurrence.vials),
    status.vials_on_hand,
  );
  const plannedVials = nextCycle.reduce((total, occurrence) => total + occurrence.vials, 0);
  const belowReserve = status.vials_on_hand < reserve;

  return {
    ...status,
    runs_out_on: null,
    order: {
      by_on: orderBy,
      due: belowReserve || orderBy <= status.as_of,
      covers_until: coversUntil,
      planned_doses: nextCycle.length,
      planned_vials: plannedVials,
      leftover_vials: stockAfterOrderDayDose,
      buffer_days: reserve,
      vials: Math.max(0, plannedVials + reserve - stockAfterOrderDayDose),
    },
  };
}
