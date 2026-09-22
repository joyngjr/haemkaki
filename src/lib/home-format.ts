/** Date and time formatting for Home. Pure — every helper takes its clock. */

const DEFAULT_LOCALE = "en-SG";
const DEFAULT_TIME_ZONE = "Asia/Singapore";

/**
 * Whether a timestamp carries a meaningful time of day.
 *
 * The event ledger records the day a dose was taken, never the minute — the
 * tracker never asks. Those timestamps land on local midnight, and printing
 * "12:00 am" next to them reads as a real time the app does not know. A dose
 * genuinely logged at midnight loses its time, which is the harmless direction
 * to be wrong in.
 */
function isDayOnly(date: Date, timeZone: string): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
  return parts === "00:00";
}

/** `YYYY-MM-DD` for the instant in the given zone — en-CA formats exactly that. */
function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

/**
 * Whether a scheduled instant has passed.
 *
 * A day-only timestamp (see `isDayOnly`) is "today" for the whole of that day:
 * a dose due on the 20th is not overdue at one second past midnight, only
 * once the 21st arrives. Anything carrying a real time compares as an instant.
 */
export function isOverdue(iso: string, now: Date, timeZone = DEFAULT_TIME_ZONE): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  if (!isDayOnly(date, timeZone)) return date.getTime() < now.getTime();
  return dayKey(date, timeZone) < dayKey(now, timeZone);
}

export function getDayPeriod(date: Date): "Morning" | "Afternoon" | "Evening" {
  const hour = date.getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export interface NextDoseDisplay {
  day: string;
  dateTime: string;
  state: "scheduled" | "overdue" | "missing" | "invalid";
}

export function formatNextDose(
  iso: string | undefined,
  now: Date,
  timeZone = DEFAULT_TIME_ZONE,
): NextDoseDisplay {
  if (!iso) return { day: "Not scheduled", dateTime: "", state: "missing" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: "Unavailable", dateTime: "", state: "invalid" };
  if (isOverdue(iso, now, timeZone)) {
    return { day: "Schedule needs attention", dateTime: "", state: "overdue" };
  }
  const day =
    dayKey(date, timeZone) === dayKey(now, timeZone)
      ? "Today"
      : new Intl.DateTimeFormat(DEFAULT_LOCALE, { weekday: "long", timeZone }).format(date);
  const datePart = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
  if (isDayOnly(date, timeZone)) {
    return { day, dateTime: datePart, state: "scheduled" };
  }
  const time = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  return { day, dateTime: `${datePart} · ${time}`, state: "scheduled" };
}

export function formatDateTime(date: Date, now: Date, timeZone = DEFAULT_TIME_ZONE): string {
  const sameDay = dayKey(date, timeZone) === dayKey(now, timeZone);
  const isYesterday =
    dayKey(date, timeZone) === dayKey(new Date(now.getTime() - 86_400_000), timeZone);
  const dateLabel = sameDay
    ? "Today"
    : isYesterday
      ? "Yesterday"
      : new Intl.DateTimeFormat(DEFAULT_LOCALE, {
          day: "numeric",
          month: "short",
          timeZone,
        }).format(date);
  if (isDayOnly(date, timeZone)) return dateLabel;
  const time = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  return `${dateLabel} · ${time}`;
}
