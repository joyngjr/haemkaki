import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { applyDiff } from "@/components/tracker/useLedger";
import { api, type Status } from "@/lib/api";
import {
  buildHomeData,
  type AdministerDosePayload,
  type SaveResult,
  type SetUpRoutinePayload,
} from "@/lib/home-data";
import { entriesFromApi, recordProphylaxis } from "@/lib/tracker-entries";
import { HomeDataContext, type HomeDataContextValue } from "@/state/home-context";
import { useProfiles } from "@/state/profile-context";

/**
 * Home's dashboard state, held above the router so routed screens share it.
 *
 * Everything shown is derived: the active profile says who this is, and
 * `/users/{id}/status` says what the event ledger folds to — the last and
 * next dose, the dose state, the last treated bleed. Nothing is seeded, so a
 * profile with no ledger reads as "not enough information" rather than as a
 * demo person, and no profile at all reads as nobody.
 *
 * "Taken" writes a prophylaxis event through the same diff-and-re-read path
 * the tracker uses, so the two screens can never disagree about a day. "Set
 * up routine" starts the first series from the status card; changing or
 * removing one, and moving a planned dose, belong to the tracker.
 *
 * On the one-page desktop layout the tracker's cards sit beside the status
 * card, so the two follow each other: `writeVersion` moves after that write
 * and the tracker re-reads on it, and the tracker calls `refreshStatus` after
 * its own writes. The fold itself is fetched only here — the tracker's supply
 * card and the dose device read `status` rather than keeping a second copy.
 */

type LoadedStatus = {
  profileId: number;
  status: Status;
  fetchedAt: string;
};

export function HomeDataProvider({ now, children }: { now?: Date; children: ReactNode }) {
  const { activeProfile, status: profileStatus, updateProfile } = useProfiles();
  const [clock, setClock] = useState(() => now ?? new Date());
  const [loaded, setLoaded] = useState<LoadedStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [writeVersion, setWriteVersion] = useState(0);
  /** Only the newest request may land, so a slow response for the previous profile is dropped. */
  const ticket = useRef(0);

  const profileId = activeProfile?.id;
  // A profile save returns the profile re-folded, so its `updated_at` moving
  // is the cue that the status may have moved too (the routine, for one).
  const profileVersion = activeProfile?.updated_at;

  const load = useCallback(
    (id: number) => {
      const mine = ++ticket.current;
      return api.getStatus(id).then(
        (status) => {
          if (mine !== ticket.current) return;
          setLoaded({ profileId: id, status, fetchedAt: new Date().toISOString() });
          setStatusError(null);
          setClock(now ?? new Date());
        },
        (cause: unknown) => {
          if (mine !== ticket.current) return;
          // Home stays quiet about this — it is a summary, and the profile
          // row still draws the hero without the timings. The tracker shows it.
          setStatusError(cause instanceof Error ? cause.message : "Could not load your supply");
        },
      );
    },
    [now],
  );

  useEffect(() => {
    if (profileId !== undefined) void load(profileId);
  }, [profileId, profileVersion, load]);

  const refreshStatus = useCallback(async () => {
    if (profileId !== undefined) await load(profileId);
  }, [profileId, load]);

  const administerDose = useCallback(
    async ({ takenOn }: AdministerDosePayload): Promise<SaveResult> => {
      if (profileId === undefined) {
        return { ok: false, message: "Choose a profile before recording a dose." };
      }
      try {
        // Only that day is loaded: the diff never touches an entry it was not
        // shown, and the rule applied is the tracker's own.
        const before = entriesFromApi(
          await api.listEvents(profileId, { since: takenOn, until: takenOn }),
        );
        await applyDiff(profileId, before, recordProphylaxis(before, takenOn, Date.now()));
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof Error ? cause.message : "Could not save the dose.",
        };
      }
      await load(profileId);
      setWriteVersion((current) => current + 1);
      return { ok: true };
    },
    [profileId, load],
  );

  const setUpRoutine = useCallback(
    async ({
      schedule,
      bufferVials,
      orderDayOfMonth,
    }: SetUpRoutinePayload): Promise<SaveResult> => {
      if (profileId === undefined) {
        return { ok: false, message: "Choose a profile before setting up a routine." };
      }
      try {
        // The series first: the buffer and order day only mean something
        // against a routine, and a failed schedule write should not leave
        // them set. They merge into the clinical profile, which the API
        // replaces whole, so a profile without one has nowhere to keep them.
        await api.createSchedule(profileId, { ...schedule, replace: true });
        const clinical = activeProfile?.clinical_profile;
        if (clinical && (bufferVials !== null || orderDayOfMonth !== null)) {
          await updateProfile(profileId, {
            clinical_profile: {
              ...clinical,
              minimum_buffer_vials: bufferVials,
              order_day_of_month: orderDayOfMonth,
            },
          });
        }
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof Error ? cause.message : "Could not save the routine.",
        };
      }
      await load(profileId);
      setWriteVersion((current) => current + 1);
      return { ok: true };
    },
    [profileId, activeProfile, updateProfile, load],
  );

  // Only the active profile's fold; a response for the previous one reads as not yet loaded.
  const current = activeProfile && loaded?.profileId === activeProfile.id ? loaded : null;
  const status = current?.status ?? null;

  const data = useMemo(() => {
    if (!activeProfile) return null;
    return buildHomeData(activeProfile, current?.status ?? null, clock, {
      ...(current ? { fetchedAt: current.fetchedAt } : {}),
    });
  }, [activeProfile, current, clock]);

  const value = useMemo<HomeDataContextValue>(
    () => ({
      data,
      status,
      statusError,
      now: clock,
      isLoading: profileStatus === "loading",
      writeVersion,
      administerDose,
      setUpRoutine,
      refreshStatus,
    }),
    [
      data,
      status,
      statusError,
      clock,
      profileStatus,
      writeVersion,
      administerDose,
      setUpRoutine,
      refreshStatus,
    ],
  );

  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
}
