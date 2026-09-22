import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import {
  entriesFromApi,
  entryToApi,
  type EntryMap,
  type TrackerEntry,
} from "@/lib/tracker-entries";

/**
 * The tracker's ledger, backed by `/users/{id}/events`.
 *
 * Every mutation is a pure `EntryMap -> EntryMap`, which is what makes this
 * safe: the change is applied twice, once to local state so the calendar moves
 * under the user's finger, and once inside a serialised queue to whatever the
 * server actually holds. Diffing those two maps produces the writes.
 *
 * Each write is followed by a re-read. It costs one small GET per action and
 * removes the entire class of bug around locally-invented ids: the
 * authoritative ids, and what the fold charged for each entry, only ever
 * arrive from the server.
 */

type Located = { dateKey: string; entry: TrackerEntry };

/** Ids are unique across days, so one flat map is enough to diff by. */
function byId(entries: EntryMap): Map<number, Located> {
  const flat = new Map<number, Located>();
  Object.entries(entries).forEach(([dateKey, dayEntries]) =>
    dayEntries.forEach((entry) => flat.set(entry.id, { dateKey, entry })),
  );
  return flat;
}

function payloadOf({ dateKey, entry }: Located) {
  return JSON.stringify(entryToApi(entry, dateKey));
}

/**
 * Write whatever differs between two ledgers: deletes first, then creates and
 * replacements. Exported for Home, which records a dose through the same path
 * so the calendar and the summary can never disagree about a day.
 */
export async function applyDiff(profileId: number, before: EntryMap, after: EntryMap) {
  const previous = byId(before);
  const next = byId(after);

  for (const [id] of previous) {
    if (!next.has(id)) await api.deleteEvent(profileId, id);
  }
  for (const [id, located] of next) {
    const was = previous.get(id);
    if (!was) {
      await api.createEvent(profileId, entryToApi(located.entry, located.dateKey));
    } else if (payloadOf(was) !== payloadOf(located)) {
      await api.replaceEvent(profileId, id, entryToApi(located.entry, located.dateKey));
    }
  }
}

export type Ledger = {
  entries: EntryMap;
  /** Apply a change locally and to the server. The updater must be pure. */
  mutate: (updater: (current: EntryMap) => EntryMap) => void;
  /** Bumped every time the server's ledger is re-read, so derived views can follow. */
  version: number;
  isLoading: boolean;
  error: string | null;
};

/**
 * `reloadKey` re-reads the ledger when something outside the tracker wrote to
 * it — the status card's "Log dose", on the one-page desktop layout.
 */
export function useLedger(profileId: number | undefined, reloadKey = 0): Ledger {
  const [entries, setEntries] = useState<EntryMap>({});
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * What we believe the server holds, and whose it is. Every diff is taken
   * against this. The profile id travels with it so a write queued during a
   * profile switch cannot diff one person's calendar against another's and
   * delete everything on it.
   */
  const serverState = useRef<{ profileId?: number; entries: EntryMap }>({ entries: {} });
  /** Writes run one at a time; a burst of taps must not race itself. */
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const adopt = useCallback((id: number, loaded: EntryMap) => {
    serverState.current = { profileId: id, entries: loaded };
    setEntries(loaded);
    setVersion((current) => current + 1);
  }, []);

  // Clear on a profile switch during render rather than in an effect — React
  // re-runs this immediately without committing, so the calendar never paints
  // one person's entries under another's name. Same pattern as HomeDataProvider.
  const [loadedFor, setLoadedFor] = useState<number | undefined>(undefined);
  if (profileId !== loadedFor) {
    setLoadedFor(profileId);
    setEntries({});
    setError(null);
    setIsLoading(profileId !== undefined);
  }

  useEffect(() => {
    if (profileId === undefined) return;
    let cancelled = false;
    api.listEvents(profileId).then(
      (events) => {
        if (cancelled) return;
        adopt(profileId, entriesFromApi(events));
        setError(null);
        setIsLoading(false);
      },
      (cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load the tracker");
        setIsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileId, reloadKey, adopt]);

  const mutate = useCallback(
    (updater: (current: EntryMap) => EntryMap) => {
      setEntries(updater);
      if (profileId === undefined) return;
      queue.current = queue.current
        .then(async () => {
          const snapshot = serverState.current;
          // The load for this profile has not landed yet, so there is nothing
          // trustworthy to diff against. Re-read and let the change go rather
          // than write a diff against someone else's calendar.
          if (snapshot.profileId !== profileId) {
            adopt(profileId, entriesFromApi(await api.listEvents(profileId)));
            return;
          }
          // Re-applied to the authoritative state rather than the optimistic
          // one, so a second tap during an in-flight write still diffs against
          // real ids instead of re-creating what the first tap just made.
          await applyDiff(profileId, snapshot.entries, updater(snapshot.entries));
          adopt(profileId, entriesFromApi(await api.listEvents(profileId)));
          setError(null);
        })
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : "Could not save that change");
          // Put the screen back on what the server actually has, so the user is
          // never looking at an entry that was not written.
          setEntries(serverState.current.entries);
        });
    },
    [profileId, adopt],
  );

  return { entries, mutate, version, isLoading, error };
}
