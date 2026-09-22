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
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

/* ------------------------------------------------------------------ */
/* Frequency — how often prophylaxis is due                            */
/* ------------------------------------------------------------------ */

/**
 * A dose every N days, or on fixed days of the week (0 = Sunday … 6 =
 * Saturday, sorted, at least one). The API stores the same two shapes as
 * `interval_days` / `weekdays` on a series and on a plan, and it — not the
 * page — turns them into dates.
 */
export type Frequency = { unit: "days"; days: number } | { unit: "week"; weekdays: number[] };

/** The API's two columns as one `Frequency`; undefined when neither is set (a plan "as usual"). */
export function frequencyOf(rule: {
  interval_days: number | null;
  weekdays: number[] | null;
}): Frequency | undefined {
  if (rule.weekdays?.length) {
    return { unit: "week", weekdays: [...rule.weekdays].sort((a, b) => a - b) };
  }
  if (rule.interval_days) return { unit: "days", days: rule.interval_days };
  return undefined;
}

/** A `Frequency` as the API's two columns. Undefined means "as the routine has it". */
export function frequencyToApi(frequency: Frequency | undefined): {
  interval_days: number | null;
  weekdays: number[] | null;
} {
  if (!frequency) return { interval_days: null, weekdays: null };
  return frequency.unit === "days"
    ? { interval_days: frequency.days, weekdays: null }
    : { interval_days: null, weekdays: frequency.weekdays };
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
 * How many days a weekly routine moves when a dose lands on `doseDate`: the
 * dose is taken to stand in for the nearest planned weekday, and the whole
 * week moves by the gap. A tie between an early and a late day goes to the
 * late one.
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

/**
 * The frequency a routine would have if its cycle were restarted from a dose
 * on `doseDate`. An interval routine keeps its interval — the new start date
 * is the whole shift; a weekly one rotates its days so the dose's weekday
 * takes the place of the nearest planned one.
 */
export function shiftedFrequency(frequency: Frequency, doseDate: Date): Frequency {
  if (frequency.unit === "days") return frequency;
  return {
    unit: "week",
    weekdays: rotateWeekdays(frequency.weekdays, weekdayShiftFor(frequency.weekdays, doseDate)),
  };
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

/** Today's day key in Singapore — what "today" is filed under in the ledger. */
export function getSingaporeTodayKey() {
  return toKey(getSingaporeToday());
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

/** The first and last day keys of the grid `monthGrid` draws for `month`. */
export function monthGridRange(month: Date): { since: string; until: string } {
  const days = monthGrid(month);
  return { since: toKey(days[0]), until: toKey(days[days.length - 1]) };
}

/** A fixed five-week grid — used by the compact date pickers. */
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
