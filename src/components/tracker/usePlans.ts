import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { planFromApi, planToApi, type PlanAhead, type PlanAheadDraft } from "@/lib/tracker-plans";

export type Plans = {
  plans: PlanAhead[];
  /** Bumped after every write, so the planned doses and the fold can be re-read. */
  version: number;
  isLoading: boolean;
  error: string | null;
  add: (draft: PlanAheadDraft) => Promise<boolean>;
  update: (id: number, draft: PlanAheadDraft) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
};

const messageOf = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback;

/**
 * "Plan Ahead", backed by `/users/{id}/plans`.
 *
 * Same shape as `useSchedule`: the API owns what a plan does to the calendar;
 * this hook only lists the plans and reports the writes, each followed by a
 * re-read. `version` moves after a write so `useSchedule` re-asks for the
 * planned doses and `useStatus` re-reads the fold — both depend on the plans.
 */
export function usePlans(profileId: number | undefined): Plans {
  const [plans, setPlans] = useState<PlanAhead[]>([]);
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(profileId !== undefined);
  const [error, setError] = useState<string | null>(null);
  /** Only the newest read may land, so a slow response for the previous profile is dropped. */
  const ticket = useRef(0);

  const load = useCallback((id: number) => {
    const mine = ++ticket.current;
    return api.listPlans(id).then(
      (loaded) => {
        if (mine !== ticket.current) return;
        setPlans(loaded.map(planFromApi));
        setError(null);
        setIsLoading(false);
      },
      (cause: unknown) => {
        if (mine !== ticket.current) return;
        setError(messageOf(cause, "Could not load your plans"));
        setIsLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    if (profileId !== undefined) void load(profileId);
  }, [profileId, load]);

  const write = useCallback(
    async (action: (id: number) => Promise<unknown>) => {
      if (profileId === undefined) return false;
      try {
        await action(profileId);
      } catch (cause) {
        setError(messageOf(cause, "Could not save that plan"));
        return false;
      }
      await load(profileId);
      setVersion((current) => current + 1);
      return true;
    },
    [profileId, load],
  );

  const add = useCallback(
    (draft: PlanAheadDraft) => write((id) => api.createPlan(id, planToApi(draft))),
    [write],
  );
  const update = useCallback(
    (planId: number, draft: PlanAheadDraft) =>
      write((id) => api.replacePlan(id, planId, planToApi(draft))),
    [write],
  );
  const remove = useCallback(
    (planId: number) => write((id) => api.deletePlan(id, planId)),
    [write],
  );

  return { plans, version, isLoading, error, add, update, remove };
}
