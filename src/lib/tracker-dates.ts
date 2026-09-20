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

/**
 * How often regular prophylaxis is due: a dose every N days, or on fixed days
 * of the week (0 = Sunday … 6 = Saturday, sorted, at least one).
 */
export type Frequency = { unit: "days"; days: number } | { unit: "week"; weekdays: number[] };

/** A stable string for comparing frequencies by value. */
export function frequencyKey(frequency: Frequency | undefined) {
  if (!frequency) return "";
  return frequency.unit === "days" ? `d${frequency.days}` : `w${frequency.weekdays.join(",")}`;
}

/** "Mon, Wed, Fri" */
export function weekdayList(weekdays: number[]) {
  return weekdays.map((day) => DAYS[day]).join(", ");
}

/** "Every 3 days" or "3 times a week". */
export function frequencyLabel(frequency: Frequency) {
  if (frequency.unit === "days") {
    return `Every ${frequency.days} day${frequency.days === 1 ? "" : "s"}`;
  }
  const count = frequency.weekdays.length;
  return `${count} time${count === 1 ? "" : "s"} a week`;
}

/** Move every weekday by `offset` days, wrapping around the week. */
export function rotateWeekdays(weekdays: number[], offset: number) {
  return weekdays.map((day) => (((day + offset) % 7) + 7) % 7).sort((a, b) => a - b);
}

/**
 * How many days the weekly schedule moves when a dose lands on `doseDate`: the
 * dose is taken to stand in for the nearest planned weekday, and the whole week
 * moves by the gap. A tie between an early and a late day goes to the late one.
 */
export function weekdayShiftFor(weekdays: number[], doseDate: Date) {
  let best = 0;
  let bestDistance = Infinity;
  weekdays.forEach((day) => {
    const gap = ((((doseDate.getDay() - day + 3) % 7) + 7) % 7) - 3;
    if (Math.abs(gap) < bestDistance || (Math.abs(gap) === bestDistance && gap > best)) {
      best = gap;
      bestDistance = Math.abs(gap);
    }
  });
  return best;
}

/** The frequency a schedule would have if it were shifted to a dose on `doseDate`. */
export function shiftedFrequency(frequency: Frequency, doseDate: Date): Frequency {
  if (frequency.unit === "days") return frequency;
  return {
    unit: "week",
    weekdays: rotateWeekdays(frequency.weekdays, weekdayShiftFor(frequency.weekdays, doseDate)),
  };
}

/** Regular prophylaxis schedule: counted forward from `lastDoseDate`, on the routine's frequency. */
export function isScheduledProphylaxisDate(
  date: Date,
  lastDoseDate: Date | undefined,
  frequency: Frequency | undefined,
) {
  if (!lastDoseDate || !frequency) return false;
  const diffDays = Math.round((date.getTime() - lastDoseDate.getTime()) / MS_PER_DAY);
  if (diffDays <= 0) return false;
  if (frequency.unit === "days") return frequency.days > 0 && diffDays % frequency.days === 0;
  return frequency.weekdays.includes(date.getDay());
}

/**
 * The next date to place a factor order: a week before the last Tuesday of the
 * month. Once this month's date has passed, it is next month's.
 */
export function nextOrderDate(today: Date) {
  const orderDateIn = (monthOffset: number) => {
    const lastDay = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
    const daysSinceTuesday = (lastDay.getDay() + 5) % 7;
    return new Date(
      lastDay.getFullYear(),
      lastDay.getMonth(),
      lastDay.getDate() - daysSinceTuesday - 7,
    );
  };
  const thisMonth = orderDateIn(0);
  return thisMonth.getTime() >= today.getTime() ? thisMonth : orderDateIn(1);
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
