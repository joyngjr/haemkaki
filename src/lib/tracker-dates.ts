/** Date helpers for the tracker calendar. Everything here works in local time. */

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD`, the key every entry is filed under. */
export function toKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function fromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "Sep 12" — the short form used inside entry text. */
export function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Regular prophylaxis schedule: every `intervalDays` days from `lastDoseDate`, both set during profile creation. */
export function isScheduledProphylaxisDate(
  date: Date,
  lastDoseDate: Date | undefined,
  intervalDays: number | undefined,
) {
  if (!lastDoseDate || !intervalDays) return false;
  const diffDays = Math.round((date.getTime() - lastDoseDate.getTime()) / MS_PER_DAY);
  if (diffDays <= 0) return false;
  return diffDays % intervalDays === 0;
}

/**
 * Today in Singapore, as a local-time midnight.
 *
 * The app is used from one timezone, so the calendar should roll over there
 * rather than wherever the browser happens to be.
 */
export function getSingaporeToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day));
}

/** Whole weeks covering `month`, Sunday-first, padded with neighbouring days. */
export function monthGrid(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const start = new Date(year, monthIndex, 1 - new Date(year, monthIndex, 1).getDay());
  const lastDay = new Date(year, monthIndex + 1, 0);
  const end = new Date(year, monthIndex, lastDay.getDate() + (6 - lastDay.getDay()));
  const total = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  return daysFrom(start, total);
}

/** A fixed five-week grid — used by the compact routine start-date picker. */
export function fixedMonthGrid(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const start = new Date(year, monthIndex, 1 - new Date(year, monthIndex, 1).getDay());
  return daysFrom(start, 35);
}

export function daysFrom(start: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}
