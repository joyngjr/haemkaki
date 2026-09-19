import { createContext, useContext } from "react";

import type {
  AdministerDosePayload,
  HomeDashboardData,
  LogBleedPayload,
  SaveResult,
} from "@/lib/home-data";

export type HomeDataContextValue = {
  data: HomeDashboardData;
  /** Injectable clock, so relative times are deterministic during a demo. */
  now: Date;
  /** True until the profile list resolves, so Home can hold the skeleton. */
  isLoading: boolean;
  administerDose: (payload: AdministerDosePayload) => Promise<SaveResult>;
  rescheduleDose: (scheduledAt: string) => void;
  logBleed: (payload: LogBleedPayload) => Promise<SaveResult>;
};

export const HomeDataContext = createContext<HomeDataContextValue | null>(null);

export function useHomeData(): HomeDataContextValue {
  const value = useContext(HomeDataContext);
  if (!value) throw new Error("useHomeData must be used inside <HomeDataProvider>");
  return value;
}
