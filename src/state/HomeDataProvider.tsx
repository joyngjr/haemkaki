import { useMemo, useState, type ReactNode } from "react";

import {
  createHomeMockData,
  deriveStockState,
  type AdministerDosePayload,
  type HomeDashboardData,
  type LogBleedPayload,
  type SaveResult,
} from "@/lib/home-data";
import { HomeDataContext, type HomeDataContextValue } from "@/state/home-context";

/**
 * Home's dashboard state.
 *
 * It lives above the router because the Quick Log button sits in the tab bar:
 * the sheet is rendered by `AppLayout` and has to write to the same data Home
 * reads. Everything here is still demo data — this is the one place mock data
 * and mutations live, so when the backend grows the fields Home needs, this
 * file is what gets re-implemented.
 *
 * The tracker keeps its own ledger; a dose recorded here does not reach it yet.
 */

const HOUR = 3_600_000;

export function HomeDataProvider({ now, children }: { now?: Date; children: ReactNode }) {
  const clock = useMemo(() => now ?? new Date(), [now]);
  const [data, setData] = useState<HomeDashboardData>(() => createHomeMockData(clock));
  const [announcement, setAnnouncement] = useState("");

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
      announcement,
      announce: setAnnouncement,
      administerDose,
      logBleed,
    };
  }, [data, clock, announcement]);

  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
}
