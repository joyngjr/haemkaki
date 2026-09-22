import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { applyDiff } from "@/components/tracker/useLedger";
import { api, type Status } from "@/lib/api";
import {
  buildHomeData,
  type AdministerDosePayload,
  type MoveDosePayload,
  type SaveResult,
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
 * the tracker uses, so the two screens can never disagree about a day. "Move
 * dose" moves the next planned dose as a calendar exception on the routine,
 * which the tracker shows the same way.
 */

type LoadedStatus = { profileId: number; status: Status; fetchedAt: string };

export function HomeDataProvider({ now, children }: { now?: Date; children: ReactNode }) {
  const { activeProfile, status: profileStatus } = useProfiles();
  const [clock, setClock] = useState(() => now ?? new Date());
  const [loaded, setLoaded] = useState<LoadedStatus | null>(null);
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
          setClock(now ?? new Date());
        },
        () => {
          // Deliberately quiet. Home is a summary; the tracker says out loud
          // when the API is unreachable, and the profile row still draws the
          // hero without the timings.
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
      return { ok: true };
    },
    [profileId, load],
  );

  const moveNextDose = useCallback(
    async ({ movedTo }: MoveDosePayload): Promise<SaveResult> => {
      const next = loaded && loaded.profileId === profileId ? loaded.status.next_dose : null;
      if (profileId === undefined || !next) {
        return { ok: false, message: "There is no planned dose to move." };
      }
      if (next.schedule_id === null) {
        // A plan's doses follow the plan; only the routine's can be moved one at a time.
        return {
          ok: false,
          message: "This dose comes from a plan. Change the plan on the tracker instead.",
        };
      }
      try {
        await api.moveOccurrence(profileId, next.schedule_id, next.original_on, movedTo);
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof Error ? cause.message : "Could not move the dose.",
        };
      }
      await load(profileId);
      return { ok: true };
    },
    [profileId, loaded, load],
  );

  const data = useMemo(() => {
    if (!activeProfile) return null;
    const status = loaded?.profileId === activeProfile.id ? loaded : null;
    return buildHomeData(activeProfile, status?.status ?? null, clock, {
      ...(status ? { fetchedAt: status.fetchedAt } : {}),
    });
  }, [activeProfile, loaded, clock]);

  const value = useMemo<HomeDataContextValue>(
    () => ({
      data,
      now: clock,
      isLoading: profileStatus === "loading",
      administerDose,
      moveNextDose,
      refreshStatus,
    }),
    [data, clock, profileStatus, administerDose, moveNextDose, refreshStatus],
  );

  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
}
