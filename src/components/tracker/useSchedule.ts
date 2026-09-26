import { useCallback, useEffect, useRef, useState } from "react";

import { api, type Occurrence, type Schedule, type ScheduleDraft } from "@/lib/api";

/** Planned doses keyed by the day they sit on. */
export type OccurrenceMap = Record<string, Occurrence>;

export type ScheduleState = {
  /** The routine: the series with the latest start. Null until one is set. */
  series: Schedule | null;
  /** The planned doses inside the window the calendar asked for. */
  occurrences: OccurrenceMap;
  /** Bumped after every write, so the folded status can be re-read. */
  version: number;
  isLoading: boolean;
  error: string | null;
  /** Start a new routine in place of the old one. Logged doses are untouched. */
  replace: (draft: Omit<ScheduleDraft, "replace">) => Promise<boolean>;
  remove: () => Promise<boolean>;
  /** Move one planned dose to another day; the cycle itself does not change. Only a series' dose can move. */
  move: (occurrence: Occurrence, toKey: string) => Promise<boolean>;
  /** Put a moved dose back on its cycle day. */
  restore: (occurrence: Occurrence) => Promise<boolean>;
};

const messageOf = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback;

/**
 * The prophylaxis routine, backed by `/users/{id}/schedules`.
 *
 * The API owns the recurrence: this hook only asks for the planned doses in a
 * window and reports the writes. Every write is followed by a re-read, and
 * `version` moves so the tracker re-reads the fold too — the order date and
 * the next dose both depend on the schedule.
 *
 * The planned doses also depend on the plans (`usePlans`), so its `version`
 * is passed in as `reloadKey`: a plan write re-reads the window.
 */
export function useSchedule(
  profileId: number | undefined,
  range: { since: string; until: string },
  reloadKey = 0,
): ScheduleState {
  const [series, setSeries] = useState<Schedule | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceMap>({});
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(profileId !== undefined);
  const [error, setError] = useState<string | null>(null);
  /** Only the newest read may land, so a slow response for an earlier window is dropped. */
  const ticket = useRef(0);

  const load = useCallback((id: number, since: string, until: string) => {
    const mine = ++ticket.current;
    return Promise.all([api.listSchedules(id), api.listOccurrences(id, { since, until })]).then(
      ([schedules, planned]) => {
        if (mine !== ticket.current) return;
        setSeries(schedules.length ? schedules[schedules.length - 1] : null);
        setOccurrences(
          Object.fromEntries(planned.map((occurrence) => [occurrence.on, occurrence])),
        );
        setError(null);
        setIsLoading(false);
      },
      (cause: unknown) => {
        if (mine !== ticket.current) return;
        setError(messageOf(cause, "Could not load your routine"));
        setIsLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    if (profileId !== undefined) void load(profileId, range.since, range.until);
  }, [profileId, range.since, range.until, reloadKey, load]);

  const write = useCallback(
    async (action: (id: number) => Promise<unknown>) => {
      if (profileId === undefined) return false;
      try {
        await action(profileId);
      } catch (cause) {
        setError(messageOf(cause, "Could not save that change"));
        return false;
      }
      await load(profileId, range.since, range.until);
      setVersion((current) => current + 1);
      return true;
    },
    [profileId, range.since, range.until, load],
  );

  const replace = useCallback(
    (draft: Omit<ScheduleDraft, "replace">) =>
      write((id) => api.createSchedule(id, { ...draft, replace: true })),
    [write],
  );
  const remove = useCallback(
    () => (series ? write((id) => api.deleteSchedule(id, series.id)) : Promise.resolve(false)),
    [write, series],
  );
  const move = useCallback(
    (occurrence: Occurrence, toKey: string) => {
      const scheduleId = occurrence.schedule_id;
      if (scheduleId === null) {
        // A plan's dose follows the plan; the page never offers to move one.
        setError("That dose comes from a plan. Change the plan instead.");
        return Promise.resolve(false);
      }
      return write((id) => api.moveOccurrence(id, scheduleId, occurrence.original_on, toKey));
    },
    [write],
  );
  const restore = useCallback(
    (occurrence: Occurrence) => {
      const scheduleId = occurrence.schedule_id;
      if (scheduleId === null) return Promise.resolve(false);
      return write((id) => api.restoreOccurrence(id, scheduleId, occurrence.original_on));
    },
    [write],
  );

  return { series, occurrences, version, isLoading, error, replace, remove, move, restore };
}
