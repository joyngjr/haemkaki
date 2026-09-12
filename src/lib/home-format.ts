/** Date and time formatting for Home. Pure — every helper takes its clock. */

const DEFAULT_LOCALE = "en-SG";
const DEFAULT_TIME_ZONE = "Asia/Singapore";

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
  if (date.getTime() < now.getTime()) {
    return { day: "Schedule needs attention", dateTime: "", state: "overdue" };
  }
  const day = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    weekday: "long",
    timeZone,
  }).format(date);
  const datePart = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
  const time = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  return { day, dateTime: `${datePart} · ${time}`, state: "scheduled" };
}

export function formatDateTime(date: Date, now: Date, timeZone = DEFAULT_TIME_ZONE): string {
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  const sameDay = dayKey(date) === dayKey(now);
  const isYesterday = dayKey(date) === dayKey(new Date(now.getTime() - 86_400_000));
  const dateLabel = sameDay
    ? "Today"
    : isYesterday
      ? "Yesterday"
      : new Intl.DateTimeFormat(DEFAULT_LOCALE, {
          day: "numeric",
          month: "short",
          timeZone,
        }).format(date);
  const time = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  return `${dateLabel} · ${time}`;
}

export function formatRelativeTime(date: Date, now: Date): string {
  const diffHours = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 3_600_000));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
  }).format(date);
}
