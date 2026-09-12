import { useMemo, useState, type ReactNode } from "react";

import {
  applyProfile,
  createHomeMockData,
  deriveStockState,
  type AdministerDosePayload,
  type HomeDashboardData,
  type LogBleedPayload,
  type SaveResult,
} from "@/lib/home-data";
import type { Profile } from "@/lib/api";
import { HomeDataContext, type HomeDataContextValue } from "@/state/home-context";
import { useProfiles } from "@/state/profile-context";

/**
 * Home's dashboard state.
 *
 * It lives above the router because the Quick Log button sits in the tab bar:
 * the sheet is rendered by `AppLayout` and has to write to the same data Home
 * reads.
 *
 * The active profile from `@/lib/api` supplies the fields the API actually has
 * — the name, factor type, dose state, stock state and vial count, which is
 * everything the hero scene draws. The rest (dose timings, supplies, the log
 * ledger) has no columns yet and stays demo data, so this file is still the one
 * place mock data and mutations live.
 *
 * Quick Log writes are session-local: they are not sent back to the API, and
 * the tracker keeps its own ledger, so a dose recorded here reaches neither.
 */

const HOUR = 3_600_000;

export function HomeDataProvider({ now, children }: { now?: Date; children: ReactNode }) {
  const clock = useMemo(() => now ?? new Date(), [now]);
  const { activeProfile, status } = useProfiles();
  const [data, setData] = useState<HomeDashboardData>(() => createHomeMockData(clock));

  // Re-seed from the API whenever the active profile loads or changes. Done
  // during render rather than in an effect — React re-runs this component
  // immediately without committing, so the screen never paints one profile's
  // data under another's name. Session edits since the last switch are
  // intentionally overlaid, not merged.
  const [seededFrom, setSeededFrom] = useState<Profile | null>(null);
  if (activeProfile && activeProfile !== seededFrom) {
    setSeededFrom(activeProfile);
    setData((current) => applyProfile(current, activeProfile));
  }

  const value = useMemo<HomeDataContextValue>(() => {
    const administerDose = async (payload: AdministerDosePayload): Promise<SaveResult> => {
      setData((current) => {
        if (!current.treatmentStatus) return current;
        const remaining = Math.max(0, current.medicationStock.remaining - 1);
        const nextDoseAt = new Date(
          new Date(payload.administeredAt).getTime() + 48 * HOUR,
        ).toISOString();
        return {
          ...current,
          lastUpdatedAt: payload.administeredAt,
          treatmentStatus: {
            ...current.treatmentStatus,
            dose: "covered",
            lastDoseAt: payload.administeredAt,
            nextDoseAt,
            estimatedProtectionDays: 2.5,
          },
          activityStatus: { hasLoggedBleed: false },
          medicationStock: {
            ...current.medicationStock,
            remaining,
            state: deriveStockState(remaining),
            estimatedDosesRemaining: Math.floor(remaining / 2),
          },
          recentLogs: [
            {
              id: `dose-${Date.now()}`,
              type: "dose",
              title: "Prophylactic dose",
              ...(payload.dose ? { detail: payload.dose } : {}),
              occurredAt: payload.administeredAt,
            },
            ...current.recentLogs,
          ],
        };
      });
      return { ok: true };
    };

    const logBleed = async (payload: LogBleedPayload): Promise<SaveResult> => {
      setData((current) => ({
        ...current,
        lastUpdatedAt: payload.occurredAt,
        activityStatus: {
          hasLoggedBleed: true,
          lastBleedAt: payload.occurredAt,
          recentBleedLocation: payload.bodyLocation,
        },
        recentLogs: [
          {
            id: `bleed-${Date.now()}`,
            type: "bleed",
            title: `${payload.bodyLocation} bleed`,
            ...(payload.note ? { detail: payload.note } : {}),
            occurredAt: payload.occurredAt,
          },
          ...current.recentLogs,
        ],
      }));
      return { ok: true };
    };

    return {
      data,
      now: clock,
      isLoading: status === "loading",
      administerDose,
      logBleed,
    };
  }, [data, clock, status]);

  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
}
