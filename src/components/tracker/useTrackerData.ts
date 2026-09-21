import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";

import { api, type ApiRoutine, type ApiRoutineUpdate } from "@/lib/api";
import {
  entriesFromApi,
  entryToApi,
  planFromApi,
  planToApi,
  shiftFromApi,
  shiftToApi,
  type ShiftAnswers,
} from "@/lib/tracker-api";
import { fromKey, toKey, type Frequency } from "@/lib/tracker-dates";
import type { EntryMap } from "@/lib/tracker-entries";
import { DEFAULT_INVENTORY, type InventoryState } from "@/lib/tracker-inventory";
import type { PlanAhead } from "@/lib/tracker-plans";

import type { RoutineProps } from "./useRoutine";

type Status = "loading" | "ready" | "error";
type SaveQueue = { current: Promise<void> };

/** Each non-empty day as a string, so two ledgers can be compared day by day. */
function snapshot(entries: EntryMap) {
  const days: Record<string, string> = {};
  Object.entries(entries).forEach(([day, dayEntries]) => {
    if (dayEntries.length) days[day] = JSON.stringify(dayEntries.map(entryToApi));
  });
  return days;
}

const saveShift = (id: number, value: ShiftAnswers) => api.putShift(id, shiftToApi(value));
const savePlans = (id: number, value: PlanAhead[]) => api.replacePlans(id, value.map(planToApi));
const saveInventory = (id: number, value: InventoryState) => api.putInventory(id, value);

/**
 * A value the page edits in memory and this hook mirrors to the backend whenever
 * it differs from what the server last confirmed. `hydrate` sets the loaded
 * value without saving it back.
 */
function useMirrored<T>({
  profileId,
  status,
  initial,
  save,
  queueRef,
  onError,
}: {
  profileId: number | null;
  status: Status;
  initial: T;
  save: (profileId: number, value: T) => Promise<unknown>;
  queueRef: SaveQueue;
  onError: (cause: unknown) => void;
}) {
  const [value, setValueState] = useState(initial);
  const confirmed = useRef(JSON.stringify(initial));

  const hydrate = useCallback((loaded: T) => {
    confirmed.current = JSON.stringify(loaded);
    setValueState(loaded);
  }, []);

  useEffect(() => {
    if (profileId === null || status !== "ready") return;
    const json = JSON.stringify(value);
    if (json === confirmed.current) return;
    const previous = confirmed.current;
    confirmed.current = json;
    queueRef.current = queueRef.current.then(async () => {
      try {
        await save(profileId, value);
      } catch (cause) {
        // Forget that this was saved, so the next change tries again.
        confirmed.current = previous;
        onError(cause);
      }
    });
  }, [value, profileId, status, save, queueRef, onError]);

  const setValue = useCallback(
    (update: SetStateAction<T>) => {
      // Until the load lands, a change would be overwritten by it.
      if (profileId !== null && status === "loading") return;
      setValueState(update);
    },
    [profileId, status],
  );

  return [value, setValue, hydrate] as const;
}

/**
 * The tracker's saved data for one profile: entries, routine, plans, the
 * answers to "shift future doses?", and the Inventory card.
 *
 * The page keeps working on an in-memory copy and this hook mirrors it to the
 * backend, so the rest of the tracker doesn't know a server exists. Entries are
 * saved a whole day at a time, for every day that differs from what the server
 * last confirmed; the smaller pieces are saved whole. With no profile
 * (`profileId` null) nothing is saved.
 *
 * Mount it under `key={profileId}`: it loads once and never resets, so a
 * different profile needs a fresh instance.
 */
export function useTrackerData(profileId: number | null) {
  const [entries, setEntriesState] = useState<EntryMap>({});
  const [savedRoutine, setSavedRoutine] = useState<ApiRoutine | null>(null);
  const [status, setStatus] = useState<Status>(profileId === null ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);

  /** What the server holds, by day. Only touched by the load and the sync. */
  const confirmed = useRef<Record<string, string>>({});
  /** Saves run one after another so an older write can't land after a newer one. */
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const onError = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : "Could not save your changes");
  }, []);

  const mirror = { profileId, status, queueRef, onError };
  const [shift, setShift, hydrateShift] = useMirrored<ShiftAnswers>({
    ...mirror,
    initial: {},
    save: saveShift,
  });
  const [plans, setPlans, hydratePlans] = useMirrored<PlanAhead[]>({
    ...mirror,
    initial: [],
    save: savePlans,
  });
  const [inventory, setInventory, hydrateInventory] = useMirrored<InventoryState>({
    ...mirror,
    initial: DEFAULT_INVENTORY,
    save: saveInventory,
  });

  useEffect(() => {
    if (profileId === null) return;
    let cancelled = false;
    Promise.all([
      api.getRoutine(profileId),
      api.listEntries(profileId),
      api.getShift(profileId),
      api.listPlans(profileId),
      api.getInventory(profileId),
    ]).then(
      ([routine, rows, savedShift, savedPlans, savedInventory]) => {
        if (cancelled) return;
        const loaded = entriesFromApi(rows);
        confirmed.current = snapshot(loaded);
        setEntriesState(loaded);
        setSavedRoutine(routine);
        hydrateShift(shiftFromApi(savedShift));
        hydratePlans(savedPlans.map(planFromApi));
        // Null means the card was never changed, so the starter list stays.
        if (savedInventory) hydrateInventory(savedInventory);
        setStatus("ready");
      },
      (cause: unknown) => {
        if (cancelled) return;
        // Stay in memory: saving over data that failed to load could wipe it.
        setError(cause instanceof Error ? cause.message : "Could not load your tracker");
        setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileId, hydrateShift, hydratePlans, hydrateInventory]);

  useEffect(() => {
    if (profileId === null || status !== "ready") return;
    const current = snapshot(entries);
    const days = new Set([...Object.keys(current), ...Object.keys(confirmed.current)]);
    days.forEach((day) => {
      if (current[day] === confirmed.current[day]) return;
      const previous = confirmed.current[day];
      const next = current[day];
      if (next === undefined) delete confirmed.current[day];
      else confirmed.current[day] = next;
      queueRef.current = queueRef.current.then(async () => {
        try {
          await api.replaceDay(profileId, day, next ? JSON.parse(next) : []);
        } catch (cause) {
          // Forget that this day was saved, so the next change tries it again.
          if (previous === undefined) delete confirmed.current[day];
          else confirmed.current[day] = previous;
          onError(cause);
        }
      });
    });
  }, [entries, profileId, status, onError]);

  const setEntries = useCallback(
    (update: (current: EntryMap) => EntryMap) => {
      // Until the load lands, a change would be overwritten by it.
      if (profileId !== null && status === "loading") return;
      setEntriesState(update);
    },
    [profileId, status],
  );

  const saveRoutine = useCallback(
    (patch: ApiRoutineUpdate) => {
      if (profileId === null) return;
      api.updateRoutine(profileId, patch).then(setSavedRoutine, onError);
    },
    [profileId, onError],
  );

  // A stable object: `useRoutine` treats a new start date as a change from the profile.
  const startKey = savedRoutine?.start_date ?? null;
  const startDate = useMemo(() => (startKey ? fromKey(startKey) : undefined), [startKey]);

  const routineProps: RoutineProps = {
    regularProphylaxisVials: savedRoutine?.vials ?? undefined,
    lastRegularProphylaxisDate: startDate,
    regularProphylaxisFrequency: (savedRoutine?.frequency as Frequency | null) ?? undefined,
    onRegularProphylaxisVialsChange: (vials) => saveRoutine({ vials }),
    onLastRegularProphylaxisDateChange: (date) =>
      saveRoutine({ start_date: date ? toKey(date) : null }),
    onRegularProphylaxisFrequencyChange: (frequency) => saveRoutine({ frequency }),
  };

  return {
    entries,
    setEntries,
    shift,
    setShift,
    plans,
    setPlans,
    inventory,
    setInventory,
    routineProps,
    status,
    error,
    dismissError: () => setError(null),
  };
}
